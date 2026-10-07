import { Router } from 'express'
import { compare, hash } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../helper/db.js'
import { auth } from '../helper/auth.js'

const { sign } = jwt
const router = Router()
//access token
const ACCESS_TIME = '5m' 
//refresh token 
const REFRESH_TIME = '10m'
//settings for the refresh token
const cookieSettings = { 
  //javascript cannot access the cookie (protection against cookie theft)
  httpOnly: true,                        
  //enabled in production - disabled in development
  //cookie is sent only over a secure https connection  
  secure: process.env.NODE_ENV === 'production',
  //cookie can be used only for this site
  sameSite: 'strict',   
  //cookie lifetime: 10 minutes(in ms)                       
  maxAge: 10 * 60 * 1000,                        
}

//create access token function
function createAccessToken(user) {
  return sign(
    //put into sign-variable user's id and email from db
    { userId: user.user_id, email: user.email },
    //take the jws secret from env to sign this token
    process.env.JWT_SECRET,
    //lifetime: 5 minutes
    { expiresIn: ACCESS_TIME }
  )
}

//create refresh token function
function createRefreshToken(user) {
  return sign(
    { userId: user.user_id },
    //use a separate secret for signing the refresh token
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TIME }
  )
}


//users/signup
router.post('/signup', async (req, res, next) => {
  try {
    const email = req.body.user?.email?.trim().toLowerCase()
    const password = req.body.user?.password
    if (!email || !password) {
      const error = new Error('Email and password are required')
      error.status = 400
      return next(error)
    }
    //check if this email is already registered->no need to check password
    const existingUser = await pool.query(
      'SELECT user_id from users WHERE email = $1', [email])
    if (existingUser.rows.length > 0){
      return res.status(409).json({error:{message: 'You already have an account. Please sign in.'}})
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      const error = new Error(
      'Password must be at least 8 characters long and contain at least one uppercase letter and one number'
      )
      error.status = 400
      return next(error)
   }
    const hashedPassword = await hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING user_id, email`,
      [email, hashedPassword]
    )

    return res.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === '23505'){
      error.message = 'You already have an account. Please sign in.'
    }
    return next(error)
  }
})

//users/login
router.post('/login', async (req, res, next) => {
  try {
    const email = req.body.user?.email?.trim().toLowerCase()
    const password = req.body.user?.password
    if (!email || !password) {
      const error = new Error('Email and password are required')
      error.status = 400
      return next(error)
    }
    const result = await pool.query(
      'SELECT user_id, email, password_hash FROM users WHERE email = $1',
      [email],
    )
    const dbUser = result.rows[0]
    if (!dbUser || !(await compare(password, dbUser.password_hash))) {
      const error = new Error('Invalid email or password')
      error.status = 401
      return next(error)
    }
    
    //create both tokens
    const accessToken = createAccessToken(dbUser)
    const refreshToken = createRefreshToken(dbUser)

    //add refresh token to db
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE user_id = $2',
      [refreshToken, dbUser.user_id],
    )
    //put refresh token to cookie
    res.cookie('refreshToken', refreshToken, cookieSettings)

    //send access token
    return res.status(200).json({ id: dbUser.user_id, email: dbUser.email, token: accessToken })

  } catch (error) {
    return next(error)
  }
})

//users/refresh
//it gives new tokens if refresh token is alive
router.post('/refresh', async (req, res, next) => {
  try {
    //get refresh token from cookie
    const oldToken = req.cookies.refreshToken
    if (!oldToken) {
      return res.status(401).json({ error: { message: 'No refresh token' } })
    }
  //variable for cheking token  
  let checkedToken;

  try {
    //check info about token using refresh_secret from env
    checkedToken = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET)
  } catch {
    return res.status(403).json({ error: { message: 'Invalid or expired refresh token' } })
  }

  //check if there is a user with this id and this token (checkedToken) in the db

  //this check is neccesary because the token might give info that it is valid and not expired,
  //but the db can show that this token is not anymore in useage (for example, because the user has logged out)
  const checkedTokenDB = await pool.query(
      'SELECT user_id, email FROM users WHERE user_id = $1 AND refresh_token = $2',
      [checkedToken.userId, oldToken],
    )
  //if the db returned 0 rows, no matching user and refresh token were found -> error
  const dbUser = checkedTokenDB.rows[0]
  if (!dbUser) {
    return res.status(403).json({ error: { message: 'Refresh token not found' } })
  }

  //if everything is ok -> new tokens generated:
  const accessToken = createAccessToken(dbUser)
  const newRefreshToken = createRefreshToken(dbUser)
  //add to db newRefreshToken
  await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE user_id = $2',
      [newRefreshToken, dbUser.user_id],
    )
    //add to cookie newRefreshToken
    res.cookie('refreshToken', newRefreshToken, cookieSettings)
return res.status(200).json({ id: dbUser.user_id, email: dbUser.email, token: accessToken })
  } catch (error) {
    return next(error)
  }
})
  
//users/logout
router.post('/logout', async (req, res, next) => {
  try {
    //take refreshToken from cookie
    const refreshToken = req.cookies.refreshToken

    //delete refresh token from db
    if (refreshToken) {
      await pool.query(
        'UPDATE users SET refresh_token = NULL WHERE refresh_token = $1',
        [refreshToken],
      )
    }
    //delete cookie from browser
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' })
    return res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    return next(error)
  }
})

//users/me -> deleting
router.delete('/me', auth, async (req, res, next) => {
  try {
    const userId = req.user.userId

    const result = await pool.query(
      'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
      [userId],
    )

    return res.status(200).json({ message: 'Account deleted successfully' })
  } catch (error) {
    return next(error)
  }
})

export default router
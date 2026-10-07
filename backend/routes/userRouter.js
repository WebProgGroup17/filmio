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

//create access token
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

//create refresh token
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
    const token = sign(
      { userId: dbUser.user_id, email: dbUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    )
    return res.status(200).json({ id: dbUser.user_id, email: dbUser.email, token })
  } catch (error) {
    return next(error)
  }
})

//users/logout
router.post('/logout', auth, (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully' })
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
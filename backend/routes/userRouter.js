import { Router } from 'express'
import { compare, hash } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../helper/db.js'
import { auth } from '../helper/auth.js'

const { sign } = jwt
const router = Router()

//users/signup
router.post('/signup', async (req, res, next) => {
  try {
    const username = req.body?.user?.username
    const email = req.body.user?.email?.trim().toLowerCase()
    const password = req.body.user?.password
    if (!username || !email || !password) {
      const error = new Error('Username, email and password are required')
      error.status = 400
      return next(error)
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
      `INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING user_id, email,username`,
      [email, username, hashedPassword]
    )

    return res.status(201).json(result.rows[0])
  } catch (error) {
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

export default router
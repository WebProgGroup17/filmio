import { Router } from 'express'
import { compare, hash } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../helper/db.js'

const { sign } = jwt
const router = Router()

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
export default router
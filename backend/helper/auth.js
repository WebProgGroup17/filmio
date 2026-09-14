import jwt from 'jsonwebtoken'
import ApiError from './ApiError.js'

const { verify } = jwt
const auth = (req, _res, next) => {
  const [scheme, token] = req.get('authorization')?.split(' ') || []
  if (scheme !== 'Bearer' || !token) {
    const error = new Error('Authentication required')
    error.status = 401
    return next(error)
  }
  try {
    req.user = verify(token, process.env.JWT_SECRET)
    return next()
  } catch {
    return next(new ApiError('Invalid or expired token', 401))
  }
}

export { auth }
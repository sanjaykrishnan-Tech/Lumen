import type { NextFunction, Request, Response } from 'express'
import type { AuthUser } from '@lumen/shared-types'
import { getAccessCookie } from './cookies.js'
import { verifyAccessToken } from './tokens.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getAccessCookie(req)
  const user = token ? verifyAccessToken(token) : null
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  req.user = user
  next()
}

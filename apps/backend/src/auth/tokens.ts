import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

interface AccessPayload {
  sub: string
  email: string
  name: string
}

export function signAccessToken(user: { id: string; email: string; name: string }): string {
  const payload: AccessPayload = { sub: user.id, email: user.email, name: user.name }
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTtlSeconds, algorithm: 'HS256' })
}

export function verifyAccessToken(token: string): { id: string; email: string; name: string } | null {
  try {
    const p = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as AccessPayload
    return { id: p.sub, email: p.email, name: p.name }
  } catch {
    return null
  }
}

export const newRefreshToken = () => randomBytes(32).toString('base64url')
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

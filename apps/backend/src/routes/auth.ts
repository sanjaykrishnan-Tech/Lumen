import { Router, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import type { AuthUser } from '@lumen/shared-types'
import { config } from '../config.js'
import { clearAuthCookies, getRefreshCookie, setAuthCookies } from '../auth/cookies.js'
import { requireAuth } from '../auth/middleware.js'
import { DUMMY_HASH, hashPassword, verifyPassword } from '../auth/password.js'
import { hashToken, newRefreshToken, signAccessToken } from '../auth/tokens.js'
import { createUser, findUserByEmail, findUserById } from '../db/usersRepo.js'
import {
  consumeRefreshToken,
  revokeAllForUser,
  revokeRefreshToken,
  storeRefreshToken,
} from '../db/refreshTokensRepo.js'

const email = z.string().trim().toLowerCase().email().max(254)

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})
const loginSchema = z.object({ email, password: z.string().min(1).max(128) })

// 10 attempts / 15 min / IP on the credential routes slows down brute force
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts, try again later' },
})

async function startSession(res: Response, user: AuthUser) {
  const refreshToken = newRefreshToken()
  await storeRefreshToken(
    user.id,
    hashToken(refreshToken),
    new Date(Date.now() + config.refreshTtlSeconds * 1000),
  )
  setAuthCookies(res, signAccessToken(user), refreshToken)
}

export function createAuthRouter(): Router {
  const router = Router()

  router.post('/register', credentialLimiter, async (req, res) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' })
      return
    }
    const { name, email, password } = parsed.data
    try {
      if (await findUserByEmail(email)) {
        res.status(409).json({ error: 'An account with this email already exists' })
        return
      }
      const user = await createUser({ name, email, passwordHash: await hashPassword(password) })
      await startSession(res, user)
      res.status(201).json({ user })
    } catch (err) {
      // unique-index race between the check above and the insert
      if ((err as { code?: string }).code === '23505') {
        res.status(409).json({ error: 'An account with this email already exists' })
        return
      }
      console.error('Register failed:', err)
      res.status(500).json({ error: 'Registration failed' })
    }
  })

  router.post('/login', credentialLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }
    try {
      const found = await findUserByEmail(parsed.data.email)
      const ok = await verifyPassword(found?.passwordHash ?? DUMMY_HASH, parsed.data.password)
      if (!found || !ok) {
        res.status(401).json({ error: 'Invalid email or password' })
        return
      }
      await startSession(res, found.user)
      res.json({ user: found.user })
    } catch (err) {
      console.error('Login failed:', err)
      res.status(500).json({ error: 'Login failed' })
    }
  })

  // trade a valid refresh cookie for a fresh access + refresh pair
  router.post('/refresh', async (req, res) => {
    const token = getRefreshCookie(req)
    if (!token) {
      res.status(401).json({ error: 'No refresh token' })
      return
    }
    try {
      const result = await consumeRefreshToken(hashToken(token))
      if (result.status === 'reused') await revokeAllForUser(result.userId)
      if (result.status !== 'ok') {
        clearAuthCookies(res)
        res.status(401).json({ error: 'Invalid refresh token' })
        return
      }
      const user = await findUserById(result.userId)
      if (!user) {
        clearAuthCookies(res)
        res.status(401).json({ error: 'Invalid refresh token' })
        return
      }
      await startSession(res, user)
      res.json({ user })
    } catch (err) {
      console.error('Refresh failed:', err)
      res.status(500).json({ error: 'Refresh failed' })
    }
  })

  router.post('/logout', async (req, res) => {
    const token = getRefreshCookie(req)
    try {
      if (token) await revokeRefreshToken(hashToken(token))
    } catch (err) {
      console.error('Logout revoke failed:', err)
    }
    clearAuthCookies(res)
    res.status(204).end()
  })

  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user })
  })

  return router
}

import 'dotenv/config'

const isProd = process.env.NODE_ENV === 'production'

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret) return secret
  if (isProd) throw new Error('JWT_SECRET must be set in production')
  console.warn('JWT_SECRET not set — using an insecure dev secret')
  return 'dev-only-insecure-secret-change-me'
}

// Cross-site deployments (dashboard and API on different domains) need
// SameSite=None + Secure for the browser to send the cookies at all.
const sameSite = (process.env.COOKIE_SAMESITE ?? (isProd ? 'none' : 'lax')) as 'lax' | 'none' | 'strict'

export const config = {
  isProd,
  jwtSecret: jwtSecret(),
  accessTtlSeconds: 15 * 60,
  refreshTtlSeconds: 7 * 24 * 60 * 60,
  cookie: {
    sameSite,
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd || sameSite === 'none',
  },
}

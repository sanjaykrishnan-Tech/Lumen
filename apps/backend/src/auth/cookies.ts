import type { CookieOptions, Request, Response } from 'express'
import { config } from '../config.js'

export const ACCESS_COOKIE = 'lumen_at'
export const REFRESH_COOKIE = 'lumen_rt'
// the refresh cookie is only ever sent to the auth routes
const REFRESH_PATH = '/api/auth'

const base: CookieOptions = {
  httpOnly: true,
  sameSite: config.cookie.sameSite,
  secure: config.cookie.secure,
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...base, path: '/', maxAge: config.accessTtlSeconds * 1000 })
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    path: REFRESH_PATH,
    maxAge: config.refreshTtlSeconds * 1000,
  })
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...base, path: '/' })
  res.clearCookie(REFRESH_COOKIE, { ...base, path: REFRESH_PATH })
}

/** Read a cookie from a raw Cookie header (used by the socket.io handshake). */
export function parseCookieHeader(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}

export const getAccessCookie = (req: Request): string | undefined => req.cookies?.[ACCESS_COOKIE]
export const getRefreshCookie = (req: Request): string | undefined => req.cookies?.[REFRESH_COOKIE]

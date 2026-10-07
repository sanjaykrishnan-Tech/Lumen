import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser } from '@lumen/shared-types'
import { apiFetch, readError, setSessionExpiredHandler, USE_MOCK } from '../services/http'
import { disconnectLiveEvents } from '../services/apiDataService'
import { clearSessionCache, readCachedUser, writeCachedUser } from '../services/sessionCache'
import { AuthContext, type AuthStatus } from './authContext'

// mock mode has no backend, so there is nothing to sign in to
const DEMO_USER: AuthUser = { id: 'demo', email: 'demo@lumen.dev', name: 'Demo User' }

export function AuthProvider({ children }: { children: ReactNode }) {
  // A returning user is shown as signed in right away from the cached copy and
  // verified in the background. With no cached user there is no session to check,
  // so the sign-in page can render without a network round trip.
  const [cachedUser] = useState<AuthUser | null>(() => (USE_MOCK ? DEMO_USER : readCachedUser()))
  const [user, setUser] = useState<AuthUser | null>(cachedUser)
  const [status, setStatus] = useState<AuthStatus>(cachedUser ? 'authenticated' : 'anonymous')

  const clearSession = useCallback(() => {
    clearSessionCache()
    disconnectLiveEvents()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const startSession = useCallback((next: AuthUser) => {
    writeCachedUser(next)
    setUser(next)
    setStatus('authenticated')
  }, [])

  useEffect(() => {
    if (USE_MOCK) return
    setSessionExpiredHandler(clearSession)
    if (!cachedUser) {
      return () => setSessionExpiredHandler(null)
    }

    let active = true
    apiFetch('/api/auth/me')
      .then(async (res) => {
        if (!active) return
        // a 401 already ended the session inside apiFetch; any other failure
        // (5xx, offline, cold-starting server) keeps the cached session
        if (res.ok) startSession(((await res.json()) as { user: AuthUser }).user)
      })
      .catch(() => {})

    return () => {
      active = false
      setSessionExpiredHandler(null)
    }
  }, [cachedUser, clearSession, startSession])

  const authenticate = useCallback(
    async (path: string, body: object, fallback: string) => {
      const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(body), noRefresh: true })
      if (!res.ok) throw new Error(await readError(res, fallback))
      startSession(((await res.json()) as { user: AuthUser }).user)
    },
    [startSession],
  )

  const login = useCallback(
    (email: string, password: string) => authenticate('/api/auth/login', { email, password }, 'Sign in failed'),
    [authenticate],
  )
  const register = useCallback(
    (name: string, email: string, password: string) =>
      authenticate('/api/auth/register', { name, email, password }, 'Sign up failed'),
    [authenticate],
  )

  const logout = useCallback(async () => {
    if (!USE_MOCK) await apiFetch('/api/auth/logout', { method: 'POST', noRefresh: true }).catch(() => {})
    clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

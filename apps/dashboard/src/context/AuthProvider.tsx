import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser } from '@lumen/shared-types'
import { apiFetch, readError, setSessionExpiredHandler, USE_MOCK } from '../services/http'
import { disconnectLiveEvents } from '../services/apiDataService'
import { AuthContext, type AuthStatus } from './authContext'

// mock mode has no backend, so there is nothing to sign in to
const DEMO_USER: AuthUser = { id: 'demo', email: 'demo@lumen.dev', name: 'Demo User' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(USE_MOCK ? DEMO_USER : null)
  const [status, setStatus] = useState<AuthStatus>(USE_MOCK ? 'authenticated' : 'loading')

  const clearSession = useCallback(() => {
    disconnectLiveEvents()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const startSession = useCallback((next: AuthUser) => {
    setUser(next)
    setStatus('authenticated')
  }, [])

  useEffect(() => {
    if (USE_MOCK) return
    setSessionExpiredHandler(clearSession)

    let active = true
    apiFetch('/api/auth/me')
      .then(async (res) => {
        if (!active) return
        if (res.ok) startSession(((await res.json()) as { user: AuthUser }).user)
        else clearSession()
      })
      .catch(() => active && clearSession())

    return () => {
      active = false
      setSessionExpiredHandler(null)
    }
  }, [clearSession, startSession])

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

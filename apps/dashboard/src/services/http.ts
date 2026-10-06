export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

let sessionExpiredHandler: (() => void) | null = null

/** AuthProvider registers this so a dead session anywhere logs the user out. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  sessionExpiredHandler = handler
}

export function expireSession() {
  sessionExpiredHandler?.()
}

// If several requests hit a 401 at once they share one refresh call. Refresh
// tokens rotate and are single-use, so parallel refreshes would trip reuse
// detection on the server and sign the user out.
let refreshInFlight: Promise<boolean> | null = null

export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

interface ApiFetchOptions extends RequestInit {
  /** login/register: a 401 there means "wrong credentials", not "session expired" */
  noRefresh?: boolean
}

/**
 * fetch against the API with cookies attached. On a 401 it silently refreshes
 * the session once and retries; if that fails the session is expired.
 */
export async function apiFetch(path: string, { noRefresh, ...init }: ApiFetchOptions = {}): Promise<Response> {
  const run = () =>
    fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    })

  let res = await run()
  if (res.status === 401 && !noRefresh) {
    if (await refreshSession()) res = await run()
    if (res.status === 401) expireSession()
  }
  return res
}

export async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error ?? fallback
  } catch {
    return fallback
  }
}

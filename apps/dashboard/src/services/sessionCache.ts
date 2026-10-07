import type { AuthUser, Project } from '@lumen/shared-types'

// Display-only copies of the signed-in user and their projects. They let a
// returning visitor render and start loading events immediately instead of
// waiting on /me and /projects first. The server still enforces every request,
// and both are revalidated in the background, so a stale copy can only be wrong
// for a moment.
const USER_KEY = 'lumen.user'
const PROJECTS_PREFIX = 'lumen.projects.'

// storage can be missing or throw (private mode, blocked site data)
function safely<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export function readCachedUser(): AuthUser | null {
  return safely(() => {
    const raw = localStorage.getItem(USER_KEY)
    const user = raw ? (JSON.parse(raw) as Partial<AuthUser>) : null
    return user && typeof user.id === 'string' && typeof user.name === 'string' && typeof user.email === 'string'
      ? (user as AuthUser)
      : null
  }, null)
}

export function writeCachedUser(user: AuthUser) {
  safely(() => localStorage.setItem(USER_KEY, JSON.stringify(user)), undefined)
}

export function readCachedProjects(userId: string): Project[] {
  return safely(() => {
    const raw = localStorage.getItem(PROJECTS_PREFIX + userId)
    const list = raw ? (JSON.parse(raw) as unknown) : null
    return Array.isArray(list) ? (list as Project[]) : []
  }, [])
}

export function writeCachedProjects(userId: string, projects: Project[]) {
  safely(() => localStorage.setItem(PROJECTS_PREFIX + userId, JSON.stringify(projects)), undefined)
}

/** Forget everything about the signed-in user (logout / expired session). */
export function clearSessionCache() {
  safely(() => {
    localStorage.removeItem(USER_KEY)
    // collect first: removing while indexing would skip entries
    const stale: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(PROJECTS_PREFIX)) stale.push(key)
    }
    stale.forEach((key) => localStorage.removeItem(key))
  }, undefined)
}

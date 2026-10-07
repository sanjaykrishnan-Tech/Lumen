import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '@lumen/shared-types'
import {
  clearSessionCache,
  readCachedProjects,
  readCachedUser,
  writeCachedProjects,
  writeCachedUser,
} from './sessionCache'

const user = { id: 'u1', email: 'a@b.co', name: 'Ann' }
const project: Project = { id: 'p1', name: 'P', writeKey: 'lmn_x', role: 'owner', createdAt: '2026-01-01T00:00:00Z' }

function stubStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    },
  })
  return store
}

beforeEach(() => stubStorage())
afterEach(() => vi.unstubAllGlobals())

describe('sessionCache', () => {
  it('round-trips the user and projects', () => {
    writeCachedUser(user)
    writeCachedProjects('u1', [project])
    expect(readCachedUser()).toEqual(user)
    expect(readCachedProjects('u1')).toEqual([project])
  })

  it('keeps projects separate per user', () => {
    writeCachedProjects('u1', [project])
    expect(readCachedProjects('u2')).toEqual([])
  })

  it('ignores corrupt or malformed entries', () => {
    stubStorage({ 'lumen.user': '{not json', 'lumen.projects.u1': '{"a":1}' })
    expect(readCachedUser()).toBeNull()
    expect(readCachedProjects('u1')).toEqual([])
    stubStorage({ 'lumen.user': JSON.stringify({ id: 1 }) })
    expect(readCachedUser()).toBeNull()
  })

  it('clearSessionCache removes the user and every project list', () => {
    const store = stubStorage()
    writeCachedUser(user)
    writeCachedProjects('u1', [project])
    writeCachedProjects('u2', [project])
    store.set('unrelated', 'keep')
    clearSessionCache()
    expect(readCachedUser()).toBeNull()
    expect(readCachedProjects('u1')).toEqual([])
    expect(readCachedProjects('u2')).toEqual([])
    expect(store.get('unrelated')).toBe('keep')
  })

  it('does not throw when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(() => writeCachedUser(user)).not.toThrow()
    expect(readCachedUser()).toBeNull()
    expect(() => clearSessionCache()).not.toThrow()
  })
})

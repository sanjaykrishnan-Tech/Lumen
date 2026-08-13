import type { QueuedEvent } from './types.js'

const QUEUE_KEY = 'lumen_queue'
const ANONYMOUS_ID_KEY = 'lumen_anonymous_id'

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

function randomId(): string {
  return `anon_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

export function getOrCreateAnonymousId(): string {
  if (!hasLocalStorage()) return randomId()

  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY)
  if (existing) return existing

  const id = randomId()
  window.localStorage.setItem(ANONYMOUS_ID_KEY, id)
  return id
}

export function readQueue(): QueuedEvent[] {
  if (!hasLocalStorage()) return []
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueuedEvent[]) : []
  } catch {
    return []
  }
}

export function writeQueue(queue: QueuedEvent[]): void {
  if (!hasLocalStorage()) return
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // storage full or unavailable — drop silently, in-memory queue still holds events
  }
}

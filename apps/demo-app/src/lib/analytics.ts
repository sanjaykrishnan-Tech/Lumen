import { init, track } from '@lumen/sdk'
import type { EventProperties } from '@lumen/sdk'

let initialized = false
let enabled = false

export function initAnalytics(): void {
  if (initialized) return
  initialized = true

  const writeKey = import.meta.env.VITE_LUMEN_WRITE_KEY
  if (!writeKey) {
    // the app should still work without analytics, so don't crash on a missing key
    console.warn('VITE_LUMEN_WRITE_KEY is not set — analytics disabled')
    return
  }

  init({
    apiUrl: import.meta.env.VITE_LUMEN_API_URL ?? 'http://localhost:4000',
    writeKey,
    batchSize: 5,
    flushIntervalMs: 3000,
  })
  enabled = true
}

export function trackEvent(eventName: string, properties?: EventProperties): void {
  if (enabled) track(eventName, properties)
}

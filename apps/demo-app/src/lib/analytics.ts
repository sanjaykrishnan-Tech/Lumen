import { init, track } from '@lumen/sdk'
import type { EventProperties } from '@lumen/sdk'

let initialized = false

export function initAnalytics(): void {
  if (initialized) return
  initialized = true

  init({
    apiUrl: import.meta.env.VITE_LUMEN_API_URL ?? 'http://localhost:4000',
    batchSize: 5,
    flushIntervalMs: 3000,
  })
}

export function trackEvent(eventName: string, properties?: EventProperties): void {
  track(eventName, properties)
}

import { LumenClient } from './client.js'
import type { EventProperties, LumenConfig } from './types.js'

export { LumenClient } from './client.js'
export type { EventProperties, LumenConfig } from './types.js'

let client: LumenClient | null = null

/** Initialize the Lumen SDK. Call this once before track(). */
export function init(config: LumenConfig): void {
  client?.destroy()
  client = new LumenClient(config)
}

/** Queue an event. Auto-batched and flushed by init()'s batchSize/flushIntervalMs. */
export function track(eventName: string, properties?: EventProperties): void {
  if (!client) {
    console.warn('Lumen: track() called before init() — event dropped:', eventName)
    return
  }
  client.track(eventName, properties)
}

/** Force an immediate flush of any queued events (e.g. before navigating away). */
export function flush(): Promise<void> {
  if (!client) return Promise.resolve()
  return client.flush()
}

export default { init, track, flush }

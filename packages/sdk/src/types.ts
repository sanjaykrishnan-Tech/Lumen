export type EventProperties = Record<string, string | number | boolean>

export interface LumenConfig {
  /** Base URL of the Lumen ingestion API, e.g. "https://api.example.com" */
  apiUrl: string
  /** Flush the queue once it reaches this many events. Default: 10 */
  batchSize?: number
  /** Flush the queue on this interval regardless of size, in ms. Default: 5000 */
  flushIntervalMs?: number
  /** Stable identifier for the current user. If omitted, an anonymous id is
   *  generated and persisted in localStorage. */
  userId?: string
}

export interface QueuedEvent {
  eventType: string
  userId: string
  properties: EventProperties
  timestamp: string
}

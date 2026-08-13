import { getOrCreateAnonymousId, readQueue, writeQueue } from './storage.js'
import type { EventProperties, LumenConfig, QueuedEvent } from './types.js'

const DEFAULT_BATCH_SIZE = 10
const DEFAULT_FLUSH_INTERVAL_MS = 5000

export class LumenClient {
  private readonly apiUrl: string
  private readonly batchSize: number
  private readonly flushIntervalMs: number
  private readonly userId: string

  private queue: QueuedEvent[]
  private flushing = false
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(config: LumenConfig) {
    if (!config.apiUrl) throw new Error('Lumen: config.apiUrl is required')

    this.apiUrl = config.apiUrl.replace(/\/$/, '')
    this.batchSize = config.batchSize ?? DEFAULT_BATCH_SIZE
    this.flushIntervalMs = config.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS
    this.userId = config.userId ?? getOrCreateAnonymousId()

    // pick up anything left over from a previous session (e.g. the tab closed offline)
    this.queue = readQueue()

    this.timer = setInterval(() => {
      void this.flush()
    }, this.flushIntervalMs)
  }

  track(eventName: string, properties: EventProperties = {}): void {
    const event: QueuedEvent = {
      eventType: eventName,
      userId: this.userId,
      properties,
      timestamp: new Date().toISOString(),
    }

    this.queue.push(event)
    writeQueue(this.queue)

    if (this.queue.length >= this.batchSize) {
      void this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) return

    this.flushing = true
    // snapshot so track() calls that happen while this request is in flight
    // append to a queue we don't touch until the request settles
    const batch = [...this.queue]

    try {
      const res = await fetch(`${this.apiUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      })

      if (!res.ok) throw new Error(`Lumen: ingestion request failed with ${res.status}`)

      // only drop events that were actually part of this batch — track() may
      // have queued more while the request was in flight
      this.queue = this.queue.slice(batch.length)
      writeQueue(this.queue)
    } catch {
      // network error or non-2xx: leave the queue untouched, retry next interval
    } finally {
      this.flushing = false
    }
  }

  destroy(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}

import type { AnalyticsEvent, DataService, EventFilter } from '../types/analytics'

const EVENT_TYPES = ['page_view', 'click', 'signup', 'purchase', 'search', 'error'] as const
const PAGES = ['/home', '/pricing', '/docs', '/checkout', '/blog', '/settings']
const COUNTRIES = ['US', 'IN', 'GB', 'DE', 'BR', 'JP']

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function generateEvent(timestamp = new Date().toISOString()): AnalyticsEvent {
  const eventType = randomFrom(EVENT_TYPES)
  const properties: AnalyticsEvent['properties'] = {
    page: randomFrom(PAGES),
    country: randomFrom(COUNTRIES),
  }
  if (eventType === 'purchase') {
    properties.amount = Math.round(Math.random() * 500 + 10)
  }
  if (eventType === 'error') {
    properties.statusCode = randomFrom([400, 404, 500, 502])
  }

  return {
    id: randomId(),
    eventType,
    userId: `user_${randomFrom(Array.from({ length: 40 }, (_, i) => i))}`,
    properties,
    timestamp,
  }
}

function generateHistoricalEvents(count: number): AnalyticsEvent[] {
  const now = Date.now()
  const spreadMs = 24 * 60 * 60 * 1000 // last 24h

  const events = Array.from({ length: count }, () =>
    generateEvent(new Date(now - Math.random() * spreadMs).toISOString()),
  )
  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

class MockDataService implements DataService {
  private events: AnalyticsEvent[] = generateHistoricalEvents(400)
  private subscribers: Array<(event: AnalyticsEvent) => void> = []
  private intervalId: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.startSimulation()
  }

  private startSimulation() {
    if (this.intervalId) return
    this.intervalId = setInterval(() => {
      const event = generateEvent()
      this.events.push(event)
      this.subscribers.forEach((cb) => cb(event))
    }, 2000)
  }

  async getEvents(filter?: EventFilter): Promise<AnalyticsEvent[]> {
    let result = this.events

    if (filter?.eventTypes?.length) {
      result = result.filter((e) => filter.eventTypes!.includes(e.eventType))
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      result = result.filter((e) => e.eventType.toLowerCase().includes(q))
    }
    if (filter?.from) {
      result = result.filter((e) => e.timestamp >= filter.from!)
    }
    if (filter?.to) {
      result = result.filter((e) => e.timestamp <= filter.to!)
    }

    return result
  }

  subscribeToEvents(onEvent: (event: AnalyticsEvent) => void): () => void {
    this.subscribers.push(onEvent)
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== onEvent)
    }
  }
}

export const dataService: DataService = new MockDataService()
export { EVENT_TYPES }

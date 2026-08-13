import type { AnalyticsEvent, DataService, EventFilter } from '@lumen/shared-types'
import { filterEvents } from '../utils/filterEvents'

const EVENT_TYPES_WEIGHTED: Array<[string, number]> = [
  ['page_view', 40],
  ['click', 22],
  ['search', 10],
  ['add_to_cart', 8],
  ['signup', 6],
  ['login', 6],
  ['purchase', 4],
  ['logout', 3],
  ['error', 1],
]
const EVENT_TYPES = EVENT_TYPES_WEIGHTED.map(([type]) => type)
const PAGES = ['/home', '/pricing', '/docs', '/checkout', '/blog', '/settings']
const COUNTRIES = ['US', 'IN', 'GB', 'DE', 'BR', 'JP']
const DEVICES = ['desktop', 'mobile', 'tablet']
const REFERRERS = ['direct', 'google', 'twitter', 'newsletter', 'referral']

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomWeightedEventType(): string {
  const total = EVENT_TYPES_WEIGHTED.reduce((sum, [, w]) => sum + w, 0)
  let roll = Math.random() * total
  for (const [type, weight] of EVENT_TYPES_WEIGHTED) {
    roll -= weight
    if (roll <= 0) return type
  }
  return EVENT_TYPES_WEIGHTED[0][0]
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function generateEvent(timestamp = new Date().toISOString()): AnalyticsEvent {
  const eventType = randomWeightedEventType()
  const properties: AnalyticsEvent['properties'] = {
    page: randomFrom(PAGES),
    country: randomFrom(COUNTRIES),
    device: randomFrom(DEVICES),
    referrer: randomFrom(REFERRERS),
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
    userId: `user_${randomFrom(Array.from({ length: 60 }, (_, i) => i))}`,
    properties,
    timestamp,
  }
}

function generateHistoricalEvents(count: number, spanDays: number): AnalyticsEvent[] {
  const now = Date.now()
  const spreadMs = spanDays * 24 * 60 * 60 * 1000

  const events = Array.from({ length: count }, () => {
    // bias toward more recent activity, like a growing product
    const t = Math.pow(Math.random(), 1.6)
    return generateEvent(new Date(now - t * spreadMs).toISOString())
  })
  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

class MockDataService implements DataService {
  private events: AnalyticsEvent[] = generateHistoricalEvents(2500, 30)
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
    return filterEvents(this.events, filter)
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

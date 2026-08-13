import type { AnalyticsEvent, EventFilter } from '../types/analytics'

export function filterEvents(events: AnalyticsEvent[], filter?: EventFilter): AnalyticsEvent[] {
  if (!filter) return events
  let result = events

  if (filter.eventTypes?.length) {
    const types = new Set(filter.eventTypes)
    result = result.filter((e) => types.has(e.eventType))
  }
  if (filter.search) {
    const q = filter.search.toLowerCase()
    result = result.filter((e) => e.eventType.toLowerCase().includes(q))
  }
  if (filter.from) {
    result = result.filter((e) => e.timestamp >= filter.from!)
  }
  if (filter.to) {
    result = result.filter((e) => e.timestamp <= filter.to!)
  }

  return result
}

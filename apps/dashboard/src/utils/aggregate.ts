import type { AnalyticsEvent } from '../types/analytics'

export interface TimeBucket {
  label: string
  count: number
}

export function bucketByHour(events: AnalyticsEvent[], hours = 24): TimeBucket[] {
  const now = new Date()
  const buckets = new Map<string, number>()

  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000)
    const key = `${d.getHours()}:00`
    buckets.set(key, 0)
  }

  for (const event of events) {
    const d = new Date(event.timestamp)
    const key = `${d.getHours()}:00`
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }
  }

  return Array.from(buckets.entries()).map(([label, count]) => ({ label, count }))
}

export interface EventTypeCount {
  eventType: string
  count: number
}

export function countByEventType(events: AnalyticsEvent[]): EventTypeCount[] {
  const counts = new Map<string, number>()
  for (const event of events) {
    counts.set(event.eventType, (counts.get(event.eventType) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([eventType, count]) => ({ eventType, count }))
    .sort((a, b) => b.count - a.count)
}

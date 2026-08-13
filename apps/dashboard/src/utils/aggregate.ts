import { eachDayOfInterval, eachHourOfInterval, format, startOfDay, startOfHour } from 'date-fns'
import type { AnalyticsEvent } from '@lumen/shared-types'

export interface TimeBucket {
  label: string
  count: number
}

interface DateRangeLike {
  from?: Date
  to?: Date
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export function bucketByRange(events: AnalyticsEvent[], range: DateRangeLike): TimeBucket[] {
  const now = new Date()
  const to = range.to ?? now

  let from = range.from
  if (!from) {
    const timestamps = events.map((e) => new Date(e.timestamp).getTime())
    from = timestamps.length ? new Date(Math.min(...timestamps)) : new Date(to.getTime() - DAY_MS)
  }
  if (from >= to) {
    from = new Date(to.getTime() - HOUR_MS)
  }

  const spanMs = to.getTime() - from.getTime()
  const granularity: 'hour' | 'day' = spanMs <= 2 * DAY_MS ? 'hour' : 'day'

  if (granularity === 'hour') {
    const points = eachHourOfInterval({ start: from, end: to })
    const counts = new Map<number, number>()
    for (const p of points) counts.set(p.getTime(), 0)

    for (const event of events) {
      const bucket = startOfHour(new Date(event.timestamp)).getTime()
      if (counts.has(bucket)) counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
    }

    return points.map((p) => ({
      label: format(p, 'MMM d, HH:00'),
      count: counts.get(p.getTime()) ?? 0,
    }))
  }

  const points = eachDayOfInterval({ start: from, end: to })
  const counts = new Map<number, number>()
  for (const p of points) counts.set(p.getTime(), 0)

  for (const event of events) {
    const bucket = startOfDay(new Date(event.timestamp)).getTime()
    if (counts.has(bucket)) counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }

  return points.map((p) => ({
    label: format(p, 'MMM d'),
    count: counts.get(p.getTime()) ?? 0,
  }))
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

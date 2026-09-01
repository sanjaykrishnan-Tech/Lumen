import type { AnalyticsEvent } from '@lumen/shared-types'

export type InsightTone = 'positive' | 'negative' | 'neutral'

export interface Insight {
  id: string
  tone: InsightTone
  text: string
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const ts = (e: AnalyticsEvent) => new Date(e.timestamp).getTime()
const uniqueUsers = (events: AnalyticsEvent[]) => new Set(events.map((e) => e.userId)).size
const errorRate = (events: AnalyticsEvent[]) =>
  events.length ? events.filter((e) => e.eventType === 'error').length / events.length : 0
const signedPct = (delta: number) => `${delta > 0 ? 'up' : 'down'} ${Math.abs(Math.round(delta * 100))}%`

/**
 * Derive a handful of "what changed" callouts for the Overview, comparing the
 * last 24h against the 24h before it. Runs over the full event set (not the
 * dashboard filters) so it always answers "is today normal?".
 */
export function computeInsights(events: AnalyticsEvent[], now: number = Date.now()): Insight[] {
  const insights: Insight[] = []

  const last24 = events.filter((e) => ts(e) >= now - DAY)
  const prev24 = events.filter((e) => ts(e) >= now - 2 * DAY && ts(e) < now - DAY)

  // event volume
  if (prev24.length >= 10) {
    const delta = (last24.length - prev24.length) / prev24.length
    if (Math.abs(delta) >= 0.1) {
      insights.push({
        id: 'volume',
        tone: delta > 0 ? 'positive' : 'negative',
        text: `Events ${signedPct(delta)} vs the prior 24h (${last24.length.toLocaleString()} vs ${prev24.length.toLocaleString()})`,
      })
    }
  }

  // active users
  const lastUsers = uniqueUsers(last24)
  const prevUsers = uniqueUsers(prev24)
  if (prevUsers >= 5) {
    const delta = (lastUsers - prevUsers) / prevUsers
    if (Math.abs(delta) >= 0.15) {
      insights.push({
        id: 'users',
        tone: delta > 0 ? 'positive' : 'negative',
        text: `Active users ${signedPct(delta)} vs the prior 24h (${lastUsers} vs ${prevUsers})`,
      })
    }
  }

  // error rate
  const lastErr = errorRate(last24)
  if (last24.length >= 20 && lastErr > 0) {
    const prevErr = errorRate(prev24)
    if (lastErr >= 0.02 || lastErr > prevErr * 1.5) {
      insights.push({
        id: 'errors',
        tone: 'negative',
        text: `Error rate at ${(lastErr * 100).toFixed(1)}% over the last 24h${
          prevErr > 0 ? ` (was ${(prevErr * 100).toFixed(1)}%)` : ''
        }`,
      })
    }
  }

  // newly-seen event types
  const firstSeen = new Map<string, number>()
  for (const e of events) {
    const t = ts(e)
    const current = firstSeen.get(e.eventType)
    if (current == null || t < current) firstSeen.set(e.eventType, t)
  }
  const fresh = [...firstSeen.entries()].filter(([, t]) => t >= now - DAY).map(([type]) => type)
  if (fresh.length > 0 && fresh.length < firstSeen.size) {
    insights.push({
      id: 'new-type',
      tone: 'neutral',
      text: `New event type${fresh.length > 1 ? 's' : ''} first seen today: ${fresh.slice(0, 3).join(', ')}`,
    })
  }

  // busiest hour
  if (last24.length >= 12) {
    const byHour = new Map<number, number>()
    for (const e of last24) {
      const h = new Date(ts(e)).getHours()
      byHour.set(h, (byHour.get(h) ?? 0) + 1)
    }
    let peakHour = 0
    let peakCount = 0
    for (const [h, c] of byHour) {
      if (c > peakCount) {
        peakCount = c
        peakHour = h
      }
    }
    const pad = (n: number) => String(n).padStart(2, '0')
    insights.push({
      id: 'peak',
      tone: 'neutral',
      text: `Busiest hour was ${pad(peakHour)}:00–${pad((peakHour + 1) % 24)}:00 (${peakCount.toLocaleString()} events)`,
    })
  }

  return insights
}

import type { AnalyticsEvent } from '@lumen/shared-types'

export interface UserEvent {
  eventType: string
  ts: number
}

/**
 * Group events by userId into per-user, chronologically-sorted timelines.
 * Shared by the funnel and retention analyses.
 */
export function groupByUser(events: AnalyticsEvent[]): Map<string, UserEvent[]> {
  const byUser = new Map<string, UserEvent[]>()

  for (const e of events) {
    const list = byUser.get(e.userId)
    const entry: UserEvent = { eventType: e.eventType, ts: new Date(e.timestamp).getTime() }
    if (list) list.push(entry)
    else byUser.set(e.userId, [entry])
  }

  for (const list of byUser.values()) {
    list.sort((a, b) => a.ts - b.ts)
  }

  return byUser
}

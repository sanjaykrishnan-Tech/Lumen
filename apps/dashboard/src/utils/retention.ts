import { startOfDay, startOfWeek } from 'date-fns'
import type { AnalyticsEvent } from '@lumen/shared-types'
import { groupByUser } from './groupByUser'

export type Granularity = 'day' | 'week'

export interface RetentionOptions {
  /** event that places a user in a cohort; null = the user's first event of any type */
  bornEvent: string | null
  /** event that counts as "returned"; null = any event */
  returnEvent: string | null
  granularity: Granularity
  from?: number
  to?: number
  /** hard cap on how many periods to show */
  maxPeriods?: number
}

export interface RetentionRow {
  cohort: number
  size: number
  /** retention fraction per period offset; null = period hasn't fully elapsed yet */
  values: (number | null)[]
}

export interface RetentionResult {
  granularity: Granularity
  periods: number[]
  rows: RetentionRow[]
  averages: (number | null)[]
}

const DAY_MS = 24 * 60 * 60 * 1000

function periodMs(granularity: Granularity): number {
  return granularity === 'week' ? 7 * DAY_MS : DAY_MS
}

function periodStart(ts: number, granularity: Granularity): number {
  return granularity === 'week'
    ? startOfWeek(ts, { weekStartsOn: 1 }).getTime()
    : startOfDay(ts).getTime()
}

export function computeRetention(events: AnalyticsEvent[], options: RetentionOptions): RetentionResult {
  const { bornEvent, returnEvent, granularity, from, to } = options
  const step = periodMs(granularity)
  const hardCap = options.maxPeriods ?? (granularity === 'week' ? 8 : 14)
  const now = Date.now()
  const upper = to != null ? Math.min(to, now) : now

  const scoped = events.filter((e) => {
    const ts = new Date(e.timestamp).getTime()
    if (from != null && ts < from) return false
    if (to != null && ts > to) return false
    return true
  })

  const byUser = groupByUser(scoped)

  // cohort start -> { size, activity: Map<periodOffset, Set<userId>> }
  const cohorts = new Map<number, { users: Set<string>; active: Map<number, Set<string>> }>()

  for (const [userId, timeline] of byUser) {
    const born = timeline.find((e) => bornEvent == null || e.eventType === bornEvent)
    if (!born) continue

    const cohortStart = periodStart(born.ts, granularity)
    let cohort = cohorts.get(cohortStart)
    if (!cohort) {
      cohort = { users: new Set(), active: new Map() }
      cohorts.set(cohortStart, cohort)
    }
    cohort.users.add(userId)

    for (const e of timeline) {
      if (returnEvent != null && e.eventType !== returnEvent) continue
      const offset = Math.floor((periodStart(e.ts, granularity) - cohortStart) / step)
      if (offset < 0) continue
      let set = cohort.active.get(offset)
      if (!set) {
        set = new Set()
        cohort.active.set(offset, set)
      }
      set.add(userId)
    }
  }

  const sortedStarts = [...cohorts.keys()].sort((a, b) => a - b)
  const earliest = sortedStarts[0]
  const maxElapsed = earliest != null ? Math.floor((upper - earliest) / step) : 0
  const periodCount = Math.max(1, Math.min(hardCap, maxElapsed + 1))
  const periods = Array.from({ length: periodCount }, (_, i) => i)

  const rows: RetentionRow[] = sortedStarts.map((cohortStart) => {
    const cohort = cohorts.get(cohortStart)!
    const size = cohort.users.size
    const values = periods.map((offset) => {
      const periodEnd = cohortStart + (offset + 1) * step
      if (periodEnd > upper) return null
      const active = cohort.active.get(offset)?.size ?? 0
      return size ? active / size : 0
    })
    return { cohort: cohortStart, size, values }
  })

  const averages = periods.map((_, offset) => {
    let weighted = 0
    let total = 0
    for (const row of rows) {
      const v = row.values[offset]
      if (v == null) continue
      weighted += v * row.size
      total += row.size
    }
    return total ? weighted / total : null
  })

  return { granularity, periods, rows, averages }
}

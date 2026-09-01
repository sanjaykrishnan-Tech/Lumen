import type { AnalyticsEvent } from '@lumen/shared-types'
import { groupByUser, type UserEvent } from './groupByUser'

export interface FunnelStepResult {
  eventType: string
  /** users who reached this step (and every step before it) */
  count: number
  /** count / step[0].count */
  pctOfFirst: number
  /** count / previous step count (1 for the first step) */
  pctOfPrev: number
}

export interface FunnelResult {
  steps: FunnelStepResult[]
  entered: number
  converted: number
  overallPct: number
  /** median ms between entering step 0 and completing the last step, for converters */
  medianMsToConvert: number | null
}

export interface FunnelOptions {
  steps: string[]
  /** conversion window from entering step 0, in ms; null = no time limit */
  windowMs: number | null
  from?: number
  to?: number
}

/**
 * For one user's timeline, walk the ordered steps. Each step must occur at or
 * after the previous step's matched timestamp, and (if a window is set) within
 * windowMs of the first step. Returns how many steps were completed and the
 * timestamp the final completed step landed on.
 */
function walkSteps(
  timeline: UserEvent[],
  steps: string[],
  windowMs: number | null,
): { depth: number; startTs: number; endTs: number } {
  const firstIdx = timeline.findIndex((e) => e.eventType === steps[0])
  if (firstIdx === -1) return { depth: 0, startTs: 0, endTs: 0 }

  const startTs = timeline[firstIdx].ts
  const deadline = windowMs == null ? Infinity : startTs + windowMs

  let depth = 1
  let cursorTs = startTs
  let searchFrom = firstIdx + 1

  for (let s = 1; s < steps.length; s++) {
    let matched = -1
    for (let i = searchFrom; i < timeline.length; i++) {
      const e = timeline[i]
      if (e.ts > deadline) break
      if (e.ts >= cursorTs && e.eventType === steps[s]) {
        matched = i
        break
      }
    }
    if (matched === -1) break
    depth++
    cursorTs = timeline[matched].ts
    searchFrom = matched + 1
  }

  return { depth, startTs, endTs: cursorTs }
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export function computeFunnel(events: AnalyticsEvent[], options: FunnelOptions): FunnelResult | null {
  const { steps, windowMs, from, to } = options
  if (steps.length < 2 || steps.some((s) => !s)) return null

  const scoped = events.filter((e) => {
    const ts = new Date(e.timestamp).getTime()
    if (from != null && ts < from) return false
    if (to != null && ts > to) return false
    return true
  })

  const byUser = groupByUser(scoped)

  const reachedAtDepth = new Array<number>(steps.length + 1).fill(0)
  const convertTimes: number[] = []

  for (const timeline of byUser.values()) {
    const { depth, startTs, endTs } = walkSteps(timeline, steps, windowMs)
    if (depth === 0) continue
    reachedAtDepth[depth]++
    if (depth === steps.length) convertTimes.push(endTs - startTs)
  }

  // users who reached >= step i
  const atLeast = new Array<number>(steps.length).fill(0)
  for (let i = 0; i < steps.length; i++) {
    for (let d = i + 1; d <= steps.length; d++) atLeast[i] += reachedAtDepth[d]
  }

  const entered = atLeast[0]
  const stepResults: FunnelStepResult[] = steps.map((eventType, i) => ({
    eventType,
    count: atLeast[i],
    pctOfFirst: entered ? atLeast[i] / entered : 0,
    pctOfPrev: i === 0 ? 1 : atLeast[i - 1] ? atLeast[i] / atLeast[i - 1] : 0,
  }))

  const converted = atLeast[steps.length - 1]

  return {
    steps: stepResults,
    entered,
    converted,
    overallPct: entered ? converted / entered : 0,
    medianMsToConvert: median(convertTimes),
  }
}

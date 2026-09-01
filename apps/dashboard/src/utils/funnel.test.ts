import { describe, expect, it } from 'vitest'
import type { AnalyticsEvent } from '@lumen/shared-types'
import { computeFunnel } from './funnel'

const HOUR = 60 * 60 * 1000
const base = Date.parse('2026-01-01T00:00:00Z')

function ev(userId: string, eventType: string, offsetMs: number): AnalyticsEvent {
  return {
    id: `${userId}-${eventType}-${offsetMs}`,
    userId,
    eventType,
    properties: {},
    timestamp: new Date(base + offsetMs).toISOString(),
  }
}

describe('computeFunnel', () => {
  it('returns null for fewer than two steps', () => {
    expect(computeFunnel([], { steps: ['a'], windowMs: null })).toBeNull()
    expect(computeFunnel([], { steps: ['a', ''], windowMs: null })).toBeNull()
  })

  it('counts ordered step completion per user', () => {
    const events = [
      // u1: full funnel
      ev('u1', 'view', 0),
      ev('u1', 'signup', HOUR),
      ev('u1', 'purchase', 2 * HOUR),
      // u2: drops after step 1
      ev('u2', 'view', 0),
      ev('u2', 'signup', HOUR),
      // u3: only step 0
      ev('u3', 'view', 0),
      // u4: does steps out of order -> only step 0 counts
      ev('u4', 'signup', 0),
      ev('u4', 'view', HOUR),
    ]

    const result = computeFunnel(events, { steps: ['view', 'signup', 'purchase'], windowMs: null })!
    expect(result.steps.map((s) => s.count)).toEqual([4, 2, 1])
    expect(result.entered).toBe(4)
    expect(result.converted).toBe(1)
    expect(result.overallPct).toBeCloseTo(0.25)
    expect(result.steps[1].pctOfPrev).toBeCloseTo(0.5)
  })

  it('enforces the conversion window from the first step', () => {
    const events = [
      ev('u1', 'view', 0),
      ev('u1', 'signup', 30 * 60 * 1000), // 30 min later -> inside 1h window
      ev('u2', 'view', 0),
      ev('u2', 'signup', 3 * HOUR), // outside window
    ]

    const result = computeFunnel(events, { steps: ['view', 'signup'], windowMs: HOUR })!
    expect(result.converted).toBe(1)
  })

  it('reports median time to convert for converters only', () => {
    const events = [
      ev('u1', 'view', 0),
      ev('u1', 'done', 2 * HOUR),
      ev('u2', 'view', 0),
      ev('u2', 'done', 4 * HOUR),
      ev('u3', 'view', 0), // never converts, excluded from median
    ]

    const result = computeFunnel(events, { steps: ['view', 'done'], windowMs: null })!
    expect(result.medianMsToConvert).toBe(3 * HOUR)
  })

  it('respects the date range filter', () => {
    const events = [
      ev('u1', 'view', 0),
      ev('u1', 'done', HOUR),
      ev('u2', 'view', 10 * HOUR),
      ev('u2', 'done', 11 * HOUR),
    ]

    const result = computeFunnel(events, {
      steps: ['view', 'done'],
      windowMs: null,
      from: base + 5 * HOUR,
    })!
    expect(result.entered).toBe(1)
    expect(result.converted).toBe(1)
  })
})

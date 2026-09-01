import { describe, expect, it } from 'vitest'
import type { AnalyticsEvent } from '@lumen/shared-types'
import { computeRetention } from './retention'

const DAY = 24 * 60 * 60 * 1000
// a Monday, so day and week cohorts line up
const base = Date.parse('2026-01-05T12:00:00Z')

function ev(userId: string, eventType: string, dayOffset: number): AnalyticsEvent {
  return {
    id: `${userId}-${eventType}-${dayOffset}`,
    userId,
    eventType,
    properties: {},
    timestamp: new Date(base + dayOffset * DAY).toISOString(),
  }
}

describe('computeRetention', () => {
  it('groups users into daily cohorts by first event and tracks return periods', () => {
    const events = [
      // cohort day 0: u1 returns on day 1 and day 3; u2 never returns
      ev('u1', 'login', 0),
      ev('u1', 'login', 1),
      ev('u1', 'login', 3),
      ev('u2', 'login', 0),
    ]

    const result = computeRetention(events, {
      bornEvent: null,
      returnEvent: null,
      granularity: 'day',
      to: base + 10 * DAY,
      maxPeriods: 5,
    })

    expect(result.rows).toHaveLength(1)
    const row = result.rows[0]
    expect(row.size).toBe(2)
    expect(row.values[0]).toBeCloseTo(1) // D0: both active
    expect(row.values[1]).toBeCloseTo(0.5) // D1: only u1
    expect(row.values[2]).toBeCloseTo(0) // D2: nobody
    expect(row.values[3]).toBeCloseTo(0.5) // D3: u1 again
  })

  it('nulls out periods that have not fully elapsed', () => {
    const events = [ev('u1', 'login', 0)]
    const result = computeRetention(events, {
      bornEvent: null,
      returnEvent: null,
      granularity: 'day',
      to: base + 2 * DAY, // only D0 and D1 are complete
      maxPeriods: 5,
    })
    const row = result.rows[0]
    expect(row.values[0]).not.toBeNull()
    expect(row.values[1]).not.toBeNull()
    expect(row.values[2]).toBeNull()
  })

  it('respects bornEvent and returnEvent selectors', () => {
    const events = [
      ev('u1', 'signup', 0),
      ev('u1', 'purchase', 1),
      ev('u2', 'signup', 0),
      ev('u2', 'login', 1), // not a purchase -> not retained
    ]
    const result = computeRetention(events, {
      bornEvent: 'signup',
      returnEvent: 'purchase',
      granularity: 'day',
      to: base + 5 * DAY,
      maxPeriods: 3,
    })
    expect(result.rows[0].size).toBe(2)
    expect(result.rows[0].values[1]).toBeCloseTo(0.5)
  })

  it('weights the average row by cohort size', () => {
    const events = [
      // day 0 cohort: 2 users, both return on D1
      ev('a1', 'login', 0),
      ev('a1', 'login', 1),
      ev('a2', 'login', 0),
      ev('a2', 'login', 1),
      // day 1 cohort: 1 user, no return on its D1
      ev('b1', 'login', 1),
    ]
    const result = computeRetention(events, {
      bornEvent: null,
      returnEvent: null,
      granularity: 'day',
      to: base + 10 * DAY,
      maxPeriods: 3,
    })
    // D1 average = (2*1.0 + 1*0.0) / 3
    expect(result.averages[1]).toBeCloseTo(2 / 3)
  })
})

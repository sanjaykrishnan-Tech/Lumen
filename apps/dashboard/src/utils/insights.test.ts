import { describe, expect, it } from 'vitest'
import type { AnalyticsEvent } from '@lumen/shared-types'
import { computeInsights } from './insights'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const NOW = Date.parse('2026-02-01T12:00:00Z')

let seq = 0
function ev(eventType: string, msAgo: number, userId = `u${seq++}`): AnalyticsEvent {
  return {
    id: `e${seq++}`,
    userId,
    eventType,
    properties: {},
    timestamp: new Date(NOW - msAgo).toISOString(),
  }
}

describe('computeInsights', () => {
  it('flags a volume jump vs the prior 24h', () => {
    const events = [
      ...Array.from({ length: 40 }, () => ev('click', 2 * HOUR)),
      ...Array.from({ length: 10 }, () => ev('click', DAY + 2 * HOUR)),
    ]
    const volume = computeInsights(events, NOW).find((i) => i.id === 'volume')
    expect(volume?.tone).toBe('positive')
    expect(volume?.text).toContain('up 300%')
  })

  it('flags an elevated error rate in the last 24h', () => {
    const events = [
      ...Array.from({ length: 90 }, () => ev('click', 3 * HOUR)),
      ...Array.from({ length: 10 }, () => ev('error', 3 * HOUR)),
    ]
    const errors = computeInsights(events, NOW).find((i) => i.id === 'errors')
    expect(errors?.tone).toBe('negative')
    expect(errors?.text).toContain('10.0%')
  })

  it('flags a newly-seen event type but not on the first ever load', () => {
    const withHistory = [
      ...Array.from({ length: 5 }, () => ev('click', 10 * DAY)),
      ev('new_feature_used', 2 * HOUR),
    ]
    expect(computeInsights(withHistory, NOW).find((i) => i.id === 'new-type')?.text).toContain(
      'new_feature_used',
    )

    const everythingNew = [ev('a', HOUR), ev('b', HOUR)]
    expect(computeInsights(everythingNew, NOW).find((i) => i.id === 'new-type')).toBeUndefined()
  })

  it('stays quiet when nothing crosses a threshold', () => {
    const events = [
      ...Array.from({ length: 20 }, () => ev('click', 3 * HOUR)),
      ...Array.from({ length: 20 }, () => ev('click', DAY + 3 * HOUR)),
    ]
    const ids = computeInsights(events, NOW).map((i) => i.id)
    expect(ids).not.toContain('volume')
    expect(ids).not.toContain('errors')
  })
})

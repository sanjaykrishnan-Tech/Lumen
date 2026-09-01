import { useMemo } from 'react'
import { useEventsContext } from '../context/eventsContext'
import { useRetentionConfig } from '../hooks/useRetentionConfig'
import { DateRangePicker } from '../components/DateRangePicker'
import { RetentionGrid } from '../components/RetentionGrid'
import { LoadingState } from '../components/LoadingState'
import { computeRetention } from '../utils/retention'

export function Retention() {
  const { events, loading } = useEventsContext()
  const [config, setConfig] = useRetentionConfig()

  const eventTypeOptions = useMemo(
    () => Array.from(new Set(events.map((e) => e.eventType))).sort(),
    [events],
  )

  const result = useMemo(
    () =>
      computeRetention(events, {
        bornEvent: config.bornEvent,
        returnEvent: config.returnEvent,
        granularity: config.granularity,
        from: config.from?.getTime(),
        to: config.to?.getTime(),
      }),
    [events, config],
  )

  if (loading) return <LoadingState />

  const selectClass =
    'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500'

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-400">
            First did
            <select
              value={config.bornEvent ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, bornEvent: e.target.value || null }))}
              className={selectClass}
            >
              <option value="">Any event</option>
              {eventTypeOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-400">
            Then came back and did
            <select
              value={config.returnEvent ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, returnEvent: e.target.value || null }))}
              className={selectClass}
            >
              <option value="">Any event</option>
              {eventTypeOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          <div className="flex rounded-md border border-gray-300 p-0.5">
            {(['day', 'week'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, granularity: g }))}
                className={`rounded px-3 py-1.5 text-sm font-medium capitalize transition ${
                  config.granularity === g ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {g}ly
              </button>
            ))}
          </div>

          <DateRangePicker
            value={{ from: config.from, to: config.to }}
            onChange={(range) => setConfig((c) => ({ ...c, from: range.from, to: range.to }))}
          />
        </div>
      </div>

      <div className="mt-6">
        <RetentionGrid result={result} />
      </div>
    </>
  )
}

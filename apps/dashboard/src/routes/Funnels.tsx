import { useMemo } from 'react'
import { useEventsContext } from '../context/eventsContext'
import { FUNNEL_WINDOWS, useFunnelConfig, windowMsFor } from '../hooks/useFunnelConfig'
import { DateRangePicker } from '../components/DateRangePicker'
import { StepBuilder } from '../components/StepBuilder'
import { FunnelChart } from '../components/FunnelChart'
import { LoadingState } from '../components/LoadingState'
import { computeFunnel } from '../utils/funnel'

export function Funnels() {
  const { events, loading } = useEventsContext()
  const [config, setConfig] = useFunnelConfig()

  const eventTypeOptions = useMemo(
    () => Array.from(new Set(events.map((e) => e.eventType))).sort(),
    [events],
  )

  const result = useMemo(
    () =>
      computeFunnel(events, {
        steps: config.steps,
        windowMs: windowMsFor(config.windowKey),
        from: config.from?.getTime(),
        to: config.to?.getTime(),
      }),
    [events, config],
  )

  if (loading) return <LoadingState />

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-gray-500">Funnel steps</h2>
          <div className="flex items-center gap-2">
            <select
              value={config.windowKey}
              onChange={(e) => setConfig((c) => ({ ...c, windowKey: e.target.value }))}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {FUNNEL_WINDOWS.map((w) => (
                <option key={w.key} value={w.key}>
                  {w.label}
                </option>
              ))}
            </select>
            <DateRangePicker
              value={{ from: config.from, to: config.to }}
              onChange={(range) => setConfig((c) => ({ ...c, from: range.from, to: range.to }))}
            />
          </div>
        </div>

        <StepBuilder
          steps={config.steps}
          options={eventTypeOptions}
          onChange={(steps) => setConfig((c) => ({ ...c, steps }))}
        />
      </div>

      <div className="mt-6">
        {result ? (
          <FunnelChart result={result} />
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-400">
            Pick an event for every step to build the funnel.
          </div>
        )}
      </div>
    </>
  )
}

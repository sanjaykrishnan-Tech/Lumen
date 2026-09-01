import { useEffect, useMemo, useRef, useState } from 'react'
import { useEventsContext } from '../context/eventsContext'
import { useFilterParams } from '../hooks/useFilterParams'
import { FilterBar } from '../components/FilterBar'
import { EventTable } from '../components/EventTable'
import { LoadingState } from '../components/LoadingState'
import { filterEvents } from '../utils/filterEvents'
import { downloadCsv, eventsToCsv } from '../utils/exportCsv'

export function Events() {
  const { events, loading } = useEventsContext()
  const [filter, setFilter] = useFilterParams()
  const [paused, setPaused] = useState(false)

  const apiFilter = useMemo(
    () => ({
      search: filter.search || undefined,
      eventTypes: filter.eventTypes.length ? filter.eventTypes : undefined,
      from: filter.dateRange.from?.toISOString(),
      to: filter.dateRange.to?.toISOString(),
    }),
    [filter],
  )

  const eventTypeOptions = useMemo(
    () => Array.from(new Set(events.map((e) => e.eventType))).sort(),
    [events],
  )
  const eventTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of events) counts[e.eventType] = (counts[e.eventType] ?? 0) + 1
    return counts
  }, [events])

  // newest first
  const liveEvents = useMemo(
    () => filterEvents(events, apiFilter).slice().reverse(),
    [events, apiFilter],
  )

  // while paused, keep showing the list as it was when pause was pressed
  const frozenRef = useRef(liveEvents)
  if (!paused) frozenRef.current = liveEvents
  const displayed = paused ? frozenRef.current : liveEvents
  const pendingCount = paused ? Math.max(0, liveEvents.length - frozenRef.current.length) : 0

  // highlight rows that appeared since the last render (skip the first batch)
  const seenRef = useRef<Set<string>>(new Set())
  const primedRef = useRef(false)
  const newIds = useMemo(() => {
    if (!primedRef.current) return new Set<string>()
    const s = new Set<string>()
    for (const e of displayed) if (!seenRef.current.has(e.id)) s.add(e.id)
    return s
  }, [displayed])
  useEffect(() => {
    for (const e of displayed) seenRef.current.add(e.id)
    if (!loading) primedRef.current = true
  }, [displayed, loading])

  if (loading) return <LoadingState />

  return (
    <>
      <FilterBar
        filter={filter}
        onChange={setFilter}
        eventTypeOptions={eventTypeOptions}
        eventTypeCounts={eventTypeCounts}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-500">{displayed.length.toLocaleString()} events</span>

        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-400"
        >
          {paused ? '▶ Resume stream' : '⏸ Pause stream'}
        </button>

        {paused && pendingCount > 0 && (
          <button
            type="button"
            onClick={() => setPaused(false)}
            className="rounded-full bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            {pendingCount.toLocaleString()} new event{pendingCount === 1 ? '' : 's'}
          </button>
        )}

        <button
          type="button"
          onClick={() => downloadCsv(`lumen-events-${Date.now()}.csv`, eventsToCsv(displayed))}
          disabled={displayed.length === 0}
          className="ml-auto rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-400 disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      <div className="mt-3">
        <EventTable events={displayed} newIds={newIds} />
      </div>
    </>
  )
}

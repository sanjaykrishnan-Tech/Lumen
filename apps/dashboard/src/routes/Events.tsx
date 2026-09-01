import { useMemo } from 'react'
import { useEventsContext } from '../context/eventsContext'
import { useFilterParams } from '../hooks/useFilterParams'
import { FilterBar } from '../components/FilterBar'
import { LoadingState } from '../components/LoadingState'
import { filterEvents } from '../utils/filterEvents'

export function Events() {
  const { events, loading } = useEventsContext()
  const [filter, setFilter] = useFilterParams()

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

  const filteredEvents = useMemo(
    () => filterEvents(events, apiFilter).slice().reverse(),
    [events, apiFilter],
  )

  if (loading) return <LoadingState />

  return (
    <>
      <FilterBar
        filter={filter}
        onChange={setFilter}
        eventTypeOptions={eventTypeOptions}
        eventTypeCounts={eventTypeCounts}
      />
      <p className="mt-6 text-sm text-gray-500">
        {filteredEvents.length.toLocaleString()} events — live feed coming soon.
      </p>
    </>
  )
}

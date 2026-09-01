import { useMemo } from 'react'
import { useEventsContext } from '../context/eventsContext'
import { useFilterParams } from '../hooks/useFilterParams'
import { StatCard } from '../components/StatCard'
import { TimeSeriesChart } from '../components/TimeSeriesChart'
import { EventBreakdownChart } from '../components/EventBreakdownChart'
import { FilterBar } from '../components/FilterBar'
import { LoadingState } from '../components/LoadingState'
import { bucketByRange, countByEventType } from '../utils/aggregate'
import { filterEvents } from '../utils/filterEvents'

export function Overview() {
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

  // counts for the event-type dropdown are "faceted": they reflect search + date
  // filters but not the event-type selection itself, so checking a box never
  // hides the other options.
  const eventsForFacets = useMemo(
    () => filterEvents(events, { ...apiFilter, eventTypes: undefined }),
    [events, apiFilter],
  )
  const eventTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of eventsForFacets) counts[e.eventType] = (counts[e.eventType] ?? 0) + 1
    return counts
  }, [eventsForFacets])

  const eventTypeOptions = useMemo(
    () => Array.from(new Set(events.map((e) => e.eventType))).sort(),
    [events],
  )

  const filteredEvents = useMemo(() => filterEvents(events, apiFilter), [events, apiFilter])

  const timeSeriesData = useMemo(
    () => bucketByRange(filteredEvents, filter.dateRange),
    [filteredEvents, filter.dateRange],
  )
  const breakdownData = useMemo(() => countByEventType(filteredEvents), [filteredEvents])

  const uniqueUsers = useMemo(() => new Set(filteredEvents.map((e) => e.userId)).size, [filteredEvents])

  const errorCount = useMemo(
    () => filteredEvents.filter((e) => e.eventType === 'error').length,
    [filteredEvents],
  )
  const errorRate = filteredEvents.length ? ((errorCount / filteredEvents.length) * 100).toFixed(1) : '0.0'

  const recentCount = useMemo(() => {
    const cutoff = Date.now() - 60_000
    return filteredEvents.filter((e) => new Date(e.timestamp).getTime() >= cutoff).length
  }, [filteredEvents])

  function toggleEventType(type: string) {
    setFilter((f) => ({
      ...f,
      eventTypes: f.eventTypes.includes(type) ? f.eventTypes.filter((t) => t !== type) : [...f.eventTypes, type],
    }))
  }

  if (loading) return <LoadingState />

  return (
    <>
      <FilterBar
        filter={filter}
        onChange={setFilter}
        eventTypeOptions={eventTypeOptions}
        eventTypeCounts={eventTypeCounts}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total events" value={filteredEvents.length.toLocaleString()} />
        <StatCard label="Unique users" value={uniqueUsers.toLocaleString()} />
        <StatCard label="Events / min" value={recentCount.toString()} sublabel="last 60s" />
        <StatCard label="Error rate" value={`${errorRate}%`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimeSeriesChart data={timeSeriesData} />
        <EventBreakdownChart data={breakdownData} selected={filter.eventTypes} onToggle={toggleEventType} />
      </div>
    </>
  )
}

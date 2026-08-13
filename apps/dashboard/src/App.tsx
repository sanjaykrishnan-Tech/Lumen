import { useMemo, useState } from 'react'
import { useAnalyticsEvents } from './hooks/useAnalyticsEvents'
import { StatCard } from './components/StatCard'
import { TimeSeriesChart } from './components/TimeSeriesChart'
import { EventBreakdownChart } from './components/EventBreakdownChart'
import { FilterBar, type FilterState } from './components/FilterBar'
import { LoadingState } from './components/LoadingState'
import { bucketByRange, countByEventType } from './utils/aggregate'
import { filterEvents } from './utils/filterEvents'

const EMPTY_FILTER: FilterState = { search: '', eventTypes: [], dateRange: {} }

function App() {
  const { events, loading } = useAnalyticsEvents()
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)

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

  return (
    <div className="min-h-screen bg-[#f7f8f7]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-green-600" />
            <h1 className="text-lg font-semibold text-gray-900">Lumen</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
            </span>
            Live
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <LoadingState />
        ) : (
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
        )}
      </main>
    </div>
  )
}

export default App

import { useMemo } from 'react'
import { useAnalyticsEvents } from './hooks/useAnalyticsEvents'
import { StatCard } from './components/StatCard'
import { TimeSeriesChart } from './components/TimeSeriesChart'
import { EventBreakdownChart } from './components/EventBreakdownChart'
import { bucketByHour, countByEventType } from './utils/aggregate'

function App() {
  const { events, loading } = useAnalyticsEvents()

  const timeSeriesData = useMemo(() => bucketByHour(events), [events])
  const breakdownData = useMemo(() => countByEventType(events), [events])

  const uniqueUsers = useMemo(() => new Set(events.map((e) => e.userId)).size, [events])

  const errorCount = useMemo(
    () => events.filter((e) => e.eventType === 'error').length,
    [events],
  )
  const errorRate = events.length ? ((errorCount / events.length) * 100).toFixed(1) : '0.0'

  const recentCount = useMemo(() => {
    const cutoff = Date.now() - 60_000
    return events.filter((e) => new Date(e.timestamp).getTime() >= cutoff).length
  }, [events])

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
          <p className="text-sm text-gray-400">Loading events…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total events" value={events.length.toLocaleString()} />
              <StatCard label="Unique users" value={uniqueUsers.toLocaleString()} />
              <StatCard label="Events / min" value={recentCount.toString()} sublabel="last 60s" />
              <StatCard label="Error rate" value={`${errorRate}%`} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TimeSeriesChart data={timeSeriesData} />
              <EventBreakdownChart data={breakdownData} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App

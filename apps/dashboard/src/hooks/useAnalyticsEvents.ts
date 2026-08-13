import { useEffect, useState } from 'react'
import { dataService } from '../services/mockDataService'
import type { AnalyticsEvent } from '../types/analytics'

export function useAnalyticsEvents() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    dataService.getEvents().then((initial) => {
      if (!active) return
      setEvents(initial)
      setLoading(false)
    })

    const unsubscribe = dataService.subscribeToEvents((event) => {
      setEvents((prev) => [...prev, event])
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { events, loading }
}

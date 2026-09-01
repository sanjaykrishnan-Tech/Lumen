import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { dataService } from '../services/dataService'
import type { AnalyticsEvent } from '@lumen/shared-types'
import { EventsContext } from './eventsContext'

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)

  useEffect(() => {
    let active = true

    dataService.getEvents().then((initial) => {
      if (!active) return
      setEvents(initial)
      setLoading(false)
    })

    const unsubscribeEvents = dataService.subscribeToEvents((event) => {
      setEvents((prev) => [...prev, event])
    })

    const unsubscribeConnection = dataService.subscribeToConnection?.(setConnected)

    return () => {
      active = false
      unsubscribeEvents()
      unsubscribeConnection?.()
    }
  }, [])

  const value = useMemo(
    () => ({ events, loading, connected }),
    [events, loading, connected],
  )

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

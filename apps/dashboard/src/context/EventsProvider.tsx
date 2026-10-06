import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { dataService } from '../services/dataService'
import type { AnalyticsEvent } from '@lumen/shared-types'
import { EventsContext } from './eventsContext'
import { useProjects } from './projectsContext'

export function EventsProvider({ children }: { children: ReactNode }) {
  const { current } = useProjects()
  const projectId = current.id
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)

  useEffect(() => {
    let active = true
    // switching projects must not briefly show the previous project's events
    setEvents([])
    setLoading(true)

    dataService
      .getEvents({ projectId })
      .then((initial) => {
        if (!active) return
        setEvents(initial)
        setLoading(false)
      })
      .catch(() => {
        // a 401 here already signed the user out; other failures just stop the spinner
        if (active) setLoading(false)
      })

    const unsubscribeEvents = dataService.subscribeToEvents((event) => {
      setEvents((prev) => [...prev, event])
    }, projectId)

    const unsubscribeConnection = dataService.subscribeToConnection?.(setConnected)

    return () => {
      active = false
      unsubscribeEvents()
      unsubscribeConnection?.()
    }
  }, [projectId])

  const value = useMemo(
    () => ({ events, loading, connected }),
    [events, loading, connected],
  )

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

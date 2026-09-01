import { createContext, useContext } from 'react'
import type { AnalyticsEvent } from '@lumen/shared-types'

export interface EventsContextValue {
  events: AnalyticsEvent[]
  loading: boolean
  /** live-transport connection status; true when the service has no live transport */
  connected: boolean
}

export const EventsContext = createContext<EventsContextValue | null>(null)

export function useEventsContext(): EventsContextValue {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error('useEventsContext must be used within an EventsProvider')
  return ctx
}

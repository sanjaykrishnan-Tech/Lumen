export interface AnalyticsEvent {
  id: string
  eventType: string
  userId: string
  properties: Record<string, string | number | boolean>
  timestamp: string
}

export interface EventFilter {
  eventTypes?: string[]
  search?: string
  from?: string
  to?: string
}

export interface DataService {
  getEvents(filter?: EventFilter): Promise<AnalyticsEvent[]>
  subscribeToEvents(onEvent: (event: AnalyticsEvent) => void): () => void
  /**
   * Optional: report live-connection status changes (e.g. websocket connect/
   * disconnect). Services without a live transport can omit this and are
   * treated as always connected.
   */
  subscribeToConnection?(onChange: (connected: boolean) => void): () => void
}

export interface TrackEventInput {
  eventType: string
  userId: string
  properties?: Record<string, string | number | boolean>
  timestamp?: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
}

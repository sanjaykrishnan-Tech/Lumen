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
}

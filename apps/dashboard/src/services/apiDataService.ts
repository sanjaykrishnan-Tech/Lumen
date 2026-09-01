import { io, type Socket } from 'socket.io-client'
import type { AnalyticsEvent, DataService, EventFilter } from '@lumen/shared-types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

function buildQuery(filter?: EventFilter): string {
  if (!filter) return ''
  const params = new URLSearchParams()
  if (filter.eventTypes?.length) params.set('eventTypes', filter.eventTypes.join(','))
  if (filter.search) params.set('search', filter.search)
  if (filter.from) params.set('from', filter.from)
  if (filter.to) params.set('to', filter.to)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

class ApiDataService implements DataService {
  private socket: Socket | null = null

  private getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(API_URL, { transports: ['websocket'] })
    }
    return this.socket
  }

  async getEvents(filter?: EventFilter): Promise<AnalyticsEvent[]> {
    const res = await fetch(`${API_URL}/api/events${buildQuery(filter)}`)
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`)
    const data = (await res.json()) as { events: AnalyticsEvent[] }
    return data.events
  }

  subscribeToEvents(onEvent: (event: AnalyticsEvent) => void): () => void {
    const socket = this.getSocket()
    socket.on('event', onEvent)
    return () => {
      socket.off('event', onEvent)
    }
  }

  subscribeToConnection(onChange: (connected: boolean) => void): () => void {
    const socket = this.getSocket()
    const handleConnect = () => onChange(true)
    const handleDisconnect = () => onChange(false)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    onChange(socket.connected)
    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }
}

export const apiDataService: DataService = new ApiDataService()

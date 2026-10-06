import { io, type Socket } from 'socket.io-client'
import type { AnalyticsEvent, DataService, EventFilter } from '@lumen/shared-types'
import { apiFetch, expireSession, refreshSession, API_URL } from './http'

function buildQuery(filter?: EventFilter): string {
  if (!filter) return ''
  const params = new URLSearchParams()
  if (filter.projectId) params.set('projectId', filter.projectId)
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
      const socket = io(API_URL, { transports: ['websocket'], withCredentials: true })
      // the server rejects the handshake when the access token has expired;
      // socket.io won't retry that on its own, so refresh the session and reconnect
      socket.on('connect_error', async (err) => {
        if (err.message !== 'unauthorized') return
        if (await refreshSession()) socket.connect()
        else expireSession()
      })
      this.socket = socket
    }
    return this.socket
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  async getEvents(filter?: EventFilter): Promise<AnalyticsEvent[]> {
    const res = await apiFetch(`/api/events${buildQuery(filter)}`)
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`)
    const data = (await res.json()) as { events: AnalyticsEvent[] }
    return data.events
  }

  subscribeToEvents(onEvent: (event: AnalyticsEvent) => void, projectId?: string): () => void {
    const socket = this.getSocket()
    socket.on('event', onEvent)

    // rooms are per-connection, so (re)join the project on every connect
    const join = () => {
      if (projectId) socket.emit('subscribe', projectId)
    }
    socket.on('connect', join)
    if (socket.connected) join()

    return () => {
      socket.off('event', onEvent)
      socket.off('connect', join)
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

const service = new ApiDataService()

export const apiDataService: DataService = service

/** Close the live socket (on logout) so the next user opens a fresh, authenticated one. */
export const disconnectLiveEvents = () => service.disconnect()

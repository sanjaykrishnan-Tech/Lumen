import { Router } from 'express'
import type { Server as SocketIOServer } from 'socket.io'
import type { EventFilter, TrackEventInput } from '@lumen/shared-types'
import { getEvents, insertEvents } from '../db/eventsRepo.js'

function isValidTrackInput(value: unknown): value is TrackEventInput {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.eventType === 'string' && typeof v.userId === 'string'
}

export function createEventsRouter(io: SocketIOServer): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const filter: EventFilter = {
      eventTypes: typeof req.query.eventTypes === 'string' ? req.query.eventTypes.split(',') : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    }
    try {
      const events = await getEvents(filter)
      res.json({ events })
    } catch (err) {
      console.error('Failed to fetch events:', err)
      res.status(500).json({ error: 'Failed to fetch events' })
    }
  })

  router.post('/', async (req, res) => {
    const body = req.body as { events?: unknown }
    const rawEvents = Array.isArray(body?.events) ? body.events : Array.isArray(body) ? body : null

    if (!rawEvents || rawEvents.length === 0) {
      res.status(400).json({ error: 'Request body must be an array of events, or { events: [...] }' })
      return
    }
    if (!rawEvents.every(isValidTrackInput)) {
      res.status(400).json({ error: 'Each event requires at least eventType and userId (strings)' })
      return
    }

    try {
      const inserted = await insertEvents(rawEvents)
      inserted.forEach((event) => io.emit('event', event))
      res.status(201).json({ events: inserted })
    } catch (err) {
      console.error('Failed to ingest events:', err)
      res.status(500).json({ error: 'Failed to ingest events' })
    }
  })

  return router
}

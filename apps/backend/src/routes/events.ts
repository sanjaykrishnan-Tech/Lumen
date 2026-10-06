import { Router } from 'express'
import { z } from 'zod'
import type { Server as SocketIOServer } from 'socket.io'
import type { EventFilter, TrackEventInput } from '@lumen/shared-types'
import { requireAuth } from '../auth/middleware.js'
import { getEvents, insertEvents } from '../db/eventsRepo.js'
import { findProjectIdByWriteKey, getMemberRole } from '../db/projectsRepo.js'

export const projectRoom = (projectId: string) => `project:${projectId}`
const WRITE_KEY_HEADER = 'x-lumen-key'
const uuid = z.string().uuid()

function isValidTrackInput(value: unknown): value is TrackEventInput {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.eventType === 'string' && typeof v.userId === 'string'
}

export function createEventsRouter(io: SocketIOServer): Router {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const projectId = uuid.safeParse(req.query.projectId)
    if (!projectId.success) {
      res.status(400).json({ error: 'projectId is required' })
      return
    }
    const filter: EventFilter = {
      eventTypes: typeof req.query.eventTypes === 'string' ? req.query.eventTypes.split(',') : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    }
    try {
      // non-members get the same 404 as a missing project
      if (!(await getMemberRole(projectId.data, req.user!.id))) {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      const events = await getEvents(projectId.data, filter)
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
      // The write key is optional for now so existing SDK installs keep working;
      // keyless events are stored without a project and nobody sees them.
      // A key that is present but wrong is always rejected.
      const writeKey = req.get(WRITE_KEY_HEADER)
      let projectId: string | null = null
      if (writeKey) {
        projectId = await findProjectIdByWriteKey(writeKey)
        if (!projectId) {
          res.status(401).json({ error: 'Invalid write key' })
          return
        }
      }
      const inserted = await insertEvents(rawEvents, projectId)
      if (projectId) inserted.forEach((event) => io.to(projectRoom(projectId)).emit('event', event))
      res.status(201).json({ events: inserted })
    } catch (err) {
      console.error('Failed to ingest events:', err)
      res.status(500).json({ error: 'Failed to ingest events' })
    }
  })

  return router
}

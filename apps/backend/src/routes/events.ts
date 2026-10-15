import { Router } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { z } from 'zod'
import type { Server as SocketIOServer } from 'socket.io'
import type { EventFilter, TrackEventInput } from '@lumen/shared-types'
import { requireAuth } from '../auth/middleware.js'
import { getEvents, insertEvents } from '../db/eventsRepo.js'
import { findProjectIdByWriteKey, getMemberRole } from '../db/projectsRepo.js'
import { getProjectOwnerAccount, reserveEvents } from '../db/billingRepo.js'
import { PLANS } from '../plans.js'

export const projectRoom = (projectId: string) => `project:${projectId}`
const WRITE_KEY_HEADER = 'x-lumen-key'
const uuid = z.string().uuid()
const MAX_EVENTS_PER_REQUEST = 500
const DAY_MS = 24 * 60 * 60 * 1000

// Caps request rate per write key (falling back to IP) so one noisy client
// can't starve the database for everyone else.
const ingestLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.get(WRITE_KEY_HEADER) || ipKeyGenerator(req.ip ?? ''),
  message: { error: 'Too many requests, slow down' },
})

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
      // the plan decides how far back history reaches
      const owner = await getProjectOwnerAccount(projectId.data)
      const oldest = new Date(Date.now() - PLANS[owner?.plan ?? 'free'].historyDays * DAY_MS).toISOString()
      if (!filter.from || filter.from < oldest) filter.from = oldest
      const events = await getEvents(projectId.data, filter)
      res.json({ events })
    } catch (err) {
      console.error('Failed to fetch events:', err)
      res.status(500).json({ error: 'Failed to fetch events' })
    }
  })

  router.post('/', ingestLimiter, async (req, res) => {
    const body = req.body as { events?: unknown }
    const rawEvents = Array.isArray(body?.events) ? body.events : Array.isArray(body) ? body : null

    if (!rawEvents || rawEvents.length === 0) {
      res.status(400).json({ error: 'Request body must be an array of events, or { events: [...] }' })
      return
    }
    if (rawEvents.length > MAX_EVENTS_PER_REQUEST) {
      res.status(413).json({ error: `At most ${MAX_EVENTS_PER_REQUEST} events per request` })
      return
    }
    if (!rawEvents.every(isValidTrackInput)) {
      res.status(400).json({ error: 'Each event requires at least eventType and userId (strings)' })
      return
    }

    try {
      const writeKey = req.get(WRITE_KEY_HEADER)
      if (!writeKey) {
        res.status(401).json({ error: 'Missing write key (X-Lumen-Key header)' })
        return
      }
      const projectId = await findProjectIdByWriteKey(writeKey)
      if (!projectId) {
        res.status(401).json({ error: 'Invalid write key' })
        return
      }
      const owner = await getProjectOwnerAccount(projectId)
      if (!owner) {
        res.status(401).json({ error: 'Invalid write key' })
        return
      }
      if (!(await reserveEvents(owner.id, owner.plan, rawEvents.length))) {
        res.status(429).json({ error: 'Monthly event limit reached. Upgrade your plan to keep tracking.' })
        return
      }
      const inserted = await insertEvents(rawEvents, projectId)
      inserted.forEach((event) => io.to(projectRoom(projectId)).emit('event', event))
      res.status(201).json({ events: inserted })
    } catch (err) {
      console.error('Failed to ingest events:', err)
      res.status(500).json({ error: 'Failed to ingest events' })
    }
  })

  return router
}

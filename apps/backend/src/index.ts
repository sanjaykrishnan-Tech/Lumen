import 'dotenv/config'
import { createServer } from 'node:http'
import express from 'express'
import { z } from 'zod'
import cors from 'cors'
import { Server as SocketIOServer } from 'socket.io'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import { createEventsRouter, projectRoom } from './routes/events.js'
import { getMemberRole } from './db/projectsRepo.js'
import { createAuthRouter } from './routes/auth.js'
import { createProjectsRouter } from './routes/projects.js'
import { ACCESS_COOKIE, parseCookieHeader } from './auth/cookies.js'
import { verifyAccessToken } from './auth/tokens.js'

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://localhost:5174']
// cors/socket.io match "*" as a literal array entry, not a wildcard, so it
// has to be passed through as the bare string "*" to actually allow any origin
const CORS_ORIGINS: string | string[] =
  process.env.CORS_ORIGIN === '*'
    ? '*'
    : process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : DEFAULT_ORIGINS

const app = express()
// credentials:true lets the browser send the auth cookies cross-origin; it is
// incompatible with a "*" origin, so a wildcard falls back to reflecting the origin
const credentialedOrigin = CORS_ORIGINS === '*' ? true : CORS_ORIGINS
app.use(cors({ origin: credentialedOrigin, credentials: true }))
// the events list is ~5x smaller gzipped, and the dashboard fetches it on every load
app.use(compression())
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: credentialedOrigin, credentials: true },
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', createAuthRouter())
app.use('/api/projects', createProjectsRouter())
app.use('/api/events', createEventsRouter(io))

// only signed-in users may open a live-event socket; the access token rides in
// the handshake cookie. It's checked at connect time, so an expired token just
// means the next reconnect is rejected and the client refreshes first.
io.use((socket, next) => {
  const token = parseCookieHeader(socket.handshake.headers.cookie, ACCESS_COOKIE)
  const user = token ? verifyAccessToken(token) : null
  if (!user) return next(new Error('unauthorized'))
  socket.data.user = user
  next()
})

const uuid = z.string().uuid()

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // a socket listens to one project at a time; switching projects swaps rooms.
  // Membership is re-checked here, so a client can't join a room by guessing an id.
  socket.on('subscribe', async (projectId: unknown, ack?: (ok: boolean) => void) => {
    const parsed = uuid.safeParse(projectId)
    const allowed = parsed.success && !!(await getMemberRole(parsed.data, socket.data.user.id))
    for (const room of [...socket.rooms]) if (room.startsWith('project:')) socket.leave(room)
    if (allowed) socket.join(projectRoom(parsed.data!))
    ack?.(allowed)
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Lumen backend listening on http://localhost:${PORT}`)
})

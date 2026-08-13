import 'dotenv/config'
import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server as SocketIOServer } from 'socket.io'
import { createEventsRouter } from './routes/events.js'

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
app.use(cors({ origin: CORS_ORIGINS }))
app.use(express.json({ limit: '1mb' }))

const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: CORS_ORIGINS },
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/events', createEventsRouter(io))

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Lumen backend listening on http://localhost:${PORT}`)
})

import type { TrackEventInput } from '@lumen/shared-types'
import { pool } from './pool.js'

const EVENT_TYPES_WEIGHTED: Array<[string, number]> = [
  ['page_view', 40],
  ['click', 22],
  ['search', 10],
  ['add_to_cart', 8],
  ['signup', 6],
  ['login', 6],
  ['purchase', 4],
  ['logout', 3],
  ['error', 1],
]
const PAGES = ['/home', '/pricing', '/docs', '/checkout', '/blog', '/settings']
const COUNTRIES = ['US', 'IN', 'GB', 'DE', 'BR', 'JP']
const DEVICES = ['desktop', 'mobile', 'tablet']
const REFERRERS = ['direct', 'google', 'twitter', 'newsletter', 'referral']

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomWeightedEventType(): string {
  const total = EVENT_TYPES_WEIGHTED.reduce((sum, [, w]) => sum + w, 0)
  let roll = Math.random() * total
  for (const [type, weight] of EVENT_TYPES_WEIGHTED) {
    roll -= weight
    if (roll <= 0) return type
  }
  return EVENT_TYPES_WEIGHTED[0][0]
}

function generateEvent(timestamp: string): TrackEventInput {
  const eventType = randomWeightedEventType()
  const properties: TrackEventInput['properties'] = {
    page: randomFrom(PAGES),
    country: randomFrom(COUNTRIES),
    device: randomFrom(DEVICES),
    referrer: randomFrom(REFERRERS),
  }
  if (eventType === 'purchase') properties.amount = Math.round(Math.random() * 500 + 10)
  if (eventType === 'error') properties.statusCode = randomFrom([400, 404, 500, 502])

  return {
    eventType,
    userId: `user_${randomFrom(Array.from({ length: 60 }, (_, i) => i))}`,
    properties,
    timestamp,
  }
}

async function seed(count = 2500, spanDays = 30, chunkSize = 500) {
  const now = Date.now()
  const spreadMs = spanDays * 24 * 60 * 60 * 1000

  const events = Array.from({ length: count }, () => {
    const t = Math.pow(Math.random(), 1.6)
    return generateEvent(new Date(now - t * spreadMs).toISOString())
  })

  // one round trip per chunk via unnest(), instead of one round trip per row —
  // 2500 sequential awaited inserts over a network connection to hosted
  // Postgres took 10+ minutes and looked hung; this takes well under a second
  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize)
    await pool.query(
      `INSERT INTO events (event_type, user_id, properties, timestamp)
       SELECT * FROM unnest($1::text[], $2::text[], $3::jsonb[], $4::timestamptz[])`,
      [
        chunk.map((e) => e.eventType),
        chunk.map((e) => e.userId),
        chunk.map((e) => JSON.stringify(e.properties ?? {})),
        chunk.map((e) => e.timestamp),
      ],
    )
    console.log(`Seeded ${Math.min(i + chunkSize, events.length)}/${events.length}`)
  }

  await pool.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

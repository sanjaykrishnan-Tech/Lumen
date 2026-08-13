import type { AnalyticsEvent, EventFilter, TrackEventInput } from '@lumen/shared-types'
import { pool } from './pool.js'

interface EventRow {
  id: string
  event_type: string
  user_id: string
  properties: Record<string, string | number | boolean>
  timestamp: string
}

function toAnalyticsEvent(row: EventRow): AnalyticsEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    userId: row.user_id,
    properties: row.properties,
    timestamp: new Date(row.timestamp).toISOString(),
  }
}

export async function getEvents(filter: EventFilter = {}): Promise<AnalyticsEvent[]> {
  const conditions: string[] = []
  const values: unknown[] = []

  if (filter.eventTypes?.length) {
    values.push(filter.eventTypes)
    conditions.push(`event_type = ANY($${values.length})`)
  }
  if (filter.search) {
    values.push(`%${filter.search.toLowerCase()}%`)
    conditions.push(`LOWER(event_type) LIKE $${values.length}`)
  }
  if (filter.from) {
    values.push(filter.from)
    conditions.push(`timestamp >= $${values.length}`)
  }
  if (filter.to) {
    values.push(filter.to)
    conditions.push(`timestamp <= $${values.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await pool.query<EventRow>(
    `SELECT id, event_type, user_id, properties, timestamp FROM events ${where} ORDER BY timestamp ASC LIMIT 10000`,
    values,
  )
  return result.rows.map(toAnalyticsEvent)
}

export async function insertEvents(events: TrackEventInput[]): Promise<AnalyticsEvent[]> {
  if (!events.length) return []

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const inserted: AnalyticsEvent[] = []
    for (const event of events) {
      const result = await client.query<EventRow>(
        `INSERT INTO events (event_type, user_id, properties, timestamp)
         VALUES ($1, $2, $3, COALESCE($4, now()))
         RETURNING id, event_type, user_id, properties, timestamp`,
        [event.eventType, event.userId, JSON.stringify(event.properties ?? {}), event.timestamp ?? null],
      )
      inserted.push(toAnalyticsEvent(result.rows[0]))
    }
    await client.query('COMMIT')
    return inserted
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

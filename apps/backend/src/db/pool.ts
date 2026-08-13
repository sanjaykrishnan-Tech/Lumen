import pg from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL ?? 'postgres://lumen:lumen@localhost:5432/lumen'

// hosted Postgres (Neon, Render, etc.) requires SSL but presents a cert chain
// node's default TLS validation rejects; rejectUnauthorized:false trusts it
// without pinning a CA, which is the standard approach for these providers.
const useSSL = connectionString.includes('sslmode=require') || process.env.PGSSL === 'true'

export const pool = new pg.Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
})

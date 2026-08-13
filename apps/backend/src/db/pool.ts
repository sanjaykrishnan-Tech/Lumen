import pg from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL ?? 'postgres://lumen:lumen@localhost:5432/lumen'

export const pool = new pg.Pool({ connectionString })

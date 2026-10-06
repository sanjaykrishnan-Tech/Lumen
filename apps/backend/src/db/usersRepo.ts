import type { AuthUser } from '@lumen/shared-types'
import { pool } from './pool.js'

interface UserRow {
  id: string
  email: string
  name: string
  password_hash: string
}

const toUser = (row: UserRow): AuthUser => ({ id: row.id, email: row.email, name: row.name })

export async function createUser(input: { email: string; name: string; passwordHash: string }) {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)
     RETURNING id, email, name, password_hash`,
    [input.email, input.name, input.passwordHash],
  )
  return toUser(result.rows[0])
}

export async function findUserByEmail(email: string) {
  const result = await pool.query<UserRow>(
    'SELECT id, email, name, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
    [email],
  )
  const row = result.rows[0]
  return row ? { user: toUser(row), passwordHash: row.password_hash } : null
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const result = await pool.query<UserRow>(
    'SELECT id, email, name, password_hash FROM users WHERE id = $1',
    [id],
  )
  return result.rows[0] ? toUser(result.rows[0]) : null
}

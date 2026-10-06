import { pool } from './pool.js'

export async function storeRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
  await pool.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [
    userId,
    tokenHash,
    expiresAt,
  ])
}

export type ConsumeResult =
  | { status: 'ok'; userId: string }
  | { status: 'reused'; userId: string }
  | { status: 'invalid' }

/**
 * Atomically mark a refresh token as used. Presenting one that was already
 * used means it was stolen (or replayed), so the caller revokes the whole
 * session family for that user.
 */
export async function consumeRefreshToken(tokenHash: string): Promise<ConsumeResult> {
  const used = await pool.query<{ user_id: string }>(
    `UPDATE refresh_tokens SET revoked_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
     RETURNING user_id`,
    [tokenHash],
  )
  if (used.rows[0]) return { status: 'ok', userId: used.rows[0].user_id }

  const prior = await pool.query<{ user_id: string }>(
    'SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NOT NULL',
    [tokenHash],
  )
  return prior.rows[0] ? { status: 'reused', userId: prior.rows[0].user_id } : { status: 'invalid' }
}

export async function revokeAllForUser(userId: string) {
  await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [
    userId,
  ])
}

export async function revokeRefreshToken(tokenHash: string) {
  await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL', [
    tokenHash,
  ])
}

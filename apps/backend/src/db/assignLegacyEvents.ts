import { newWriteKey } from '../auth/tokens.js'
import { pool } from './pool.js'

/**
 * One-off: give events that predate projects (project_id IS NULL) to a user.
 * Usage: yarn workspace backend tsx src/db/assignLegacyEvents.ts <email> [project name]
 *
 * Safe to re-run: it reuses the project if the user already owns one with that
 * name, and only touches events that still have no project.
 */
async function main() {
  const [email, name = 'Sample data'] = process.argv.slice(2)
  if (!email) throw new Error('Usage: assignLegacyEvents.ts <email> [project name]')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const user = await client.query<{ id: string }>('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email])
    if (!user.rows[0]) throw new Error(`No user with email ${email} — sign up first`)
    const userId = user.rows[0].id

    const existing = await client.query<{ id: string }>(
      `SELECT p.id FROM projects p
       JOIN project_members m ON m.project_id = p.id
       WHERE m.user_id = $1 AND m.role = 'owner' AND p.name = $2`,
      [userId, name],
    )

    let projectId = existing.rows[0]?.id
    if (!projectId) {
      const project = await client.query<{ id: string }>(
        'INSERT INTO projects (name, write_key) VALUES ($1, $2) RETURNING id',
        [name, newWriteKey()],
      )
      projectId = project.rows[0].id
      await client.query("INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')", [
        projectId,
        userId,
      ])
      console.log(`Created project "${name}" for ${email}`)
    } else {
      console.log(`Reusing existing project "${name}" for ${email}`)
    }

    const moved = await client.query('UPDATE events SET project_id = $1 WHERE project_id IS NULL', [projectId])
    const total = await client.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM events WHERE project_id = $1',
      [projectId],
    )
    await client.query('COMMIT')
    console.log(`Assigned ${moved.rowCount} events (project now has ${total.rows[0].n}).`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

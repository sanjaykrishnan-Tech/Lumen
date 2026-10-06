import type { Project, ProjectRole } from '@lumen/shared-types'
import { newWriteKey } from '../auth/tokens.js'
import { pool } from './pool.js'

interface ProjectRow {
  id: string
  name: string
  write_key: string
  role: ProjectRole
  created_at: string
}

const toProject = (row: ProjectRow): Project => ({
  id: row.id,
  name: row.name,
  writeKey: row.write_key,
  role: row.role,
  createdAt: new Date(row.created_at).toISOString(),
})

const SELECT_FOR_USER = `
  SELECT p.id, p.name, p.write_key, m.role, p.created_at
  FROM projects p JOIN project_members m ON m.project_id = p.id`

export async function listProjectsForUser(userId: string): Promise<Project[]> {
  const result = await pool.query<ProjectRow>(`${SELECT_FOR_USER} WHERE m.user_id = $1 ORDER BY p.created_at`, [
    userId,
  ])
  return result.rows.map(toProject)
}

export async function createProject(userId: string, name: string): Promise<Project> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const created = await client.query<{ id: string }>(
      'INSERT INTO projects (name, write_key) VALUES ($1, $2) RETURNING id',
      [name, newWriteKey()],
    )
    const projectId = created.rows[0].id
    await client.query("INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')", [
      projectId,
      userId,
    ])
    const row = await client.query<ProjectRow>(`${SELECT_FOR_USER} WHERE p.id = $1 AND m.user_id = $2`, [
      projectId,
      userId,
    ])
    await client.query('COMMIT')
    return toProject(row.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getMemberRole(projectId: string, userId: string): Promise<ProjectRole | null> {
  const result = await pool.query<{ role: ProjectRole }>(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId],
  )
  return result.rows[0]?.role ?? null
}

export async function rotateWriteKey(projectId: string, userId: string): Promise<Project | null> {
  const updated = await pool.query('UPDATE projects SET write_key = $2 WHERE id = $1', [projectId, newWriteKey()])
  if (!updated.rowCount) return null
  const row = await pool.query<ProjectRow>(`${SELECT_FOR_USER} WHERE p.id = $1 AND m.user_id = $2`, [
    projectId,
    userId,
  ])
  return row.rows[0] ? toProject(row.rows[0]) : null
}

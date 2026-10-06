import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../auth/middleware.js'
import { createProject, getMemberRole, listProjectsForUser, rotateWriteKey } from '../db/projectsRepo.js'

const createSchema = z.object({ name: z.string().trim().min(1, 'Name is required').max(60) })
const idSchema = z.string().uuid()

export function createProjectsRouter(): Router {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (req, res) => {
    try {
      let projects = await listProjectsForUser(req.user!.id)
      // every user needs somewhere to send events, so the first visit creates one
      if (projects.length === 0) projects = [await createProject(req.user!.id, 'My project')]
      res.json({ projects })
    } catch (err) {
      console.error('Failed to list projects:', err)
      res.status(500).json({ error: 'Failed to load projects' })
    }
  })

  router.post('/', async (req, res) => {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' })
      return
    }
    try {
      res.status(201).json({ project: await createProject(req.user!.id, parsed.data.name) })
    } catch (err) {
      console.error('Failed to create project:', err)
      res.status(500).json({ error: 'Failed to create project' })
    }
  })

  // replaces the write key; the old one stops working immediately
  router.post('/:id/rotate-key', async (req, res) => {
    const id = idSchema.safeParse(req.params.id)
    if (!id.success) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    try {
      const role = await getMemberRole(id.data, req.user!.id)
      // non-members get the same 404 as a missing project, so ids can't be probed
      if (!role) {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      if (role !== 'owner') {
        res.status(403).json({ error: 'Only project owners can rotate the write key' })
        return
      }
      const project = await rotateWriteKey(id.data, req.user!.id)
      res.json({ project })
    } catch (err) {
      console.error('Failed to rotate key:', err)
      res.status(500).json({ error: 'Failed to rotate key' })
    }
  })

  return router
}

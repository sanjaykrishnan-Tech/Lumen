import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Project } from '@lumen/shared-types'
import { apiFetch, USE_MOCK } from '../services/http'
import { LoadingState } from '../components/LoadingState'
import { ProjectsContext } from './projectsContext'

const STORAGE_KEY = 'lumen.projectId'
const DEMO_PROJECT: Project = {
  id: 'demo',
  name: 'Demo project',
  writeKey: 'lmn_demo',
  role: 'owner',
  createdAt: new Date(0).toISOString(),
}

function readStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(USE_MOCK ? [DEMO_PROJECT] : [])
  const [selectedId, setSelectedId] = useState<string | null>(readStoredId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (USE_MOCK) return
    let active = true
    apiFetch('/api/projects')
      .then(async (res) => {
        if (!active) return
        if (!res.ok) throw new Error(`Failed to load projects (${res.status})`)
        setProjects(((await res.json()) as { projects: Project[] }).projects)
      })
      .catch((err: Error) => active && setError(err.message))
    return () => {
      active = false
    }
  }, [])

  // a stored id can be stale (project deleted, different account), so fall back to the first
  const current = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? projects[0] ?? null,
    [projects, selectedId],
  )

  const selectProject = useCallback((id: string) => {
    setSelectedId(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // private mode / blocked storage: the choice just won't persist
    }
  }, [])

  const upsertProject = useCallback((project: Project) => {
    setProjects((prev) =>
      prev.some((p) => p.id === project.id) ? prev.map((p) => (p.id === project.id ? project : p)) : [...prev, project],
    )
  }, [])

  const value = useMemo(
    () => (current ? { projects, current, selectProject, upsertProject } : null),
    [projects, current, selectProject, upsertProject],
  )

  if (error) {
    return (
      <p role="alert" className="p-8 text-center text-sm text-red-600">
        {error}
      </p>
    )
  }
  if (!value) return <LoadingState />
  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
}

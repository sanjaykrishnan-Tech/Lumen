import { createContext, useContext } from 'react'
import type { Project } from '@lumen/shared-types'

export interface ProjectsContextValue {
  projects: Project[]
  current: Project
  selectProject: (id: string) => void
  /** Add a new project, or replace an existing one (e.g. after rotating its key). */
  upsertProject: (project: Project) => void
}

export const ProjectsContext = createContext<ProjectsContextValue | null>(null)

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects must be used inside <ProjectsProvider>')
  return ctx
}

import { useProjects } from '../context/projectsContext'

export function ProjectSwitcher() {
  const { projects, current, selectProject } = useProjects()

  return (
    <label className="flex items-center gap-2 text-sm text-gray-500">
      <span className="hidden sm:inline">Project</span>
      <select
        value={current.id}
        onChange={(e) => selectProject(e.target.value)}
        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800 outline-none focus:border-green-600"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  )
}

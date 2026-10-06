import { useState, type FormEvent } from 'react'
import type { Project } from '@lumen/shared-types'
import { useProjects } from '../context/projectsContext'
import { CopyButton } from '../components/CopyButton'
import { API_URL, USE_MOCK, apiFetch, readError } from '../services/http'

function sdkSnippet(project: Project) {
  return `import { init, track } from '@lumen/sdk'

init({
  apiUrl: '${API_URL}',
  writeKey: '${project.writeKey}',
})

track('page_view', { page: '/pricing' })`
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function WriteKeySection({ project }: { project: Project }) {
  const { upsertProject } = useProjects()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isOwner = project.role === 'owner'

  async function rotate() {
    if (!window.confirm('Rotate the write key? Apps using the old key stop sending events immediately.')) return
    setBusy(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/projects/${project.id}/rotate-key`, { method: 'POST' })
      if (!res.ok) throw new Error(await readError(res, 'Failed to rotate key'))
      upsertProject(((await res.json()) as { project: Project }).project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate key')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section
      title="Write key"
      description="Identifies this project in your app. It can only add events, so it is safe to ship in client code."
    >
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-gray-100 px-3 py-1.5 font-mono text-sm text-gray-800 break-all">
          {project.writeKey}
        </code>
        <CopyButton text={project.writeKey} />
        {isOwner && (
          <button
            type="button"
            onClick={() => void rotate()}
            disabled={busy}
            className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            {busy ? 'Rotating…' : 'Rotate key'}
          </button>
        )}
      </div>
      {!isOwner && <p className="mt-2 text-xs text-gray-400">Only project owners can rotate the key.</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </Section>
  )
}

function TestEventSection({ project }: { project: Project }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  async function send() {
    setStatus('sending')
    try {
      // sent the way the SDK sends it: write key header, no cookies
      const res = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Lumen-Key': project.writeKey },
        body: JSON.stringify({ events: [{ eventType: 'test_event', userId: 'settings-page', properties: { source: 'settings' } }] }),
      })
      setStatus(res.ok ? 'sent' : 'failed')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <Section title="Send a test event" description="Check that events reach this project. It appears in the Events tab live.">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void send()}
          disabled={status === 'sending' || USE_MOCK}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending…' : 'Send test event'}
        </button>
        {status === 'sent' && <span className="text-sm text-green-700">Sent — check the Events tab.</span>}
        {status === 'failed' && <span className="text-sm text-red-600">Failed to send. Is the backend reachable?</span>}
        {USE_MOCK && <span className="text-sm text-gray-400">Not available in mock mode.</span>}
      </div>
    </Section>
  )
}

function NewProjectSection() {
  const { upsertProject, selectProject } = useProjects()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await apiFetch('/api/projects', { method: 'POST', body: JSON.stringify({ name }) })
      if (!res.ok) throw new Error(await readError(res, 'Failed to create project'))
      const { project } = (await res.json()) as { project: Project }
      upsertProject(project)
      selectProject(project.id)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="New project" description="Each project has its own events and its own write key.">
      <form onSubmit={(e) => void create(e)} className="flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          maxLength={60}
          required
          disabled={USE_MOCK}
          aria-label="Project name"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
        />
        <button
          type="submit"
          disabled={busy || USE_MOCK}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create project'}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </Section>
  )
}

export function Settings() {
  const { current } = useProjects()
  const snippet = sdkSnippet(current)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{current.name}</h1>
        <p className="text-sm text-gray-500">Project settings</p>
      </div>

      <WriteKeySection project={current} />

      <Section title="Install the SDK" description="Add this to your app to start sending events to this project.">
        <div className="relative">
          <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm leading-relaxed text-gray-100">{snippet}</pre>
          <div className="absolute right-2 top-2">
            <CopyButton text={snippet} />
          </div>
        </div>
      </Section>

      <TestEventSection project={current} />
      <NewProjectSection />
    </div>
  )
}

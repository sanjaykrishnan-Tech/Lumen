import { useState } from 'react'
import type { TaskPriority } from '../types/task'

interface TaskFormProps {
  onAdd: (title: string, priority: TaskPriority) => void
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

export function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed, priority)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        className="min-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as TaskPriority)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p[0].toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        Add task
      </button>
    </form>
  )
}

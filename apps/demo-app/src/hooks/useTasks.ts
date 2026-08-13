import { useEffect, useState } from 'react'
import type { Task, TaskPriority } from '../types/task'
import { trackEvent } from '../lib/analytics'

const STORAGE_KEY = 'lumen_demo_tasks'

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Task[]) : []
  } catch {
    return []
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  function addTask(title: string, priority: TaskPriority) {
    const task: Task = {
      id: randomId(),
      title,
      completed: false,
      priority,
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [task, ...prev])
    trackEvent('task_created', { priority })
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const completed = !t.completed
        trackEvent(completed ? 'task_completed' : 'task_reopened', { priority: t.priority })
        return { ...t, completed }
      }),
    )
  }

  function deleteTask(id: string) {
    const task = tasks.find((t) => t.id === id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
    trackEvent('task_deleted', { priority: task?.priority ?? 'unknown', wasCompleted: task?.completed ?? false })
  }

  return { tasks, addTask, toggleTask, deleteTask }
}

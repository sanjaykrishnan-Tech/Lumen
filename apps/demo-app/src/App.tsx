import { useEffect, useMemo, useState } from 'react'
import { useTasks } from './hooks/useTasks'
import { TaskForm } from './components/TaskForm'
import { TaskItem } from './components/TaskItem'
import { FilterTabs } from './components/FilterTabs'
import { initAnalytics, trackEvent } from './lib/analytics'
import type { TaskFilter } from './types/task'

function App() {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks()
  const [filter, setFilter] = useState<TaskFilter>('all')

  useEffect(() => {
    initAnalytics()
    trackEvent('page_view', { page: '/tasks' })
  }, [])

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks],
  )

  const visibleTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter((t) => !t.completed)
    if (filter === 'completed') return tasks.filter((t) => t.completed)
    return tasks
  }, [tasks, filter])

  function handleFilterChange(next: TaskFilter) {
    setFilter(next)
    trackEvent('click', { target: 'filter_tab', filter: next })
  }

  return (
    <div className="min-h-screen bg-[#f7f8f7]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-6 py-4">
          <div className="h-6 w-6 rounded bg-green-600" />
          <h1 className="text-lg font-semibold text-gray-900">Lumen Tasks</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <TaskForm onAdd={addTask} />

        <div className="mt-6 flex items-center justify-between">
          <FilterTabs value={filter} onChange={handleFilterChange} counts={counts} />
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          {visibleTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              {tasks.length === 0 ? 'No tasks yet — add one above.' : 'Nothing here.'}
            </p>
          ) : (
            <ul>
              {visibleTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Every add, complete, and delete fires a real event through @lumen/sdk to the Lumen dashboard.
        </p>
      </main>
    </div>
  )
}

export default App

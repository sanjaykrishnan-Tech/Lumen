import type { Task } from '../types/task'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-green-50 text-green-700',
  high: 'bg-green-100 text-green-800',
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <li className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-b-0">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
      />
      <span className={`flex-1 text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
        {task.title}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[task.priority]}`}>
        {task.priority}
      </span>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
        aria-label="Delete task"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}

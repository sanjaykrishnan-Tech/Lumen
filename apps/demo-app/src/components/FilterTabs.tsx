import type { TaskFilter } from '../types/task'

interface FilterTabsProps {
  value: TaskFilter
  onChange: (filter: TaskFilter) => void
  counts: Record<TaskFilter, number>
}

const TABS: TaskFilter[] = ['all', 'active', 'completed']

export function FilterTabs({ value, onChange, counts }: FilterTabsProps) {
  return (
    <div className="flex gap-1 rounded-md bg-gray-100 p-0.5">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`rounded px-3 py-1.5 text-sm font-medium capitalize transition ${
            value === tab ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab} <span className="text-xs text-gray-400">({counts[tab]})</span>
        </button>
      ))}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

interface EventTypeSelectProps {
  options: string[]
  counts: Record<string, number>
  selected: string[]
  onChange: (selected: string[]) => void
}

export function EventTypeSelect({ options, counts, selected, onChange }: EventTypeSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggle(type: string) {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type))
    } else {
      onChange([...selected, type])
    }
  }

  const label = selected.length === 0 ? 'All events' : `${selected.length} event type${selected.length > 1 ? 's' : ''}`

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:border-gray-400"
      >
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {label}
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Event type</span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-green-700 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {options.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-green-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(type)}
                    onChange={() => toggle(type)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{type}</span>
                </span>
                <span className="text-xs text-gray-400">{counts[type] ?? 0}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

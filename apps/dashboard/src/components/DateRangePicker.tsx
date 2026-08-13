import { useEffect, useRef, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'

export interface DateRangeValue {
  from?: Date
  to?: Date
}

interface Preset {
  label: string
  getRange: () => DateRangeValue
}

const startOfDay = (d: Date) => {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}
const endOfDay = (d: Date) => {
  const copy = new Date(d)
  copy.setHours(23, 59, 59, 999)
  return copy
}
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const PRESETS: Preset[] = [
  { label: 'Today', getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Last 24 hours', getRange: () => ({ from: new Date(Date.now() - 24 * 60 * 60 * 1000), to: new Date() }) },
  { label: 'Last 7 days', getRange: () => ({ from: startOfDay(daysAgo(6)), to: endOfDay(new Date()) }) },
  { label: 'Last 30 days', getRange: () => ({ from: startOfDay(daysAgo(29)), to: endOfDay(new Date()) }) },
  { label: 'All time', getRange: () => ({ from: undefined, to: undefined }) },
]

function formatLabel(value: DateRangeValue): string {
  if (!value.from && !value.to) return 'All time'
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (value.from && value.to) return `${fmt(value.from)} – ${fmt(value.to)}`
  if (value.from) return `From ${fmt(value.from)}`
  return `Until ${fmt(value.to!)}`
}

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
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

  const selectedRange: DateRange | undefined =
    value.from || value.to ? { from: value.from, to: value.to } : undefined

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:border-gray-400"
      >
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatLabel(value)}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex flex-col gap-1 border-r border-gray-100 p-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange(preset.getRange())
                  setOpen(false)
                }}
                className="rounded px-3 py-1.5 text-left text-sm text-gray-600 hover:bg-green-50 hover:text-green-700"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={(range) => {
              onChange({
                from: range?.from ? startOfDay(range.from) : undefined,
                to: range?.to ? endOfDay(range.to) : range?.from ? endOfDay(range.from) : undefined,
              })
            }}
            className="p-3"
            style={
              {
                '--rdp-accent-color': '#16a34a',
                '--rdp-accent-background-color': '#dcfce7',
              } as React.CSSProperties
            }
          />
        </div>
      )}
    </div>
  )
}

import { EventTypeSelect } from './EventTypeSelect'
import { DateRangePicker, type DateRangeValue } from './DateRangePicker'

export interface FilterState {
  search: string
  eventTypes: string[]
  dateRange: DateRangeValue
}

interface FilterBarProps {
  filter: FilterState
  onChange: (filter: FilterState) => void
  eventTypeOptions: string[]
  eventTypeCounts: Record<string, number>
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function FilterBar({ filter, onChange, eventTypeOptions, eventTypeCounts }: FilterBarProps) {
  const hasDateRange = Boolean(filter.dateRange.from || filter.dateRange.to)
  const hasActiveFilters = filter.search || filter.eventTypes.length > 0 || hasDateRange

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onChange({ ...filter, search: e.target.value })}
            placeholder="Search event name…"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <EventTypeSelect
          options={eventTypeOptions}
          counts={eventTypeCounts}
          selected={filter.eventTypes}
          onChange={(eventTypes) => onChange({ ...filter, eventTypes })}
        />

        <DateRangePicker
          value={filter.dateRange}
          onChange={(dateRange) => onChange({ ...filter, dateRange })}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange({ search: '', eventTypes: [], dateRange: {} })}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filter.search && (
            <Chip onRemove={() => onChange({ ...filter, search: '' })}>
              Search: "{filter.search}"
            </Chip>
          )}
          {filter.eventTypes.map((type) => (
            <Chip
              key={type}
              onRemove={() => onChange({ ...filter, eventTypes: filter.eventTypes.filter((t) => t !== type) })}
            >
              {type}
            </Chip>
          ))}
          {hasDateRange && (
            <Chip onRemove={() => onChange({ ...filter, dateRange: {} })}>
              {filter.dateRange.from && filter.dateRange.to
                ? `${formatDate(filter.dateRange.from)} – ${formatDate(filter.dateRange.to)}`
                : filter.dateRange.from
                  ? `From ${formatDate(filter.dateRange.from)}`
                  : `Until ${formatDate(filter.dateRange.to!)}`}
            </Chip>
          )}
        </div>
      )}
    </div>
  )
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-green-50 py-1 pl-3 pr-1.5 text-xs font-medium text-green-800">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-green-100"
        aria-label="Remove filter"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}

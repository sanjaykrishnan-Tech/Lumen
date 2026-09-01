import { useMemo } from 'react'
import type { AnalyticsEvent } from '@lumen/shared-types'
import { topBy, type RankedItem } from '../utils/aggregate'
import { colorForEventType } from '../utils/eventColors'

interface TopListsProps {
  events: AnalyticsEvent[]
  selectedEventTypes: string[]
  onToggleEventType: (eventType: string) => void
}

export function TopLists({ events, selectedEventTypes, onToggleEventType }: TopListsProps) {
  const topEvents = useMemo(() => topBy(events, (e) => e.eventType), [events])
  const topPages = useMemo(() => topBy(events, (e) => e.properties?.page), [events])
  const topUsers = useMemo(() => topBy(events, (e) => e.userId), [events])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <TopListCard
        title="Top events"
        items={topEvents}
        activeLabels={selectedEventTypes}
        onRowClick={onToggleEventType}
        colorFor={colorForEventType}
        hint="click to filter"
      />
      <TopListCard title="Top pages" items={topPages} emptyLabel="No page property on these events" />
      <TopListCard title="Top users" items={topUsers} mono />
    </div>
  )
}

interface TopListCardProps {
  title: string
  items: RankedItem[]
  activeLabels?: string[]
  onRowClick?: (label: string) => void
  colorFor?: (label: string) => string
  hint?: string
  emptyLabel?: string
  mono?: boolean
}

function TopListCard({
  title,
  items,
  activeLabels,
  onRowClick,
  colorFor,
  hint,
  emptyLabel,
  mono,
}: TopListCardProps) {
  const max = items[0]?.count ?? 0
  const isFiltering = (activeLabels?.length ?? 0) > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-gray-500">{title}</h2>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-sm text-gray-400">{emptyLabel ?? 'No data'}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const active = activeLabels?.includes(item.label) ?? false
            const dim = isFiltering && !active
            const Row = onRowClick ? 'button' : 'div'
            return (
              <li key={item.label}>
                <Row
                  {...(onRowClick
                    ? { type: 'button' as const, onClick: () => onRowClick(item.label) }
                    : {})}
                  className={`group flex w-full items-center gap-3 text-left ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${dim ? 'opacity-40' : ''}`}
                >
                  <span
                    className={`w-28 shrink-0 truncate text-sm text-gray-700 ${mono ? 'font-mono text-xs' : ''} ${
                      onRowClick ? 'group-hover:text-green-700' : ''
                    }`}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${max ? (item.count / max) * 100 : 0}%`,
                        backgroundColor: colorFor ? colorFor(item.label) : '#16a34a',
                      }}
                    />
                  </span>
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-gray-500">
                    {item.count.toLocaleString()}
                  </span>
                </Row>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

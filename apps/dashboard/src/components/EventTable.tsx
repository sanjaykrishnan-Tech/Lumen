import { useState } from 'react'
import type { AnalyticsEvent } from '@lumen/shared-types'
import { EventRow } from './EventRow'

const PAGE_SIZE = 200

interface EventTableProps {
  events: AnalyticsEvent[]
  newIds: Set<string>
}

export function EventTable({ events, newIds }: EventTableProps) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = events.slice(0, visible)

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-400">
        No events match these filters.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-400">
              <th className="py-2 pl-4 pr-3 font-medium">Time</th>
              <th className="py-2 pr-3 font-medium">Event</th>
              <th className="py-2 pr-3 font-medium">User</th>
              <th className="py-2 pr-4 font-medium">Properties</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((event) => (
              <EventRow key={event.id} event={event} isNew={newIds.has(event.id)} />
            ))}
          </tbody>
        </table>
      </div>
      {visible < events.length && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="w-full border-t border-gray-100 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50"
        >
          Show more ({(events.length - visible).toLocaleString()} older)
        </button>
      )}
    </div>
  )
}

import { memo, useState } from 'react'
import { format, formatDistanceToNowStrict } from 'date-fns'
import type { AnalyticsEvent } from '@lumen/shared-types'
import { EventTypePill } from './EventTypePill'

interface EventRowProps {
  event: AnalyticsEvent
  isNew: boolean
}

function PropertiesPreview({ properties }: { properties: AnalyticsEvent['properties'] }) {
  const entries = Object.entries(properties ?? {})
  if (entries.length === 0) return <span className="text-gray-300">—</span>

  const shown = entries.slice(0, 3)
  const rest = entries.length - shown.length

  return (
    <span className="flex flex-wrap gap-1">
      {shown.map(([key, value]) => (
        <span key={key} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
          <span className="text-gray-400">{key}</span>={String(value)}
        </span>
      ))}
      {rest > 0 && <span className="px-1 py-0.5 text-xs text-gray-400">+{rest}</span>}
    </span>
  )
}

export const EventRow = memo(function EventRow({ event, isNew }: EventRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const date = new Date(event.timestamp)
  const json = JSON.stringify(event, null, 2)

  function copyJson() {
    void navigator.clipboard?.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <>
      <tr
        onClick={() => setExpanded((e) => !e)}
        className={`cursor-pointer border-b border-gray-100 align-top hover:bg-gray-50 ${
          isNew ? 'animate-[rowIn_0.4s_ease-out]' : ''
        }`}
      >
        <td className="w-px whitespace-nowrap py-2 pl-4 pr-3 text-xs text-gray-500" title={date.toLocaleString()}>
          {formatDistanceToNowStrict(date, { addSuffix: true })}
        </td>
        <td className="w-px whitespace-nowrap py-2 pr-3">
          <EventTypePill eventType={event.eventType} />
        </td>
        <td className="w-px whitespace-nowrap py-2 pr-3 font-mono text-xs text-gray-600">{event.userId}</td>
        <td className="py-2 pr-4">
          <PropertiesPreview properties={event.properties} />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <td colSpan={4} className="px-4 py-3">
            <div className="mb-2 flex items-center gap-3 text-xs text-gray-500">
              <span>{format(date, 'PPpp')}</span>
              <span className="font-mono">id {event.id}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  copyJson()
                }}
                className="rounded border border-gray-300 px-2 py-0.5 font-medium text-gray-600 hover:bg-white"
              >
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700">
              {json}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
})

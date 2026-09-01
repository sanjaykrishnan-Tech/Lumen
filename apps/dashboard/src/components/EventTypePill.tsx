import { colorForEventType } from '../utils/eventColors'

export function EventTypePill({ eventType }: { eventType: string }) {
  const color = colorForEventType(eventType)
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color, backgroundColor: `${color}1a` }}
    >
      {eventType}
    </span>
  )
}

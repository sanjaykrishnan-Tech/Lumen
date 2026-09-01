import type { AnalyticsEvent } from '@lumen/shared-types'

function escapeCell(value: unknown): string {
  const str = value == null ? '' : String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

/** Flatten events to CSV: fixed columns + the union of all property keys. */
export function eventsToCsv(events: AnalyticsEvent[]): string {
  const propKeys = Array.from(
    new Set(events.flatMap((e) => Object.keys(e.properties ?? {}))),
  ).sort()
  const header = ['timestamp', 'eventType', 'userId', 'id', ...propKeys]

  const rows = events.map((e) =>
    [
      e.timestamp,
      e.eventType,
      e.userId,
      e.id,
      ...propKeys.map((k) => e.properties?.[k]),
    ]
      .map(escapeCell)
      .join(','),
  )

  return [header.join(','), ...rows].join('\n')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

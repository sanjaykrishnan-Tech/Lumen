// Stable per-event-type colors, so a given event name looks the same in the
// breakdown chart, the legend, and the live feed pills.

const PALETTE = [
  '#16a34a', // green
  '#0d9488', // teal
  '#2563eb', // blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#dc2626', // red
  '#ea580c', // orange
  '#ca8a04', // amber
  '#4f46e5', // indigo
  '#0891b2', // cyan
  '#65a30d', // lime
  '#9333ea', // purple
]

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function colorForEventType(eventType: string): string {
  // 'error' is conventionally red wherever it shows up
  if (eventType === 'error') return '#dc2626'
  return PALETTE[hash(eventType) % PALETTE.length]
}

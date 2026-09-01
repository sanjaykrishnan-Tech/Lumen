import type { FunnelResult } from '../utils/funnel'
import { colorForEventType } from '../utils/eventColors'

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  const h = m / 60
  if (h < 24) return `${h.toFixed(h < 10 ? 1 : 0)}h`
  return `${(h / 24).toFixed(1)}d`
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`

export function FunnelChart({ result }: { result: FunnelResult }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-4">
        <Metric label="Entered funnel" value={result.entered.toLocaleString()} />
        <Metric label="Converted" value={result.converted.toLocaleString()} />
        <Metric label="Overall conversion" value={pct(result.overallPct)} accent />
      </div>

      <div className="mt-4 space-y-4">
        {result.steps.map((step, i) => {
          const prev = i > 0 ? result.steps[i - 1] : null
          const dropoff = prev ? prev.count - step.count : 0
          return (
            <div key={i}>
              {prev && dropoff > 0 && (
                <p className="mb-1 pl-9 text-xs text-red-500">
                  ↓ {dropoff.toLocaleString()} lost ({pct(1 - step.pctOfPrev)} drop-off)
                </p>
              )}
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="truncate font-medium text-gray-700">{step.eventType || '—'}</span>
                    <span className="shrink-0 pl-2 text-gray-500">
                      {step.count.toLocaleString()} · {pct(step.pctOfFirst)}
                    </span>
                  </div>
                  <div className="h-7 overflow-hidden rounded bg-gray-100">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${Math.max(step.pctOfFirst * 100, 1.5)}%`,
                        backgroundColor: colorForEventType(step.eventType || String(i)),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {result.medianMsToConvert != null && (
        <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
          Median time to convert: {formatDuration(result.medianMsToConvert)}
        </p>
      )}
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? 'text-green-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

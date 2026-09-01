import type { Insight, InsightTone } from '../utils/insights'

const TONE: Record<InsightTone, { dot: string; text: string; icon: string }> = {
  positive: { dot: 'bg-green-500', text: 'text-green-700', icon: '▲' },
  negative: { dot: 'bg-red-500', text: 'text-red-700', icon: '▼' },
  neutral: { dot: 'bg-gray-400', text: 'text-gray-600', icon: '•' },
}

export function InsightsStrip({ insights }: { insights: Insight[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
        Insights · last 24h
      </h2>
      {insights.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing unusual in the last 24 hours.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {insights.map((insight) => {
            const tone = TONE[insight.tone]
            return (
              <li
                key={insight.id}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-3 pr-3.5 text-sm"
              >
                <span className={`text-xs ${tone.text}`}>{tone.icon}</span>
                <span className="text-gray-700">{insight.text}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

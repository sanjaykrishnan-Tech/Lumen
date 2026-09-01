import { format } from 'date-fns'
import type { RetentionResult } from '../utils/retention'

function cellStyle(value: number | null): React.CSSProperties {
  if (value == null) return { background: 'transparent', color: '#d1d5db' }
  const alpha = 0.08 + value * 0.92
  return {
    background: `rgba(22, 163, 74, ${alpha})`,
    color: value > 0.55 ? '#fff' : '#1a1f1a',
  }
}

const fmtPct = (v: number | null) => (v == null ? '·' : `${Math.round(v * 100)}%`)

export function RetentionGrid({ result }: { result: RetentionResult }) {
  const { granularity, periods, rows, averages } = result
  const prefix = granularity === 'week' ? 'W' : 'D'
  const cohortFmt = granularity === 'week' ? "'wk of' MMM d" : 'MMM d'

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-400">
        No cohorts in this range.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full border-collapse text-center text-sm">
        <thead>
          <tr className="text-xs font-medium text-gray-400">
            <th className="px-3 py-2 text-left font-medium">Cohort</th>
            <th className="px-3 py-2 text-right font-medium">Users</th>
            {periods.map((p) => (
              <th key={p} className="px-2 py-2 font-medium">
                {prefix}
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.cohort} className="border-t border-gray-100">
              <td className="whitespace-nowrap px-3 py-2 text-left text-gray-600">
                {format(row.cohort, cohortFmt)}
              </td>
              <td className="px-3 py-2 text-right text-gray-500">{row.size.toLocaleString()}</td>
              {row.values.map((v, i) => (
                <td key={i} className="px-2 py-2 text-xs font-medium" style={cellStyle(v)}>
                  {fmtPct(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200 text-xs font-semibold text-gray-500">
            <td className="px-3 py-2 text-left">Weighted avg</td>
            <td className="px-3 py-2" />
            {averages.map((v, i) => (
              <td key={i} className="px-2 py-2" style={cellStyle(v)}>
                {fmtPct(v)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TimeBucket } from '../utils/aggregate'

type ChartType = 'area' | 'line' | 'bar'

interface TimeSeriesChartProps {
  data: TimeBucket[]
}

const CHART_TYPES: Array<{ key: ChartType; label: string }> = [
  { key: 'area', label: 'Area' },
  { key: 'line', label: 'Line' },
  { key: 'bar', label: 'Bar' },
]

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area')
  const tickInterval = Math.max(0, Math.ceil(data.length / 8) - 1)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500">Events over time</h2>
        <div className="flex gap-1 rounded-md bg-gray-100 p-0.5">
          {CHART_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setChartType(t.key)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                chartType === t.key ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval={tickInterval}
              />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 13 }}
                labelStyle={{ color: '#1a1f1a', fontWeight: 600 }}
                cursor={{ fill: '#f0fdf4' }}
              />
              <Bar dataKey="count" fill="#16a34a" radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval={tickInterval}
              />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 13 }}
                labelStyle={{ color: '#1a1f1a', fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval={tickInterval}
              />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 13 }}
                labelStyle={{ color: '#1a1f1a', fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} fill="url(#eventsGradient)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TimeBucket } from '../utils/aggregate'

interface TimeSeriesChartProps {
  data: TimeBucket[]
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-medium text-gray-500">Events over time (24h)</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
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
              interval={2}
            />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 13 }}
              labelStyle={{ color: '#1a1f1a', fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#eventsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

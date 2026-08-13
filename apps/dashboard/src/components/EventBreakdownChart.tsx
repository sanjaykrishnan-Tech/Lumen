import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { EventTypeCount } from '../utils/aggregate'

interface EventBreakdownChartProps {
  data: EventTypeCount[]
}

const SHADES = ['#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac']

export function EventBreakdownChart({ data }: EventBreakdownChartProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-medium text-gray-500">Events by type</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              dataKey="eventType"
              type="category"
              tick={{ fontSize: 12, fill: '#374151' }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 13 }}
              cursor={{ fill: '#f0fdf4' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={entry.eventType} fill={SHADES[index % SHADES.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

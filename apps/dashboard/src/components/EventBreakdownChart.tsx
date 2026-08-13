import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { EventTypeCount } from '../utils/aggregate'

type ChartType = 'bar' | 'pie'

interface EventBreakdownChartProps {
  data: EventTypeCount[]
  selected: string[]
  onToggle: (eventType: string) => void
}

const SHADES = ['#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4']

export function EventBreakdownChart({ data, selected, onToggle }: EventBreakdownChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')

  const isFiltering = selected.length > 0
  const opacityFor = (eventType: string) => (!isFiltering || selected.includes(eventType) ? 1 : 0.25)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500">
          Events by type <span className="font-normal text-gray-400">(click to filter)</span>
        </h2>
        <div className="flex gap-1 rounded-md bg-gray-100 p-0.5">
          {(['bar', 'pie'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setChartType(t)}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition ${
                chartType === t ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
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
              <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer">
                {data.map((entry, index) => (
                  <Cell
                    key={entry.eventType}
                    fill={SHADES[index % SHADES.length]}
                    fillOpacity={opacityFor(entry.eventType)}
                    onClick={() => onToggle(entry.eventType)}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 13 }} />
              <Pie
                data={data}
                dataKey="count"
                nameKey="eventType"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.eventType}
                    fill={SHADES[index % SHADES.length]}
                    fillOpacity={opacityFor(entry.eventType)}
                    onClick={() => onToggle(entry.eventType)}
                  />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
      {chartType === 'pie' && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {data.map((entry, index) => (
            <button
              key={entry.eventType}
              type="button"
              onClick={() => onToggle(entry.eventType)}
              className="flex items-center gap-1.5 text-xs"
              style={{ opacity: opacityFor(entry.eventType) }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SHADES[index % SHADES.length] }} />
              <span className="text-gray-600">{entry.eventType}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

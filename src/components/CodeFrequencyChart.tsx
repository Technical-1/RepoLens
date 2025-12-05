'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { FullRepoAnalysis } from '@/types'

interface CodeFrequencyChartProps {
  data: FullRepoAnalysis
}

export default function CodeFrequencyChart({ data }: CodeFrequencyChartProps) {
  // Transform data for the chart - only show last 52 weeks
  const chartData = data.codeFrequency
    .slice(-52)
    .map((item) => ({
      date: new Date(item.week * 1000).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      additions: item.additions,
      deletions: item.deletions,
    }))

  if (chartData.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 border border-github-border/50 fade-in">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-red-400"></span>
          Code Frequency
        </h3>
        <div className="h-64 flex items-center justify-center text-github-muted">
          <p>Code frequency data is being computed. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-6 border border-github-border/50 fade-in">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-red-400"></span>
        Code Frequency (Last Year)
      </h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorAdditions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3fb950" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3fb950" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDeletions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f85149" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f85149" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#30363d"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#8b949e', fontSize: 12 }}
              axisLine={{ stroke: '#30363d' }}
              tickLine={{ stroke: '#30363d' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#8b949e', fontSize: 12 }}
              axisLine={{ stroke: '#30363d' }}
              tickLine={{ stroke: '#30363d' }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              }}
              labelStyle={{ color: '#c9d1d9' }}
              itemStyle={{ color: '#8b949e' }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name === 'additions' ? 'Additions' : 'Deletions',
              ]}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span className="text-github-muted text-sm">
                  {value === 'additions' ? 'Lines Added' : 'Lines Deleted'}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="additions"
              stroke="#3fb950"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAdditions)"
            />
            <Area
              type="monotone"
              dataKey="deletions"
              stroke="#f85149"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDeletions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

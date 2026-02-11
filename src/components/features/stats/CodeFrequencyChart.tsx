'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
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
import type { FullRepoAnalysis, CodeFrequency } from '@/types'

interface CodeFrequencyChartProps {
  data: FullRepoAnalysis
}

export default function CodeFrequencyChart({ data }: CodeFrequencyChartProps) {
  const [localData, setLocalData] = useState<CodeFrequency[]>(data.codeFrequency)
  const [isPolling, setIsPolling] = useState(false)
  const [isUnavailable, setIsUnavailable] = useState(false)
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null)
  const isCalculated = data.codeFrequencyIsCalculated
  const pollCountRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxPolls = 5 // Poll up to 5 times with backoff

  // Extract owner/repo from the URL
  const repoUrl = data.repo.url
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  const owner = match?.[1]
  const repo = match?.[2]

  useEffect(() => {
    // If we have data (including calculated), stats are unavailable, or no repo info, don't poll
    if (localData.length > 0 || isUnavailable || isCalculated || !owner || !repo) {
      return
    }

    const abortController = new AbortController()

    // Progressive backoff intervals: 3s, 6s, 12s, 24s, 48s (total ~93s)
    const getBackoffDelay = (attempt: number) => {
      const baseDelay = 3000
      return baseDelay * Math.pow(2, attempt)
    }

    const poll = async () => {
      if (abortController.signal.aborted) return
      setIsPolling(true)

      try {
        const res = await fetch('/api/repo/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner, repo, type: 'codeFrequency' }),
          signal: abortController.signal,
        })

        if (res.ok) {
          const result = await res.json()

          // Check if stats are marked as unavailable (e.g., too many commits)
          if (result.unavailable) {
            setIsUnavailable(true)
            setUnavailableReason(result.reason || 'Statistics not available for this repository')
            setIsPolling(false)
            return
          }

          // Check if data is ready
          if (result.data && result.data.length > 0) {
            setLocalData(result.data)
            setIsPolling(false)
            return
          }

          // If computing, continue polling
          if (result.computing) {
            pollCountRef.current += 1
            if (pollCountRef.current < maxPolls) {
              const delay = getBackoffDelay(pollCountRef.current)
              timeoutRef.current = setTimeout(poll, delay)
            } else {
              setIsPolling(false)
            }
            return
          }
        }

        // Non-200 response or unexpected format
        pollCountRef.current += 1
        if (pollCountRef.current < maxPolls) {
          const delay = getBackoffDelay(pollCountRef.current)
          timeoutRef.current = setTimeout(poll, delay)
        } else {
          setIsPolling(false)
        }
      } catch (error) {
        // Ignore abort errors — expected on unmount
        if (error instanceof DOMException && error.name === 'AbortError') return
        // Network error - try again with backoff
        pollCountRef.current += 1
        if (pollCountRef.current < maxPolls) {
          const delay = getBackoffDelay(pollCountRef.current)
          timeoutRef.current = setTimeout(poll, delay)
        } else {
          setIsPolling(false)
        }
      }
    }

    // Initial poll after 3 seconds
    timeoutRef.current = setTimeout(poll, 3000)

    return () => {
      abortController.abort()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [localData.length, owner, repo, isUnavailable, isCalculated])

  // Transform data for the chart - only show last 52 weeks
  const chartData = localData
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
        <div className="h-64 flex flex-col items-center justify-center text-github-muted text-center px-4">
          {isPolling ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin mb-3 text-github-accent" />
              <p className="mb-2">GitHub is generating statistics...</p>
              <p className="text-sm text-github-muted/70">
                This usually takes a few seconds. Auto-refreshing...
              </p>
            </>
          ) : isUnavailable ? (
            <>
              <AlertCircle className="w-6 h-6 mb-3 text-yellow-500" />
              <p className="mb-2 text-yellow-400">Code frequency not available</p>
              <p className="text-sm text-github-muted/70">
                {unavailableReason || 'This repository is too large for GitHub to compute code frequency statistics.'}
              </p>
            </>
          ) : (
            <>
              <p className="mb-2">Statistics unavailable for this repository.</p>
              <p className="text-sm text-github-muted/70">
                GitHub may still be computing stats. Try reloading the page later.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-6 border border-github-border/50 fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-red-400"></span>
          Code Frequency
        </h3>
        {isCalculated && (
          <span className="text-xs text-github-muted bg-github-card px-2 py-1 rounded-md border border-github-border">
            Based on {data.commits.length} recent commits
          </span>
        )}
      </div>

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

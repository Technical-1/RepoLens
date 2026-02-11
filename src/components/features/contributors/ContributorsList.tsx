'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Plus, Minus, GitCommit } from 'lucide-react'
import type { FullRepoAnalysis, ContributorStats } from '@/types'
import Image from 'next/image'
import { formatNumber } from '@/lib/format'

interface ContributorsListProps {
  data: FullRepoAnalysis
}

function getContributorStats(contributor: ContributorStats) {
  if (!contributor.weeks || contributor.weeks.length === 0) {
    return { additions: 0, deletions: 0, hasWeeklyData: false }
  }
  const totals = contributor.weeks.reduce(
    (acc, week) => ({
      additions: acc.additions + week.additions,
      deletions: acc.deletions + week.deletions,
    }),
    { additions: 0, deletions: 0 }
  )
  return { ...totals, hasWeeklyData: true }
}

export default function ContributorsList({ data }: ContributorsListProps) {
  const [showAll, setShowAll] = useState(false)

  const sortedContributors = useMemo(
    () => [...data.contributors].sort((a, b) => b.total - a.total),
    [data.contributors]
  )

  const displayedContributors = useMemo(
    () => showAll ? sortedContributors : sortedContributors.slice(0, 10),
    [showAll, sortedContributors]
  )

  const maxCommits = useMemo(
    () => sortedContributors[0]?.total || 1,
    [sortedContributors]
  )

  if (sortedContributors.length === 0) {
    return (
      <div className="glass-card rounded-xl border border-github-border/50 fade-in overflow-hidden">
        <div className="p-6 border-b border-github-border/50">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"></span>
            Top Contributors
          </h3>
        </div>
        <div className="p-8 text-center text-github-muted">
          No contributor data available for this repository.
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl border border-github-border/50 fade-in overflow-hidden">
      <div className="p-6 border-b border-github-border/50">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"></span>
          Top Contributors
        </h3>
        <p className="text-github-muted text-sm mt-1">
          {data.contributors.length} total contributors
        </p>
      </div>

      <div className="divide-y divide-github-border/30">
        {displayedContributors.map((contributor, index) => {
          const stats = getContributorStats(contributor)
          const barWidth = (contributor.total / maxCommits) * 100

          return (
            <div
              key={contributor.author}
              className="p-4 hover:bg-github-border/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-6 text-center text-github-muted font-mono text-sm">
                  #{index + 1}
                </div>

                {/* Avatar */}
                {contributor.avatar ? (
                  <Image
                    src={contributor.avatar}
                    alt={contributor.author}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-github-border flex items-center justify-center">
                    <span className="text-github-muted text-sm">
                      {contributor.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                    <a
                      href={`https://github.com/${contributor.author}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-github-link hover:underline font-medium truncate"
                    >
                      {contributor.author}
                    </a>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-github-muted">
                        <GitCommit className="w-4 h-4" />
                        {formatNumber(contributor.total, true)}
                      </span>
                      {stats.hasWeeklyData && (
                        <>
                          <span className="flex items-center gap-1 text-green-400">
                            <Plus className="w-3.5 h-3.5" />
                            {formatNumber(stats.additions, true)}
                          </span>
                          <span className="flex items-center gap-1 text-red-400">
                            <Minus className="w-3.5 h-3.5" />
                            {formatNumber(stats.deletions, true)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-github-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-github-accent to-green-400 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show More/Less Button */}
      {data.contributors.length > 10 && (
        <div className="p-4 border-t border-github-border/50">
          <button
            onClick={() => setShowAll(!showAll)}
            aria-expanded={showAll}
            className="w-full py-2 text-github-link hover:text-github-text flex items-center justify-center gap-2 transition-colors"
          >
            {showAll ? (
              <>
                Show Less
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show All {data.contributors.length} Contributors
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

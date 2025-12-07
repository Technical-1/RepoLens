'use client'

import { useState } from 'react'
import { Plus, Minus, ChevronDown, ChevronUp, FileCode, GitCommit } from 'lucide-react'
import type { FullRepoAnalysis } from '@/types'
import Image from 'next/image'

interface CommitHistoryProps {
  data: FullRepoAnalysis
}

export default function CommitHistory({ data }: CommitHistoryProps) {
  const [showAll, setShowAll] = useState(false)
  const displayedCommits = showAll ? data.commits : data.commits.slice(0, 10)

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="glass-card rounded-xl border border-github-border/50 fade-in overflow-hidden">
      <div className="p-6 border-b border-github-border/50">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></span>
          Commit History
        </h3>
        <p className="text-github-muted text-sm mt-1">
          Showing {displayedCommits.length} of {data.commits.length} analyzed commits
        </p>
      </div>

      <div className="divide-y divide-github-border/30">
        {displayedCommits.map((commit) => (
          <div
            key={commit.sha}
            className="commit-row p-4 hover:bg-github-border/20 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {commit.authorAvatar ? (
                  <Image
                    src={commit.authorAvatar}
                    alt={commit.author}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-github-border flex items-center justify-center">
                    <GitCommit className="w-5 h-5 text-github-muted" />
                  </div>
                )}
              </div>

              {/* Commit Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-github-text font-medium truncate" title={commit.message}>
                      {commit.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-github-muted">
                      <span className="font-medium">{commit.author}</span>
                      <span>•</span>
                      <span>{formatDate(commit.date)}</span>
                      <span>•</span>
                      <a
                        href={`${data.repo.url}/commit/${commit.sha}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs bg-github-card px-2 py-0.5 rounded hover:bg-github-border hover:text-github-link transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {commit.sha.slice(0, 7)}
                      </a>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <Plus className="w-4 h-4" />
                      {formatNumber(commit.additions)}
                    </span>
                    <span className="flex items-center gap-1 text-red-400 text-sm">
                      <Minus className="w-4 h-4" />
                      {formatNumber(commit.deletions)}
                    </span>
                    <span className="flex items-center gap-1 text-github-muted text-sm">
                      <FileCode className="w-4 h-4" />
                      {commit.files}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {data.commits.length > 10 && (
        <div className="p-4 border-t border-github-border/50">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-github-link hover:text-github-text flex items-center justify-center gap-2 transition-colors"
          >
            {showAll ? (
              <>
                Show Less
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show All {data.commits.length} Commits
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

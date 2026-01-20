'use client'

import { 
  Code, 
  GitCommit, 
  Plus, 
  Minus, 
  Star, 
  GitFork, 
  Eye,
  Calendar,
  Users,
  Share2
} from 'lucide-react'
import type { FullRepoAnalysis } from '@/types'

interface StatsOverviewProps {
  data: FullRepoAnalysis
  onEmbed?: () => void
}

export default function StatsOverview({ data, onEmbed }: StatsOverviewProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const stats = [
    {
      label: 'Total Lines',
      value: formatNumber(data.totalLines),
      subtext: 'Based on commit history',
      icon: Code,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Lines Added',
      value: formatNumber(data.totalAdditions),
      subtext: 'From analyzed commits',
      icon: Plus,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Lines Removed',
      value: formatNumber(data.totalDeletions),
      subtext: 'From analyzed commits',
      icon: Minus,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Commits',
      value: formatNumber(data.commits.length),
      subtext: 'Recent commits analyzed',
      icon: GitCommit,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Stars',
      value: formatNumber(data.repo.stars),
      subtext: 'Repository stars',
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Forks',
      value: formatNumber(data.repo.forks),
      subtext: 'Repository forks',
      icon: GitFork,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
  ]

  return (
    <div className="space-y-6 fade-in">
      {/* Repository Header */}
      <div className="glass-card rounded-xl p-6 border border-github-border/50">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">
                {data.repo.fullName}
              </h2>
              <span className={`privacy-badge ${data.repo.private ? 'private' : 'public'}`}>
                {data.repo.private ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Private
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Public
                  </>
                )}
              </span>
            </div>
            {data.repo.description && (
              <p className="text-github-muted max-w-2xl">{data.repo.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-github-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Created {formatDate(data.repo.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <GitCommit className="w-4 h-4" />
                Last push {formatDate(data.repo.pushedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {data.contributors.length} contributors
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            {!data.repo.private && onEmbed && (
              <button
                onClick={onEmbed}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-github-accent hover:bg-github-accent-hover rounded-lg text-white font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Embed
              </button>
            )}
            <a
              href={data.repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-github-card hover:bg-github-border/50 border border-github-border rounded-lg text-github-text transition-colors"
            >
              View on GitHub
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="stat-card glass-card rounded-xl p-4 border border-github-border/50"
          >
            <div className={`inline-flex p-2 rounded-lg ${stat.bgColor} mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-github-muted">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

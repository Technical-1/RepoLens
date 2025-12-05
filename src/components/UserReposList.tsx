'use client'

import { useState, useEffect } from 'react'
import { Star, Lock, Globe, Search, Loader2, GitFork } from 'lucide-react'
import type { UserRepo } from '@/types'
import { LANGUAGE_COLORS } from '@/types'

interface UserReposListProps {
  onSelectRepo: (url: string) => void
}

export default function UserReposList({ onSelectRepo }: UserReposListProps) {
  const [repos, setRepos] = useState<UserRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all')

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch('/api/user/repos')
        if (!res.ok) throw new Error('Failed to fetch repos')
        const data = await res.json()
        setRepos(data.repos)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repositories')
      } finally {
        setLoading(false)
      }
    }

    fetchRepos()
  }, [])

  const filteredRepos = repos.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      repo.description?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === 'all' ||
      (filter === 'public' && !repo.private) ||
      (filter === 'private' && repo.private)
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffInDays === 0) return 'Updated today'
    if (diffInDays === 1) return 'Updated yesterday'
    if (diffInDays < 7) return `Updated ${diffInDays} days ago`
    if (diffInDays < 30) return `Updated ${Math.floor(diffInDays / 7)} weeks ago`
    return `Updated ${Math.floor(diffInDays / 30)} months ago`
  }

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-8 border border-github-border/50">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-github-accent" />
          <p className="text-github-muted">Loading your repositories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-8 border border-red-500/30 bg-red-500/5">
        <p className="text-red-400 text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl border border-github-border/50 overflow-hidden">
      <div className="p-6 border-b border-github-border/50">
        <h3 className="text-xl font-semibold text-white mb-4">Your Repositories</h3>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-github-muted" />
            <input
              type="text"
              placeholder="Find a repository..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-github-dark border border-github-border rounded-lg text-github-text placeholder:text-github-muted/60 focus:border-github-accent transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'public', 'private'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-github-accent text-white'
                    : 'bg-github-dark text-github-muted hover:text-github-text border border-github-border'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Repo List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredRepos.length === 0 ? (
          <div className="p-8 text-center text-github-muted">
            No repositories found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-github-border/30">
            {filteredRepos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => onSelectRepo(repo.url)}
                className="w-full p-4 text-left hover:bg-github-border/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-github-link font-medium hover:underline truncate">
                        {repo.name}
                      </span>
                      {repo.private ? (
                        <span className="flex items-center gap-1 text-xs text-github-muted bg-github-card px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" />
                          Private
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-github-muted bg-github-card px-2 py-0.5 rounded-full">
                          <Globe className="w-3 h-3" />
                          Public
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-github-muted text-sm truncate mb-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-github-muted">
                      {repo.language && (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                LANGUAGE_COLORS[repo.language] ||
                                LANGUAGE_COLORS.default,
                            }}
                          />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        {repo.stars}
                      </span>
                      <span>{formatDate(repo.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-github-muted">
                    <GitFork className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-github-border/50 bg-github-dark/50">
        <div className="flex items-center justify-between text-sm text-github-muted">
          <span>{repos.length} repositories total</span>
          <span>
            {repos.filter((r) => !r.private).length} public,{' '}
            {repos.filter((r) => r.private).length} private
          </span>
        </div>
      </div>
    </div>
  )
}

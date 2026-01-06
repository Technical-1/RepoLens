'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import {
  Header,
  Footer,
  RepoInput,
  UserReposList,
  ParticleBackground,
  LoadingSkeleton,
} from '@/components'
import type { UserRepo } from '@/types'

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

function DashboardContent() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  // Cached user repos state
  const [userRepos, setUserRepos] = useState<UserRepo[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  const reposFetchedAtRef = useRef<number | null>(null)
  const hasFetchedRef = useRef(false)

  // Fetch repos function - stable reference
  const fetchUserRepos = useCallback(async (force = false) => {
    if (status !== 'authenticated') return
    
    // Prevent duplicate fetches
    if (!force && hasFetchedRef.current) return
    if (!force && reposFetchedAtRef.current && Date.now() - reposFetchedAtRef.current < CACHE_TTL) {
      return
    }

    setReposLoading(true)
    setReposError(null)
    hasFetchedRef.current = true

    try {
      const res = await fetch('/api/user/repos')
      if (!res.ok) throw new Error('Failed to fetch repos')
      const data = await res.json()
      setUserRepos(data.repos || [])
      reposFetchedAtRef.current = Date.now()
    } catch (err) {
      setReposError(err instanceof Error ? err.message : 'Failed to load repositories')
      hasFetchedRef.current = false // Allow retry on error
    } finally {
      setReposLoading(false)
    }
  }, [status])

  // Fetch repos when authenticated - only once
  useEffect(() => {
    if (status === 'authenticated' && !hasFetchedRef.current) {
      fetchUserRepos()
    }
  }, [status, fetchUserRepos])

  const handleRefreshRepos = useCallback(() => {
    hasFetchedRef.current = false
    fetchUserRepos(true)
  }, [fetchUserRepos])

  const analyzeRepo = async (url: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to analyze repository')
        return
      }

      // Navigate to the repo stats page
      if (data.repo?.fullName) {
        const [owner, name] = data.repo.fullName.split('/')
        router.push(`/repo/${owner}/${name}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRepo = (url: string) => {
    // Parse the URL to get owner/repo
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (match) {
      router.push(`/repo/${match[1]}/${match[2]}`)
    } else {
      analyzeRepo(url)
    }
  }

  return (
    <main className="min-h-screen animated-gradient relative">
      <ParticleBackground />
      <Header />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto">

          {/* Search Toggle */}
          {!showSearch ? (
            <button
              onClick={() => setShowSearch(true)}
              className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-github-card hover:bg-github-border/50 border border-github-border rounded-lg text-github-muted hover:text-github-text transition-colors"
            >
              <Search className="w-4 h-4" />
              Search any repository...
            </button>
          ) : (
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setShowSearch(false)}
                  className="flex items-center gap-2 text-github-link hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <span className="text-github-muted">Search any repository</span>
              </div>
              <RepoInput onAnalyze={analyzeRepo} isLoading={loading} error={error} initialValue="" />
            </div>
          )}

          {/* Error Display */}
          {error && !showSearch && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mb-6 p-8 glass-card rounded-xl border border-github-border/50 flex items-center justify-center">
              <div className="flex items-center gap-3 text-github-muted">
                <div className="w-5 h-5 border-2 border-github-accent border-t-transparent rounded-full animate-spin" />
                <span>Analyzing repository...</span>
              </div>
            </div>
          )}

          {/* User Repos */}
          {!showSearch && !loading && (
            <UserReposList
              repos={userRepos}
              loading={reposLoading}
              error={reposError}
              onSelectRepo={handleSelectRepo}
              onRefresh={handleRefreshRepos}
            />
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}


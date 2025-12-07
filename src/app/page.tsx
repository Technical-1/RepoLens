'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Github, Lock, ArrowLeft, Search } from 'lucide-react'
import Header from '@/components/Header'
import RepoInput from '@/components/RepoInput'
import PrivacyNotice from '@/components/PrivacyNotice'
import StatsOverview from '@/components/StatsOverview'
import LanguageBreakdown from '@/components/LanguageBreakdown'
import CommitHistory from '@/components/CommitHistory'
import CodeFrequencyChart from '@/components/CodeFrequencyChart'
import ContributorsList from '@/components/ContributorsList'
import UserReposList from '@/components/UserReposList'
import ParticleBackground from '@/components/ParticleBackground'
import type { FullRepoAnalysis, UserRepo } from '@/types'

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

export default function Home() {
  const { data: session, status } = useSession()
  const [repoData, setRepoData] = useState<FullRepoAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  // Cached user repos state
  const [userRepos, setUserRepos] = useState<UserRepo[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  const [reposFetchedAt, setReposFetchedAt] = useState<number | null>(null)

  // Fetch repos function
  const fetchUserRepos = useCallback(async (force = false) => {
    // Skip if not authenticated
    if (status !== 'authenticated') return

    // Skip if we have fresh data (unless forcing refresh)
    if (!force && reposFetchedAt && Date.now() - reposFetchedAt < CACHE_TTL) {
      return
    }

    setReposLoading(true)
    setReposError(null)

    try {
      const res = await fetch('/api/user/repos')
      if (!res.ok) throw new Error('Failed to fetch repos')
      const data = await res.json()
      setUserRepos(data.repos || [])
      setReposFetchedAt(Date.now())
    } catch (err) {
      setReposError(err instanceof Error ? err.message : 'Failed to load repositories')
    } finally {
      setReposLoading(false)
    }
  }, [status, reposFetchedAt])

  // Fetch repos when authenticated (with cache check)
  useEffect(() => {
    if (status === 'authenticated' && !reposFetchedAt && !reposLoading) {
      fetchUserRepos()
    }
  }, [status, reposFetchedAt, reposLoading, fetchUserRepos])

  // Refresh handler for manual refresh
  const handleRefreshRepos = useCallback(() => {
    fetchUserRepos(true)
  }, [fetchUserRepos])

  const analyzeRepo = async (url: string) => {
    setLoading(true)
    setError(null)
    setRequiresAuth(false)
    setRepoData(null)
    setShowSearch(false)

    try {
      const res = await fetch('/api/repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to analyze repository')
        setRequiresAuth(data.requiresAuth || false)
        return
      }

      setRepoData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const goBackToRepos = () => {
    setRepoData(null)
    setError(null)
    setShowSearch(false)
  }

  const isAuthenticated = status === 'authenticated' && session

  // Authenticated user viewing repo stats
  if (isAuthenticated && repoData) {
    return (
      <main className="min-h-screen animated-gradient relative">
        <ParticleBackground />
        <Header />
        
        <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Back Navigation */}
            <button
              onClick={goBackToRepos}
              className="mb-6 flex items-center gap-2 text-github-link hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to My Repositories
            </button>

            {/* Stats Content */}
            <div className="space-y-8">
              <StatsOverview data={repoData} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <LanguageBreakdown data={repoData} />
                <CodeFrequencyChart data={repoData} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CommitHistory data={repoData} />
                <ContributorsList data={repoData} />
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    )
  }

  // Authenticated user dashboard (no repo selected)
  if (isAuthenticated && !repoData) {
    return (
      <main className="min-h-screen animated-gradient relative">
        <ParticleBackground />
        <Header />
        
        <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Dashboard Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {session.user?.name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-github-muted">
                Select a repository to analyze or search for any public repo.
              </p>
            </div>

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
                <RepoInput onAnalyze={analyzeRepo} isLoading={loading} error={error} />
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
                onSelectRepo={analyzeRepo}
                onRefresh={handleRefreshRepos}
              />
            )}
          </div>
        </div>

        <Footer />
      </main>
    )
  }

  // Public landing page (not authenticated)
  return (
    <main className="min-h-screen animated-gradient relative">
      <ParticleBackground />
      <Header />

      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-white">Analyze Any </span>
              <span className="gradient-text">GitHub Repository</span>
            </h1>
            <p className="text-xl text-github-muted max-w-2xl mx-auto">
              Get detailed insights into lines of code, language breakdown, commit history,
              and contributor statistics for any repository.
            </p>
          </div>

          {/* Repo Input */}
          <RepoInput onAnalyze={analyzeRepo} isLoading={loading} error={error} />

          {/* Auth Required Message */}
          {requiresAuth && !session && (
            <div className="mt-8 max-w-3xl mx-auto glass-card rounded-xl p-6 border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Lock className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                    Private Repository Detected
                  </h3>
                  <p className="text-github-muted mb-4">
                    This repository is private or requires authentication. Sign in with GitHub
                    to access private repositories and get higher API rate limits.
                  </p>
                  <button
                    onClick={() => signIn('github')}
                    className="btn-primary px-6 py-2.5 rounded-lg text-white font-medium flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    Sign in with GitHub
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {repoData && (
        <div className="px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <StatsOverview data={repoData} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <LanguageBreakdown data={repoData} />
              <CodeFrequencyChart data={repoData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CommitHistory data={repoData} />
              <ContributorsList data={repoData} />
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice (when not logged in and no repo selected) */}
      {!session && !repoData && !loading && (
        <div className="px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
          <div className="max-w-3xl mx-auto">
            <PrivacyNotice />
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}

function Footer() {
  return (
    <footer className="border-t border-github-border/50 py-8 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-github-muted">
          <a
            href="https://jacobkanfer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-github-text transition-colors group"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 384 384"
              className="opacity-60 group-hover:opacity-100 transition-opacity"
              fill="currentColor"
            >
              <g transform="matrix(1.3333333,0,0,-1.3333333,0,384)">
                <g transform="scale(0.1)">
                  <path d="M 230.73,2650.1 H 2649.92 V 2487.99 H 2880 V 2880 H 0 V 1319.25 H 230.73 V 2650.1" />
                  <path d="M 2649.92,2057.71 V 949.75 L 2880,612.801 V 2397.09 l -230.08,-339.38" />
                  <path d="M 2879.97,390.34 H 2649.92 V 228.719 H 230.73 V 521.922 L 0,656.16 V 0 h 2880 v 390.34 h -0.03" />
                  <path d="m 2175.09,1502.81 c 0,0 602.57,885.59 615.54,904.98 -40.45,0 -721.68,0 -721.68,0 l -472.6,-812.43 c 0,0 0,514.94 0,812.43 -239.68,0 -713.729,0 -713.729,0 V 839.539 H 703.008 V 1239.06 H 0 V 748.961 L 478.535,470.539 H 1596.35 l 0.09,822.531 566.93,-822.531 h 716.6 L 2175.09,1502.81" />
                </g>
              </g>
            </svg>
            <span>Built by Jacob Kanfer</span>
          </a>
          <p>Built with Next.js 15, React 19, and the GitHub API</p>
        </div>
      </div>
    </footer>
  )
}

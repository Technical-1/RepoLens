'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Github, Lock } from 'lucide-react'
import Header from '@/components/Header'
import RepoInput from '@/components/RepoInput'
import PrivacyNotice from '@/components/PrivacyNotice'
import StatsOverview from '@/components/StatsOverview'
import LanguageBreakdown from '@/components/LanguageBreakdown'
import CommitHistory from '@/components/CommitHistory'
import CodeFrequencyChart from '@/components/CodeFrequencyChart'
import ContributorsList from '@/components/ContributorsList'
import UserReposList from '@/components/UserReposList'
import type { FullRepoAnalysis } from '@/types'

export default function Home() {
  const { data: session } = useSession()
  const [repoData, setRepoData] = useState<FullRepoAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresAuth, setRequiresAuth] = useState(false)

  const analyzeRepo = async (url: string) => {
    setLoading(true)
    setError(null)
    setRequiresAuth(false)
    setRepoData(null)

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

  return (
    <main className="min-h-screen animated-gradient">
      <Header />

      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
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
        <div className="px-4 sm:px-6 lg:px-8 pb-16">
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

      {/* User Repos Section (when logged in and no repo selected) */}
      {session && !repoData && !loading && (
        <div className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-4xl mx-auto">
            <UserReposList onSelectRepo={analyzeRepo} />
          </div>
        </div>
      )}

      {/* Privacy Notice (when not logged in and no repo selected) */}
      {!session && !repoData && !loading && (
        <div className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-3xl mx-auto">
            <PrivacyNotice />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-github-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-github-muted">
            <p>Built with Next.js 15, React 19, and the GitHub API</p>
            <div className="flex items-center gap-6">
              <a
                href="https://docs.github.com/en/rest"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-github-text transition-colors"
              >
                GitHub API Docs
              </a>
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-github-text transition-colors"
              >
                Manage OAuth Apps
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

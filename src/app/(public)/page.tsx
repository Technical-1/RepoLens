'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Github, Lock } from 'lucide-react'
import {
  Header,
  Footer,
  RepoInput,
  PrivacyNotice,
  StatsOverview,
  LanguageBreakdown,
  CommitHistory,
  CodeFrequencyChart,
  ContributorsList,
  ParticleBackground,
  EmbedShare,
  LoadingSkeleton,
} from '@/components'
import type { FullRepoAnalysis } from '@/types'

function PublicPageContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [repoData, setRepoData] = useState<FullRepoAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const initialLoadDone = useRef(false)
  
  // Get initial repo from URL param for pre-filling input
  const initialRepoParam = searchParams.get('repo') || ''

  // Redirect authenticated users to dashboard (unless viewing a specific repo)
  useEffect(() => {
    if (status === 'authenticated' && session && !searchParams.get('repo') && !repoData && !loading) {
      router.push('/dashboard')
    }
  }, [status, session, router, searchParams, repoData, loading])

  const analyzeRepoInternal = useCallback(async (url: string, updateUrl: boolean = true) => {
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
        if (updateUrl) {
          router.replace('/', { scroll: false })
        }
        return
      }

      setRepoData(data)
      
      // Update URL with repo info
      if (updateUrl && data.repo?.fullName) {
        router.replace(`/?repo=${encodeURIComponent(data.repo.fullName)}`, { scroll: false })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      if (updateUrl) {
        router.replace('/', { scroll: false })
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  // Check URL for repo param on initial load
  useEffect(() => {
    if (initialLoadDone.current) return
    
    const repoParam = searchParams.get('repo')
    if (repoParam && !repoData && !loading) {
      initialLoadDone.current = true
      analyzeRepoInternal(decodeURIComponent(repoParam), false)
    } else {
      initialLoadDone.current = true
    }
  }, [searchParams, repoData, loading, analyzeRepoInternal])

  const analyzeRepo = useCallback((url: string) => {
    analyzeRepoInternal(url, true)
  }, [analyzeRepoInternal])

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
          <RepoInput onAnalyze={analyzeRepo} isLoading={loading} error={error} initialValue={initialRepoParam} />

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
            <StatsOverview data={repoData} onEmbed={() => setShowEmbed(true)} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <LanguageBreakdown data={repoData} />
              <CodeFrequencyChart data={repoData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CommitHistory data={repoData} />
              <ContributorsList data={repoData} />
            </div>
          </div>

          {/* Embed Modal */}
          {showEmbed && (
            <EmbedShare
              repoFullName={repoData.repo.fullName}
              onClose={() => setShowEmbed(false)}
            />
          )}
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

export default function PublicPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PublicPageContent />
    </Suspense>
  )
}


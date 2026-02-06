'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import {
  Header,
  Footer,
  StatsOverview,
  LanguageBreakdown,
  CommitHistory,
  CodeFrequencyChart,
  ContributorsList,
  ParticleBackground,
  EmbedShare,
} from '@/components'
import type { FullRepoAnalysis } from '@/types'

interface RepoPageClientProps {
  owner: string
  name: string
}

export default function RepoPageClient({ owner, name }: RepoPageClientProps) {
  const { status } = useSession()
  const router = useRouter()
  const [repoData, setRepoData] = useState<FullRepoAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEmbed, setShowEmbed] = useState(false)

  // Fetch repo data
  useEffect(() => {
    const fetchRepoData = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/repo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl: `${owner}/${name}` }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to analyze repository')
          return
        }

        setRepoData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRepoData()
  }, [owner, name])

  const goBack = () => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen animated-gradient relative">
        <ParticleBackground />
        <Header />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-github-accent" />
                <p className="text-github-muted">Analyzing repository...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen animated-gradient relative">
        <ParticleBackground />
        <Header />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-2 text-github-link hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {status === 'authenticated' ? 'Back to Dashboard' : 'Back to Home'}
            </button>
            <div className="p-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <h2 className="text-xl font-semibold mb-2">Error Loading Repository</h2>
              <p>{error}</p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!repoData) {
    return null
  }

  return (
    <main className="min-h-screen animated-gradient relative">
      <ParticleBackground />
      <Header />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Back Navigation */}
          <button
            onClick={goBack}
            className="mb-6 flex items-center gap-2 text-github-link hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {status === 'authenticated' ? 'Back to My Repositories' : 'Back to Home'}
          </button>

          {/* Stats Content */}
          <div className="space-y-8">
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
        </div>
      </div>

      {/* Embed Modal */}
      {showEmbed && repoData && (
        <EmbedShare
          repoFullName={repoData.repo.fullName}
          onClose={() => setShowEmbed(false)}
        />
      )}

      <Footer />
    </main>
  )
}

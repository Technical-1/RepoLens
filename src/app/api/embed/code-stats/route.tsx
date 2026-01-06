import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { 
  getEmbedTheme, 
  formatEmbedNumber, 
  createErrorImageResponse, 
  getErrorDetails,
  type StatItem,
} from '@/lib/embed-utils'

export const runtime = 'edge'

const IMAGE_WIDTH = 720
const IMAGE_HEIGHT_FULL = 260
const IMAGE_HEIGHT_COMPACT = 160

// Proxy URL for authenticated GitHub API calls
const GITHUB_PROXY_URL = process.env.NEXT_PUBLIC_GITHUB_PROXY_URL || ''

interface CommitListItem {
  sha: string
  commit: { message: string; author: { name?: string; date?: string } | null }
  author: { avatar_url?: string } | null
}

interface CommitDetail {
  stats?: { additions?: number; deletions?: number }
}

async function fetchFromProxy<T>(path: string): Promise<T> {
  if (!GITHUB_PROXY_URL) {
    throw new Error('Proxy not configured')
  }
  const response = await fetch(`${GITHUB_PROXY_URL}/github${path}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'X-RepoLens-Server': 'repolens-server-request',
    },
  })
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
  return response.json()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const theme = searchParams.get('theme') || 'dark'
  const hideRepoName = searchParams.get('hideRepoName') === 'true'

  if (!owner || !repo) {
    return new Response('Missing owner or repo parameter', { status: 400 })
  }

  try {
    let repoFullName = `${owner}/${repo}`
    let totalAdditions = 0
    let totalDeletions = 0
    let commitCount = 0
    
    try {
      // Fetch repo info via proxy
      const repoData = await fetchFromProxy<{ full_name: string }>(`/repos/${owner}/${repo}`)
      repoFullName = repoData.full_name
      
      // ALWAYS try to get actual commit count from participation stats first
      try {
        const participationData = await fetchFromProxy<{ all: number[] }>(`/repos/${owner}/${repo}/stats/participation`)
        if (participationData && participationData.all) {
          commitCount = participationData.all.reduce((sum, week) => sum + week, 0)
        }
      } catch {
        // Will fallback to estimate later if needed
      }
      
      // Try Code Frequency first - gives COMPLETE historical data in 1 API call
      let codeFreqData: number[][] | null = null
      try {
        codeFreqData = await fetchFromProxy<number[][]>(`/repos/${owner}/${repo}/stats/code_frequency`)
      } catch {
        // Code frequency might fail for large repos (422) or not ready (202)
        codeFreqData = null
      }
      
      if (codeFreqData && Array.isArray(codeFreqData) && codeFreqData.length > 0) {
        // Sum all weeks to get total additions/deletions for entire repo history
        codeFreqData.forEach((week) => {
          totalAdditions += week[1] || 0
          totalDeletions += Math.abs(week[2] || 0)
        })
        
        // Fallback commit count estimate if participation failed
        if (commitCount === 0) {
          commitCount = codeFreqData.length * 2
        }
      } else {
        // Fallback: Code frequency not available, fetch from recent commits via proxy
        // Fetch 100 commits for better line count accuracy
        const commitsData = await fetchFromProxy<CommitListItem[]>(`/repos/${owner}/${repo}/commits?per_page=100`)
        
        // If we still don't have commit count, estimate it (but this is just a sample)
        // The participation stats above should have the real count
        if (commitCount === 0) {
          // This is just the sample size - not accurate for display
          // but better than nothing
          commitCount = commitsData.length
        }
        
        // Get detailed stats for commits (use up to 50 for balance of accuracy vs API calls)
        const commitStats = await Promise.all(
          commitsData.slice(0, 50).map(async (commit) => {
            try {
              const detail = await fetchFromProxy<CommitDetail>(`/repos/${owner}/${repo}/commits/${commit.sha}`)
              return { 
                additions: detail.stats?.additions || 0, 
                deletions: detail.stats?.deletions || 0 
              }
            } catch {
              return { additions: 0, deletions: 0 }
            }
          })
        )
        
        commitStats.forEach((s) => {
          totalAdditions += s.additions
          totalDeletions += s.deletions
        })
      }
    } catch (apiError: unknown) {
      const message = apiError instanceof Error ? apiError.message : 'Unknown error'
      console.error('GitHub API error:', message)
      const { title, description } = getErrorDetails(message)
      return createErrorImageResponse(theme, title, description, IMAGE_WIDTH, IMAGE_HEIGHT_FULL)
    }

    const totalLines = Math.max(totalAdditions - totalDeletions, 0)
    const themeColors = getEmbedTheme(theme)
    const imageHeight = hideRepoName ? IMAGE_HEIGHT_COMPACT : IMAGE_HEIGHT_FULL

    const stats: StatItem[] = [
      { label: 'Total Lines', value: formatEmbedNumber(totalLines), color: '#58a6ff' },
      { label: 'Lines Added', value: formatEmbedNumber(totalAdditions), color: '#3fb950' },
      { label: 'Lines Removed', value: formatEmbedNumber(totalDeletions), color: '#f85149' },
      { label: 'Commits', value: formatEmbedNumber(commitCount), color: '#a371f7' },
    ]

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: themeColors.bg,
            padding: hideRepoName ? 30 : 40,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            border: `2px solid ${themeColors.border}`,
            borderRadius: 16,
            justifyContent: hideRepoName ? 'center' : 'flex-start',
          }}
        >
          {/* Header */}
          {!hideRepoName && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #238636, #2ea043)',
                  marginRight: 16,
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: themeColors.text }}>{repoFullName}</span>
                <span style={{ fontSize: 16, color: themeColors.muted }}>Code Statistics via RepoLens</span>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 24,
              justifyContent: hideRepoName ? 'center' : 'flex-start',
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: themeColors.cardBg,
                  borderRadius: 12,
                  padding: '20px 28px',
                  minWidth: 130,
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: 14, color: themeColors.muted, marginTop: 4 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: IMAGE_WIDTH,
        height: imageHeight,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Embed code-stats error:', message)
    return new Response(`Failed to fetch repository data: ${message}`, { status: 500 })
  }
}

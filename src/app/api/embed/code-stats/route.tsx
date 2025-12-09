import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { Octokit } from '@octokit/rest'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const theme = searchParams.get('theme') || 'dark'

  if (!owner || !repo) {
    return new Response('Missing owner or repo parameter', { status: 400 })
  }

  try {
    const octokit = new Octokit()
    
    // Fetch repo info and contributor stats (uses cached stats endpoint, fewer API calls)
    let repoData
    let totalAdditions = 0
    let totalDeletions = 0
    let commitCount = 0
    
    try {
      const [repoResponse, statsResponse] = await Promise.all([
        octokit.repos.get({ owner, repo }),
        octokit.repos.getContributorsStats({ owner, repo }).catch(() => ({ data: [], status: 202 })),
      ])
      
      repoData = repoResponse
      
      // Use contributor stats if available (already cached by GitHub)
      if (Array.isArray(statsResponse.data) && statsResponse.data.length > 0) {
        statsResponse.data.forEach((contributor) => {
          contributor.weeks?.forEach((week) => {
            totalAdditions += week.a || 0
            totalDeletions += week.d || 0
            commitCount += week.c || 0
          })
        })
      } else {
        // Fallback to basic commit count
        commitCount = repoData.data.size || 0
      }
    } catch (apiError: unknown) {
      const message = apiError instanceof Error ? apiError.message : 'Unknown error'
      console.error('GitHub API error:', message)
      if (message.includes('rate limit')) {
        return new Response('GitHub API rate limit exceeded. Please try again later.', { status: 429 })
      }
      return new Response(`GitHub API error: ${message}`, { status: 500 })
    }

    const totalLines = totalAdditions - totalDeletions > 0 ? totalAdditions - totalDeletions : totalAdditions

    const isDark = theme === 'dark'
    const text = isDark ? '#c9d1d9' : '#24292f'
    const muted = isDark ? '#8b949e' : '#57606a'
    const cardBg = isDark ? '#161b22' : '#f6f8fa'
    const accent = '#238636'

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: '32px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: 'transparent',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${accent}, #2ea043)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '22px', fontWeight: 700, color: text }}>{repoData?.data.full_name}</span>
              <span style={{ fontSize: '14px', color: muted }}>Code Statistics via RepoLens</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <StatBox label="Total Lines" value={formatNumber(totalLines)} color="#58a6ff" cardBg={cardBg} textColor={text} mutedColor={muted} />
            <StatBox label="Lines Added" value={formatNumber(totalAdditions)} color="#3fb950" cardBg={cardBg} textColor={text} mutedColor={muted} />
            <StatBox label="Lines Removed" value={formatNumber(totalDeletions)} color="#f85149" cardBg={cardBg} textColor={text} mutedColor={muted} />
            <StatBox label="Commits" value={formatNumber(commitCount)} color="#a371f7" cardBg={cardBg} textColor={text} mutedColor={muted} />
          </div>
        </div>
      ),
      {
        width: 600,
        height: 220,
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

function StatBox({ 
  label, 
  value, 
  color, 
  cardBg, 
  textColor, 
  mutedColor 
}: { 
  label: string
  value: string
  color: string
  cardBg: string
  textColor: string
  mutedColor: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: cardBg,
        borderRadius: '12px',
        minWidth: '110px',
      }}
    >
      <span style={{ fontSize: '32px', fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: '14px', color: mutedColor, marginTop: '4px' }}>{label}</span>
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}


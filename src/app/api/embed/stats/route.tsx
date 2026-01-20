import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { Octokit } from '@octokit/rest'

export const runtime = 'edge'

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
    const octokit = new Octokit()
    
    let data
    try {
      const response = await octokit.repos.get({ owner, repo })
      data = response.data
    } catch (apiError: unknown) {
      const message = apiError instanceof Error ? apiError.message : 'Unknown error'
      console.error('GitHub API error:', message)
      
      // Return an error image instead of broken preview
      const isDark = theme === 'dark'
      const errorBg = isDark ? '#0d1117' : '#ffffff'
      const errorText = isDark ? '#e6edf3' : '#1f2328'
      const errorMuted = isDark ? '#8b949e' : '#656d76'
      const errorBorder = isDark ? '#30363d' : '#d0d7de'
      
      const errorTitle = message.includes('rate limit') ? 'Rate Limit Exceeded' : 'Unable to Load Stats'
      const errorDescription = message.includes('rate limit') 
        ? 'GitHub API rate limit reached. Try again later.'
        : 'Could not fetch repository data.'
      
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: errorBg,
              padding: 40,
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
              border: `2px solid ${errorBorder}`,
              borderRadius: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#f8514926',
                marginBottom: 16,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: errorText, marginBottom: 8 }}>{errorTitle}</span>
            <span style={{ fontSize: 14, color: errorMuted, textAlign: 'center' }}>{errorDescription}</span>
          </div>
        ),
        {
          width: 760,
          height: 260,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=300',
          },
        }
      )
    }

    const isDark = theme === 'dark'
    const bg = isDark ? '#0d1117' : '#ffffff'
    const text = isDark ? '#e6edf3' : '#1f2328'
    const muted = isDark ? '#8b949e' : '#656d76'
    const cardBg = isDark ? '#161b22' : '#f6f8fa'
    const border = isDark ? '#30363d' : '#d0d7de'

    const stats = [
      { label: 'Stars', value: formatNumber(data.stargazers_count), color: '#f0b429' },
      { label: 'Forks', value: formatNumber(data.forks_count), color: '#58a6ff' },
      { label: 'Watchers', value: formatNumber(data.watchers_count), color: '#a371f7' },
      { label: 'Issues', value: formatNumber(data.open_issues_count), color: '#3fb950' },
    ]

    const imageHeight = hideRepoName ? 160 : 260

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: bg,
            padding: hideRepoName ? 30 : 40,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            border: `2px solid ${border}`,
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
                <span style={{ fontSize: 28, fontWeight: 700, color: text }}>{data.full_name}</span>
                <span style={{ fontSize: 16, color: muted }}>via RepoLens</span>
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
                  backgroundColor: cardBg,
                  borderRadius: 12,
                  padding: '20px 28px',
                  minWidth: 120,
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: 16, color: muted, marginTop: 4 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: 760,
        height: imageHeight,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Embed stats error:', message)
    return new Response(`Failed to fetch repository data: ${message}`, { status: 500 })
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

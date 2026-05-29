import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import {
  getEmbedTheme,
  formatEmbedNumber,
  createErrorImageResponse,
  getErrorDetails,
  type StatItem,
} from '@/lib/embed-utils'
import { validateEmbedParams } from '@/lib/embed-validation'

export const runtime = 'edge'

const IMAGE_WIDTH = 760
const IMAGE_HEIGHT_FULL = 260
const IMAGE_HEIGHT_COMPACT = 160

// Read the proxy URL at call time so tests can stub the env per-case.
function getProxyUrl(): string {
  return process.env.NEXT_PUBLIC_GITHUB_PROXY_URL || ''
}

interface RepoData {
  full_name: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
}

async function fetchFromProxy<T>(path: string): Promise<T> {
  const base = getProxyUrl()
  if (!base) {
    throw new Error('Proxy not configured')
  }
  const response = await fetch(`${base}/github${path}`, {
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
  const theme = searchParams.get('theme') || 'dark'
  const hideRepoName = searchParams.get('hideRepoName') === 'true'

  const params = validateEmbedParams(searchParams.get('owner'), searchParams.get('repo'))
  if (!params.ok) {
    return new Response('Invalid or missing owner/repo parameter', { status: 400 })
  }
  const { owner, repo } = params
  // Defense in depth: percent-encode validated segments before building the proxy path.
  const o = encodeURIComponent(owner)
  const r = encodeURIComponent(repo)

  try {
    let data: RepoData
    try {
      data = await fetchFromProxy<RepoData>(`/repos/${o}/${r}`)
    } catch (apiError: unknown) {
      const message = apiError instanceof Error ? apiError.message : 'Unknown error'
      console.error('GitHub API error:', message)
      const { title, description } = getErrorDetails(message)
      return createErrorImageResponse(theme, title, description, IMAGE_WIDTH, IMAGE_HEIGHT_FULL)
    }

    const themeColors = getEmbedTheme(theme)
    const imageHeight = hideRepoName ? IMAGE_HEIGHT_COMPACT : IMAGE_HEIGHT_FULL

    const stats: StatItem[] = [
      { label: 'Stars', value: formatEmbedNumber(data.stargazers_count), color: '#f0b429' },
      { label: 'Forks', value: formatEmbedNumber(data.forks_count), color: '#58a6ff' },
      { label: 'Watchers', value: formatEmbedNumber(data.watchers_count), color: '#a371f7' },
      { label: 'Issues', value: formatEmbedNumber(data.open_issues_count), color: '#3fb950' },
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
                <span style={{ fontSize: 28, fontWeight: 700, color: themeColors.text }}>{data.full_name}</span>
                <span style={{ fontSize: 16, color: themeColors.muted }}>via RepoLens</span>
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
                  minWidth: 120,
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: 16, color: themeColors.muted, marginTop: 4 }}>{stat.label}</span>
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
    console.error('Embed stats error:', message)
    return new Response('Failed to generate stats image', { status: 500 })
  }
}

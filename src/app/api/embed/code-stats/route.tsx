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
import { getCodeStatsData } from '@/lib/embed-data'

export const runtime = 'edge'

const IMAGE_WIDTH = 760
const IMAGE_HEIGHT_FULL = 260
const IMAGE_HEIGHT_COMPACT = 160

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const theme = searchParams.get('theme') || 'dark'
  const hideRepoName = searchParams.get('hideRepoName') === 'true'

  const params = validateEmbedParams(searchParams.get('owner'), searchParams.get('repo'))
  if (!params.ok) {
    return new Response('Invalid or missing owner/repo parameter', { status: 400 })
  }
  const { owner, repo } = params

  try {
    let repoFullName = `${owner}/${repo}`
    let stats: StatItem[] = []

    try {
      const data = await getCodeStatsData(owner, repo)
      repoFullName = data.fullName
      stats = [
        { label: 'Total Lines', value: data.linesAvailable ? formatEmbedNumber(data.totalLines) : '—', color: '#58a6ff' },
        { label: 'Lines Added', value: data.linesAvailable ? formatEmbedNumber(data.totalAdditions) : '—', color: '#3fb950' },
        { label: 'Lines Removed', value: data.linesAvailable ? formatEmbedNumber(data.totalDeletions) : '—', color: '#f85149' },
        { label: 'Commits', value: data.commitCountAvailable ? formatEmbedNumber(data.commitCount) : '—', color: '#a371f7' },
      ]
    } catch (apiError: unknown) {
      const message = apiError instanceof Error ? apiError.message : 'Unknown error'
      console.error('GitHub API error:', message)
      const { title, description } = getErrorDetails(message)
      return createErrorImageResponse(theme, title, description, IMAGE_WIDTH, IMAGE_HEIGHT_FULL)
    }

    const themeColors = getEmbedTheme(theme)
    const imageHeight = hideRepoName ? IMAGE_HEIGHT_COMPACT : IMAGE_HEIGHT_FULL

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
              gap: 16,
              width: '100%',
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
                  padding: '20px 12px',
                  flexGrow: 1,
                  flexBasis: 0,
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: 34, fontWeight: 700, color: stat.color, whiteSpace: 'nowrap' }}>{stat.value}</span>
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
    return new Response('Failed to generate code-stats image', { status: 500 })
  }
}

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { LANGUAGE_COLORS } from '@/types'
import {
  getEmbedTheme,
  createErrorImageResponse,
  getErrorDetails,
} from '@/lib/embed-utils'
import { validateEmbedParams } from '@/lib/embed-validation'

export const runtime = 'edge'

const IMAGE_WIDTH = 700
const IMAGE_HEIGHT_FULL = 240
const IMAGE_HEIGHT_COMPACT = 200

// Read the proxy URL at call time so tests can stub the env per-case.
function getProxyUrl(): string {
  return process.env.NEXT_PUBLIC_GITHUB_PROXY_URL || ''
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
  const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 10)
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
    let repoFullName = `${owner}/${repo}`
    let languages: { name: string; percentage: number; color: string }[] = []

    try {
      const [repoData, langData] = await Promise.all([
        fetchFromProxy<{ full_name: string }>(`/repos/${o}/${r}`),
        fetchFromProxy<Record<string, number>>(`/repos/${o}/${r}/languages`),
      ])
      repoFullName = repoData.full_name
      
      // Calculate percentages
      const totalBytes = Object.values(langData).reduce((sum, bytes) => sum + bytes, 0)
      languages = Object.entries(langData)
        .map(([name, bytes]) => ({
          name,
          bytes,
          percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
          color: LANGUAGE_COLORS[name] || LANGUAGE_COLORS.default,
        }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, limit)
    } catch (apiError: unknown) {
      const message = apiError instanceof Error ? apiError.message : 'Unknown error'
      console.error('GitHub API error:', message)
      const errorDetails = getErrorDetails(message)
      if (errorDetails.title === 'Unable to Load Stats') {
        errorDetails.title = 'Unable to Load Languages'
      }
      return createErrorImageResponse(theme, errorDetails.title, errorDetails.description, IMAGE_WIDTH, IMAGE_HEIGHT_FULL)
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
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #58a6ff, #a371f7)',
                    marginRight: 12,
                  }}
                />
                <span style={{ fontSize: 24, fontWeight: 700, color: themeColors.text }}>Languages</span>
              </div>
              <span style={{ fontSize: 16, color: themeColors.muted }}>{repoFullName}</span>
            </div>
          )}

          {/* Language Bar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              height: 16,
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 24,
            }}
          >
            {languages.map((lang) => (
              <div
                key={lang.name}
                style={{
                  display: 'flex',
                  width: `${lang.percentage}%`,
                  height: '100%',
                  backgroundColor: lang.color,
                }}
              />
            ))}
          </div>

          {/* Language List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {languages.map((lang) => (
              <div
                key={lang.name}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: themeColors.cardBg,
                  borderRadius: 8,
                  padding: '10px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: lang.color,
                    marginRight: 10,
                  }}
                />
                <span style={{ fontSize: 16, fontWeight: 600, color: themeColors.text, marginRight: 8 }}>{lang.name}</span>
                <span style={{ fontSize: 14, color: themeColors.muted }}>{lang.percentage.toFixed(1)}%</span>
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
    console.error('Embed languages error:', message)
    return new Response('Failed to generate languages image', { status: 500 })
  }
}

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { Octokit } from '@octokit/rest'
import { LANGUAGE_COLORS } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const theme = searchParams.get('theme') || 'dark'
  const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 10)

  if (!owner || !repo) {
    return new Response('Missing owner or repo parameter', { status: 400 })
  }

  try {
    const octokit = new Octokit()
    
    let repoFullName = `${owner}/${repo}`
    let languages: { name: string; percentage: number; color: string }[] = []
    
    try {
      const [repoResponse, langResponse] = await Promise.all([
        octokit.repos.get({ owner, repo }),
        octokit.repos.listLanguages({ owner, repo }),
      ])
      repoFullName = repoResponse.data.full_name
      
      // Calculate percentages
      const totalBytes = Object.values(langResponse.data).reduce((sum, bytes) => sum + bytes, 0)
      languages = Object.entries(langResponse.data)
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
      
      // Return an error image instead of broken preview
      const isDark = theme === 'dark'
      const errorBg = isDark ? '#0d1117' : '#ffffff'
      const errorText = isDark ? '#e6edf3' : '#1f2328'
      const errorMuted = isDark ? '#8b949e' : '#656d76'
      const errorBorder = isDark ? '#30363d' : '#d0d7de'
      
      const errorTitle = message.includes('rate limit') ? 'Rate Limit Exceeded' : 'Unable to Load Languages'
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
          width: 700,
          height: 240,
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

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: bg,
            padding: 40,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            border: `2px solid ${border}`,
            borderRadius: 16,
          }}
        >
          {/* Header */}
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
              <span style={{ fontSize: 24, fontWeight: 700, color: text }}>Languages</span>
            </div>
            <span style={{ fontSize: 16, color: muted }}>{repoFullName}</span>
          </div>

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
                  backgroundColor: cardBg,
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
                <span style={{ fontSize: 16, fontWeight: 600, color: text, marginRight: 8 }}>{lang.name}</span>
                <span style={{ fontSize: 14, color: muted }}>{lang.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: 700,
        height: 240,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Embed languages error:', message)
    return new Response(`Failed to fetch repository data: ${message}`, { status: 500 })
  }
}

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
    const [repoData, langData] = await Promise.all([
      octokit.repos.get({ owner, repo }),
      octokit.repos.listLanguages({ owner, repo }),
    ])

    const isDark = theme === 'dark'
    const text = isDark ? '#c9d1d9' : '#24292f'
    const muted = isDark ? '#8b949e' : '#57606a'
    const cardBg = isDark ? '#161b22' : '#f6f8fa'

    // Calculate percentages
    const totalBytes = Object.values(langData.data).reduce((sum, bytes) => sum + bytes, 0)
    const languages = Object.entries(langData.data)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
        color: LANGUAGE_COLORS[name] || LANGUAGE_COLORS.default,
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, limit)

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #58a6ff, #a371f7)',
                }}
              />
              <span style={{ fontSize: '20px', fontWeight: 700, color: text }}>Languages</span>
            </div>
            <span style={{ fontSize: '14px', color: muted }}>{repoData.data.full_name}</span>
          </div>

          {/* Language Bar */}
          <div
            style={{
              display: 'flex',
              height: '12px',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '20px',
            }}
          >
            {languages.map((lang) => (
              <div
                key={lang.name}
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: lang.color,
                  minWidth: lang.percentage > 0.5 ? '6px' : '0',
                }}
              />
            ))}
          </div>

          {/* Language List */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {languages.map((lang) => (
              <div
                key={lang.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: cardBg,
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: lang.color,
                  }}
                />
                <span style={{ fontSize: '15px', fontWeight: 500, color: text }}>{lang.name}</span>
                <span style={{ fontSize: '14px', color: muted }}>{lang.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: 600,
        height: 200,
      }
    )
  } catch {
    return new Response('Failed to fetch repository data', { status: 500 })
  }
}

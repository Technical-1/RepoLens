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
    const { data } = await octokit.repos.get({ owner, repo })

    const isDark = theme === 'dark'
    const bg = isDark ? '#0d1117' : '#ffffff'
    const border = isDark ? '#30363d' : '#d0d7de'
    const text = isDark ? '#c9d1d9' : '#24292f'
    const muted = isDark ? '#8b949e' : '#57606a'
    const accent = '#238636'

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: bg,
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            border: `1px solid ${border}`,
            borderRadius: '12px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${accent}, #2ea043)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '18px', fontWeight: 600, color: text }}>{data.full_name}</span>
              <span style={{ fontSize: '12px', color: muted }}>via RepoLens</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <StatBox label="Stars" value={formatNumber(data.stargazers_count)} color="#f0b429" isDark={isDark} />
            <StatBox label="Forks" value={formatNumber(data.forks_count)} color="#58a6ff" isDark={isDark} />
            <StatBox label="Watchers" value={formatNumber(data.watchers_count)} color="#a371f7" isDark={isDark} />
            <StatBox label="Issues" value={formatNumber(data.open_issues_count)} color="#3fb950" isDark={isDark} />
          </div>
        </div>
      ),
      {
        width: 480,
        height: 180,
      }
    )
  } catch {
    return new Response('Failed to fetch repository data', { status: 500 })
  }
}

function StatBox({ label, value, color, isDark }: { label: string; value: string; color: string; isDark: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 20px',
        backgroundColor: isDark ? '#161b22' : '#f6f8fa',
        borderRadius: '8px',
        minWidth: '90px',
      }}
    >
      <span style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: '12px', color: isDark ? '#8b949e' : '#57606a' }}>{label}</span>
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}


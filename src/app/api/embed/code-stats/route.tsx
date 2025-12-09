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
    
    // Fetch repo info and commits
    const [repoData, commits] = await Promise.all([
      octokit.repos.get({ owner, repo }),
      octokit.repos.listCommits({ owner, repo, per_page: 50 }),
    ])

    // Get detailed commit stats (limited to avoid rate limits)
    let totalAdditions = 0
    let totalDeletions = 0
    
    const commitDetails = await Promise.all(
      commits.data.slice(0, 20).map(async (commit) => {
        try {
          const { data } = await octokit.repos.getCommit({ owner, repo, ref: commit.sha })
          return {
            additions: data.stats?.additions || 0,
            deletions: data.stats?.deletions || 0,
          }
        } catch {
          return { additions: 0, deletions: 0 }
        }
      })
    )

    commitDetails.forEach((c) => {
      totalAdditions += c.additions
      totalDeletions += c.deletions
    })

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
              <span style={{ fontSize: '22px', fontWeight: 700, color: text }}>{repoData.data.full_name}</span>
              <span style={{ fontSize: '14px', color: muted }}>Code Statistics via RepoLens</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <StatBox label="Total Lines" value={formatNumber(totalLines)} color="#58a6ff" cardBg={cardBg} textColor={text} mutedColor={muted} />
            <StatBox label="Lines Added" value={formatNumber(totalAdditions)} color="#3fb950" cardBg={cardBg} textColor={text} mutedColor={muted} />
            <StatBox label="Lines Removed" value={formatNumber(totalDeletions)} color="#f85149" cardBg={cardBg} textColor={text} mutedColor={muted} />
            <StatBox label="Commits" value={formatNumber(commits.data.length)} color="#a371f7" cardBg={cardBg} textColor={text} mutedColor={muted} />
          </div>
        </div>
      ),
      {
        width: 600,
        height: 220,
      }
    )
  } catch {
    return new Response('Failed to fetch repository data', { status: 500 })
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


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
    
    let repoFullName = `${owner}/${repo}`
    let totalAdditions = 0
    let totalDeletions = 0
    let commitCount = 0
    
    try {
      // Fetch repo info
      const repoResponse = await octokit.repos.get({ owner, repo })
      repoFullName = repoResponse.data.full_name
      
      // Try Code Frequency first - gives COMPLETE historical data in 1 API call
      // This sums ALL additions/deletions across the entire repo history
      const codeFreqResponse = await octokit.repos.getCodeFrequencyStats({ owner, repo })
      
      if (codeFreqResponse.status === 200 && Array.isArray(codeFreqResponse.data) && codeFreqResponse.data.length > 0) {
        // Sum all weeks to get total additions/deletions for entire repo history
        codeFreqResponse.data.forEach((week) => {
          totalAdditions += week[1] || 0  // additions
          totalDeletions += Math.abs(week[2] || 0)  // deletions (negative in API)
        })
        
        // Get commit count from participation stats (also cached by GitHub)
        try {
          const participationResponse = await octokit.repos.getParticipationStats({ owner, repo })
          if (participationResponse.status === 200 && participationResponse.data.all) {
            commitCount = participationResponse.data.all.reduce((sum, week) => sum + week, 0)
          }
        } catch {
          // If participation fails, estimate from code frequency weeks
          commitCount = codeFreqResponse.data.length * 2 // rough estimate
        }
      } else {
        // Fallback: Code frequency not ready (202), fetch from commits
        const commitsResponse = await octokit.repos.listCommits({ owner, repo, per_page: 50 })
        commitCount = commitsResponse.data.length
        
        // Get detailed stats for commits
        const commitStats = await Promise.all(
          commitsResponse.data.slice(0, 30).map(async (commit) => {
            try {
              const { data } = await octokit.repos.getCommit({ owner, repo, ref: commit.sha })
              return { 
                additions: data.stats?.additions || 0, 
                deletions: data.stats?.deletions || 0 
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
      if (message.includes('rate limit')) {
        return new Response('GitHub API rate limit exceeded. Please try again later.', { status: 429 })
      }
      return new Response(`GitHub API error: ${message}`, { status: 500 })
    }

    const totalLines = Math.max(totalAdditions - totalDeletions, 0)

    const isDark = theme === 'dark'
    const bg = isDark ? '#0d1117' : '#ffffff'
    const text = isDark ? '#e6edf3' : '#1f2328'
    const muted = isDark ? '#8b949e' : '#656d76'
    const cardBg = isDark ? '#161b22' : '#f6f8fa'
    const border = isDark ? '#30363d' : '#d0d7de'

    const stats = [
      { label: 'Total Lines', value: formatNumber(totalLines), color: '#58a6ff' },
      { label: 'Lines Added', value: formatNumber(totalAdditions), color: '#3fb950' },
      { label: 'Lines Removed', value: formatNumber(totalDeletions), color: '#f85149' },
      { label: 'Commits', value: formatNumber(commitCount), color: '#a371f7' },
    ]

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
              <span style={{ fontSize: 28, fontWeight: 700, color: text }}>{repoFullName}</span>
              <span style={{ fontSize: 16, color: muted }}>Code Statistics via RepoLens</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 24,
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
                  minWidth: 130,
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: 14, color: muted, marginTop: 4 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: 720,
        height: 260,
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

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

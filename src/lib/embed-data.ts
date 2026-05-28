// Reads the proxy URL at call time so tests can stub the env per-case.
function getProxyUrl(): string {
  return process.env.NEXT_PUBLIC_GITHUB_PROXY_URL || ''
}

async function proxyFetch<T>(path: string): Promise<T> {
  const base = getProxyUrl()
  if (!base) throw new Error('Proxy not configured')
  const res = await fetch(`${base}/github${path}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'X-RepoLens-Server': 'repolens-server-request',
    },
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json() as Promise<T>
}

export interface CodeStatsData {
  fullName: string
  totalAdditions: number
  totalDeletions: number
  totalLines: number
  commitCount: number
  linesAvailable: boolean
  commitCountAvailable: boolean
}

/**
 * Gather code-stats for the embed widget using at most 3 proxy calls:
 * repo info, participation (commit count), and code_frequency (line totals).
 * No per-commit detail loop, and no fabricated values — availability is reported
 * via flags so the caller can render "—" instead of a made-up number.
 */
export async function getCodeStatsData(owner: string, repo: string): Promise<CodeStatsData> {
  const repoData = await proxyFetch<{ full_name: string }>(`/repos/${owner}/${repo}`)

  let commitCount = 0
  let commitCountAvailable = false
  try {
    const participation = await proxyFetch<{ all: number[] }>(
      `/repos/${owner}/${repo}/stats/participation`
    )
    if (participation && Array.isArray(participation.all)) {
      commitCount = participation.all.reduce((sum, week) => sum + week, 0)
      commitCountAvailable = true
    }
  } catch {
    // leave commit count unavailable
  }

  let totalAdditions = 0
  let totalDeletions = 0
  let linesAvailable = false
  try {
    const cf = await proxyFetch<number[][]>(`/repos/${owner}/${repo}/stats/code_frequency`)
    if (Array.isArray(cf) && cf.length > 0) {
      for (const week of cf) {
        totalAdditions += week[1] || 0
        totalDeletions += Math.abs(week[2] || 0)
      }
      linesAvailable = true
    }
  } catch {
    // leave line stats unavailable
  }

  return {
    fullName: repoData.full_name,
    totalAdditions,
    totalDeletions,
    totalLines: Math.max(totalAdditions - totalDeletions, 0),
    commitCount,
    linesAvailable,
    commitCountAvailable,
  }
}

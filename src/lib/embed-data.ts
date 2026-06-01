import { proxyAuthHeaders } from '@/lib/proxy-auth'

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
      ...proxyAuthHeaders(),
    },
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json() as Promise<T>
}

// Single GraphQL request: accurate total commit count plus recent-commit
// additions/deletions used as a lines fallback when code_frequency is empty.
const COMMIT_TOTALS_QUERY = `
  query($owner: String!, $repo: String!, $first: Int!) {
    repository(owner: $owner, name: $repo) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: $first) {
              totalCount
              nodes { additions deletions }
            }
          }
        }
      }
    }
  }
`

interface CommitTotals {
  totalCount: number
  additions: number
  deletions: number
}

async function fetchCommitTotalsGraphQL(owner: string, repo: string): Promise<CommitTotals | null> {
  const base = getProxyUrl()
  if (!base) return null
  const res = await fetch(`${base}/github/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...proxyAuthHeaders(),
    },
    body: JSON.stringify({ query: COMMIT_TOTALS_QUERY, variables: { owner, repo, first: 100 } }),
  })
  if (!res.ok) return null
  const json = (await res.json()) as {
    data?: {
      repository?: {
        defaultBranchRef?: {
          target?: { history?: { totalCount?: number; nodes?: Array<{ additions?: number; deletions?: number }> } }
        } | null
      }
    }
  }
  const history = json?.data?.repository?.defaultBranchRef?.target?.history
  if (!history) return null
  let additions = 0
  let deletions = 0
  for (const node of history.nodes || []) {
    additions += node.additions || 0
    deletions += node.deletions || 0
  }
  return { totalCount: history.totalCount || 0, additions, deletions }
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
 * repo info, code_frequency (accurate full-history lines), and a single GraphQL
 * call (commit totalCount + recent-commit additions/deletions).
 *
 * Lines: prefer the full code_frequency history; when GitHub hasn't computed it
 * yet (202/empty) or refuses it (422, >10k commits), fall back to the GraphQL
 * recent-commit sum — the same estimate the main /api/repo page shows, so the
 * widget and the page stay consistent. Renders "—" only when both sources fail.
 * No per-commit detail loop, no fabricated values.
 */
export async function getCodeStatsData(owner: string, repo: string): Promise<CodeStatsData> {
  // Defense in depth: even though callers validate owner/repo, percent-encode the
  // path segments so a stray character can never alter the proxy URL structure.
  const o = encodeURIComponent(owner)
  const r = encodeURIComponent(repo)

  const repoData = await proxyFetch<{ full_name: string }>(`/repos/${o}/${r}`)

  const [cfSettled, gqlSettled] = await Promise.allSettled([
    proxyFetch<number[][]>(`/repos/${o}/${r}/stats/code_frequency`),
    fetchCommitTotalsGraphQL(owner, repo),
  ])

  const graphql = gqlSettled.status === 'fulfilled' ? gqlSettled.value : null
  const cf = cfSettled.status === 'fulfilled' ? cfSettled.value : null

  // Commit count: GraphQL totalCount is accurate across full history.
  let commitCount = 0
  let commitCountAvailable = false
  if (graphql && graphql.totalCount > 0) {
    commitCount = graphql.totalCount
    commitCountAvailable = true
  }

  // Lines: accurate full history if available, else recent-commit estimate.
  let totalAdditions = 0
  let totalDeletions = 0
  let linesAvailable = false
  if (Array.isArray(cf) && cf.length > 0) {
    for (const week of cf) {
      totalAdditions += week[1] || 0
      totalDeletions += Math.abs(week[2] || 0)
    }
    linesAvailable = true
  } else if (graphql && (graphql.additions > 0 || graphql.deletions > 0)) {
    totalAdditions = graphql.additions
    totalDeletions = graphql.deletions
    linesAvailable = true
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

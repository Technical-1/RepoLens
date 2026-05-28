import { Octokit } from "@octokit/rest"
import type {
  RepoStats,
  LanguageStats,
  CommitStats,
  CodeFrequency,
  ContributorStats,
  FullRepoAnalysis,
  UserRepo,
} from "@/types"

// Import language colors
import { LANGUAGE_COLORS as langColors } from "@/types"

// GitHub API response type for repo info
interface GitHubRepoResponse {
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  default_branch: string
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  private: boolean
}

import { clientEnv } from "@/lib/env"

// Cloudflare Worker proxy for authenticated GitHub API calls
// This provides 5,000/hr rate limits for unauthenticated users
const GITHUB_PROXY_URL = clientEnv.NEXT_PUBLIC_GITHUB_PROXY_URL

// Server-side header for proxy authentication (matches worker config)
const SERVER_SECRET_HEADER = 'X-RepoLens-Server'
const SERVER_SECRET_VALUE = 'repolens-server-request'

/**
 * Helper to make proxied GraphQL requests (for unauthenticated users)
 */
async function fetchGraphQLViaProxy(query: string, variables: Record<string, unknown>): Promise<unknown> {
  if (!GITHUB_PROXY_URL) {
    throw new Error('No proxy configured')
  }
  
  const response = await fetch(`${GITHUB_PROXY_URL}/github/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [SERVER_SECRET_HEADER]: SERVER_SECRET_VALUE,
    },
    body: JSON.stringify({ query, variables }),
  })
  
  if (!response.ok) {
    throw new Error(`Proxy request failed: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Helper to make proxied REST requests (for unauthenticated users)
 * Used for endpoints that don't have GraphQL equivalents
 */
async function fetchRESTViaProxy<T = unknown>(path: string): Promise<{ data: T; headers: Headers }> {
  if (!GITHUB_PROXY_URL) {
    throw new Error('No proxy configured')
  }
  
  const response = await fetch(`${GITHUB_PROXY_URL}/github${path}`, {
    headers: {
      'Accept': 'application/json',
      [SERVER_SECRET_HEADER]: SERVER_SECRET_VALUE,
    },
  })
  
  if (!response.ok) {
    throw new Error(`Proxy request failed: ${response.status}`)
  }
  
  const data = await response.json() as T
  return { data, headers: response.headers }
}


// GraphQL query for fetching commits with stats in a single request
const COMMITS_QUERY = `
  query($owner: String!, $repo: String!, $first: Int!) {
    repository(owner: $owner, name: $repo) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: $first) {
              totalCount
              nodes {
                oid
                message
                committedDate
                author {
                  name
                  avatarUrl
                }
                additions
                deletions
                changedFilesIfAvailable
              }
            }
          }
        }
      }
    }
  }
`

interface GraphQLCommitNode {
  oid: string
  message: string
  committedDate: string
  author: {
    name: string | null
    avatarUrl: string | null
  } | null
  additions: number
  deletions: number
  changedFilesIfAvailable: number | null
}

interface GraphQLResponse {
  repository: {
    defaultBranchRef: {
      target: {
        history: {
          totalCount: number
          nodes: GraphQLCommitNode[]
        }
      }
    } | null
  }
}

interface CommitsResult {
  commits: CommitStats[]
  totalCount: number
}

/**
 * Parse the `page=N>; rel="last"` value out of a GitHub Link header.
 * Returns null when the header is absent or has no last-page segment.
 */
export function parseLastPageFromLink(linkHeader: string | null | undefined): number | null {
  if (!linkHeader) return null
  const match = linkHeader.match(/[?&]page=(\d+)>;\s*rel="last"/)
  return match ? parseInt(match[1], 10) : null
}

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /^([^\/]+)\/([^\/]+)$/,
  ]

  for (const pattern of patterns) {
    const match = url.replace(/\.git$/, '').replace(/\/$/, '').match(pattern)
    if (match) {
      return { owner: match[1], repo: match[2] }
    }
  }
  return null
}

export async function getRepoInfo(
  octokit: Octokit,
  owner: string,
  repo: string,
  useProxy: boolean = false
): Promise<RepoStats> {
  let data: GitHubRepoResponse
  
  if (useProxy && GITHUB_PROXY_URL) {
    const result = await fetchRESTViaProxy<GitHubRepoResponse>(`/repos/${owner}/${repo}`)
    data = result.data
  } else {
    const response = await octokit.repos.get({ owner, repo })
    data = response.data
  }

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    url: data.html_url,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.watchers_count,
    openIssues: data.open_issues_count,
    defaultBranch: data.default_branch,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    pushedAt: data.pushed_at,
    size: data.size,
    private: data.private,
  }
}

export async function getLanguages(
  octokit: Octokit,
  owner: string,
  repo: string,
  useProxy: boolean = false
): Promise<LanguageStats> {
  if (useProxy && GITHUB_PROXY_URL) {
    const result = await fetchRESTViaProxy<LanguageStats>(`/repos/${owner}/${repo}/languages`)
    return result.data
  }
  
  const { data } = await octokit.repos.listLanguages({ owner, repo })
  return data
}

/**
 * Fetch commits using GraphQL API - reduces 51 API calls to just 1
 * Returns both commits and the total count (for accurate display)
 * 
 * For unauthenticated users, uses the Cloudflare proxy for better rate limits
 */
export async function getCommitsGraphQL(
  accessToken: string | undefined,
  owner: string,
  repo: string,
  count: number = 100 // GraphQL max is 100 per request
): Promise<CommitsResult> {
  try {
    let json: { data?: GraphQLResponse; errors?: Array<{ message: string }> }
    
    // Use proxy for unauthenticated requests if available
    if (!accessToken && GITHUB_PROXY_URL) {
      json = await fetchGraphQLViaProxy(COMMITS_QUERY, { owner, repo, first: count }) as typeof json
    } else {
      // Direct GitHub API call (for authenticated users or when no proxy)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: COMMITS_QUERY,
          variables: { owner, repo, first: count },
        }),
      })

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status}`)
      }

      json = await response.json()
    }
    
    if (json.errors) {
      console.error('GraphQL errors:', json.errors)
      throw new Error(json.errors[0]?.message || 'GraphQL error')
    }

    const data = json.data as GraphQLResponse
    const history = data?.repository?.defaultBranchRef?.target?.history
    const nodes = history?.nodes
    const totalCount = history?.totalCount || 0

    if (!nodes || !Array.isArray(nodes)) {
      return { commits: [], totalCount: 0 }
    }

    const commits = nodes.map((node) => ({
      sha: node.oid,
      message: node.message.split('\n')[0],
      author: node.author?.name || 'Unknown',
      authorAvatar: node.author?.avatarUrl || '',
      date: node.committedDate,
      additions: node.additions || 0,
      deletions: node.deletions || 0,
      files: node.changedFilesIfAvailable || 0,
    }))

    return { commits, totalCount }
  } catch (error) {
    console.error('Error fetching commits via GraphQL:', error)
    return { commits: [], totalCount: 0 }
  }
}

/**
 * Fallback: Fetch commits using REST API (slower, more API calls)
 * This is used when GraphQL fails
 * 
 * Note: Each commit detail requires 1 API call
 * Uses proxy for unauthenticated requests
 */
export async function getCommitsREST(
  octokit: Octokit,
  owner: string,
  repo: string,
  maxCommits: number = 100, // Reduced to avoid too many API calls
  useProxy: boolean = false
): Promise<CommitStats[]> {
  try {
    interface CommitListItem {
      sha: string
      commit: { message: string; author: { name?: string; date?: string } | null }
      author: { avatar_url?: string } | null
    }
    interface CommitDetail {
      stats?: { additions?: number; deletions?: number }
      files?: Array<unknown>
    }
    
    let allCommits: CommitListItem[] = []
    let page = 1
    const perPage = 100

    // Fetch commit list (may need multiple pages)
    while (allCommits.length < maxCommits) {
      let pageCommits: CommitListItem[]
      
      if (useProxy && GITHUB_PROXY_URL) {
        const result = await fetchRESTViaProxy<CommitListItem[]>(
          `/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`
        )
        pageCommits = result.data
      } else {
        const { data } = await octokit.repos.listCommits({
          owner,
          repo,
          per_page: perPage,
          page,
        })
        pageCommits = data
      }

      if (pageCommits.length === 0) break
      allCommits = allCommits.concat(pageCommits)
      
      if (pageCommits.length < perPage) break // No more pages
      page++
      if (page > 2) break // Max 2 pages
    }

    // Trim to maxCommits
    const commitList = allCommits.slice(0, maxCommits)

    if (commitList.length === 0) {
      return []
    }

    // Get detailed info for each commit (in batches to avoid overwhelming the API)
    const batchSize = 10
    const detailedCommits: CommitStats[] = []
    
    for (let i = 0; i < commitList.length; i += batchSize) {
      const batch = commitList.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (commit) => {
          try {
            let detail: CommitDetail
            
            if (useProxy && GITHUB_PROXY_URL) {
              const result = await fetchRESTViaProxy<CommitDetail>(
                `/repos/${owner}/${repo}/commits/${commit.sha}`
              )
              detail = result.data
            } else {
              const { data } = await octokit.repos.getCommit({
                owner,
                repo,
                ref: commit.sha,
              })
              detail = data
            }

            return {
              sha: commit.sha,
              message: commit.commit.message.split('\n')[0],
              author: commit.commit.author?.name || 'Unknown',
              authorAvatar: commit.author?.avatar_url || '',
              date: commit.commit.author?.date || '',
              additions: detail.stats?.additions || 0,
              deletions: detail.stats?.deletions || 0,
              files: detail.files?.length || 0,
            }
          } catch (error) {
            console.warn(`Failed to get details for commit ${commit.sha}:`, error)
            return {
              sha: commit.sha,
              message: commit.commit.message.split('\n')[0],
              author: commit.commit.author?.name || 'Unknown',
              authorAvatar: commit.author?.avatar_url || '',
              date: commit.commit.author?.date || '',
              additions: 0,
              deletions: 0,
              files: 0,
            }
          }
        })
      )
      detailedCommits.push(...batchResults)
    }

    return detailedCommits
  } catch (error) {
    console.error('Error fetching commits via REST:', error)
    return []
  }
}

/**
 * Get total commit count using REST API pagination trick
 * Fetches page 1 with per_page=1 and checks the Link header for last page
 */
async function getTotalCommitCount(
  octokit: Octokit,
  owner: string,
  repo: string,
  useProxy: boolean = false
): Promise<number> {
  try {
    let linkHeader: string | null | undefined = null
    let dataLength = 0

    if (useProxy && GITHUB_PROXY_URL) {
      const result = await fetchRESTViaProxy<unknown[]>(
        `/repos/${owner}/${repo}/commits?per_page=1`
      )
      linkHeader = result.headers.get('link')
      dataLength = Array.isArray(result.data) ? result.data.length : 0
    } else {
      const response = await octokit.repos.listCommits({ owner, repo, per_page: 1 })
      linkHeader = response.headers.link
      dataLength = response.data.length
    }

    const lastPage = parseLastPageFromLink(linkHeader)
    if (lastPage !== null) return lastPage

    // No pagination header → small repo, the single returned commit is the count basis
    return dataLength
  } catch (error) {
    console.warn('Could not get total commit count:', error)
    return 0
  }
}

/**
 * Fetch commits - tries GraphQL first, falls back to REST
 * Returns commits and total count for accurate display
 * 
 * For authenticated users: Uses direct GraphQL
 * For unauthenticated users: Uses proxy (if available) or falls back to REST
 */
export async function getCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  accessToken?: string
): Promise<CommitsResult> {
  const useProxy = !accessToken && !!GITHUB_PROXY_URL
  
  // Try GraphQL first - works for authenticated users or via proxy
  // The getCommitsGraphQL function will use the proxy for unauthenticated users
  if (accessToken || GITHUB_PROXY_URL) {
    const result = await getCommitsGraphQL(accessToken, owner, repo, 100) // GraphQL max is 100
    
    // Check if GraphQL returned valid data with actual additions/deletions
    if (result.commits.length > 0) {
      const hasValidStats = result.commits.some(c => c.additions > 0 || c.deletions > 0)
      if (hasValidStats) {
        return result
      }
      // If no valid stats, fall through to REST but keep the totalCount
      const restCommits = await getCommitsREST(octokit, owner, repo, 100, useProxy)
      return { commits: restCommits, totalCount: result.totalCount }
    }
  }
  
  // Fallback for unauthenticated users without proxy: use REST API
  // Get total count and commits in parallel
  const [totalCount, commits] = await Promise.all([
    getTotalCommitCount(octokit, owner, repo, useProxy),
    getCommitsREST(octokit, owner, repo, 100, useProxy),
  ])
  
  return { commits, totalCount: totalCount || commits.length }
}

/**
 * Calculate code frequency from commits (fallback for repos >10k commits)
 * Groups commits by week and sums additions/deletions
 */
export function calculateCodeFrequencyFromCommits(commits: CommitStats[]): CodeFrequency[] {
  // Group commits by week (Unix timestamp for start of week)
  const weeklyData = new Map<number, { additions: number; deletions: number }>()
  
  for (const commit of commits) {
    const date = new Date(commit.date)
    // Get start of week (Sunday) as Unix timestamp
    const startOfWeek = new Date(date)
    startOfWeek.setHours(0, 0, 0, 0)
    startOfWeek.setDate(date.getDate() - date.getDay())
    const weekTimestamp = Math.floor(startOfWeek.getTime() / 1000)
    
    const existing = weeklyData.get(weekTimestamp) || { additions: 0, deletions: 0 }
    weeklyData.set(weekTimestamp, {
      additions: existing.additions + commit.additions,
      deletions: existing.deletions + commit.deletions,
    })
  }
  
  // Convert to array and sort by week (oldest first)
  return Array.from(weeklyData.entries())
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => a.week - b.week)
}

interface CodeFrequencyResult {
  data: CodeFrequency[]
  isCalculated: boolean
}

export async function getCodeFrequency(
  octokit: Octokit,
  owner: string,
  repo: string,
  fallbackCommits?: CommitStats[],
  useProxy: boolean = false
): Promise<CodeFrequencyResult> {
  try {
    let data: number[][] | null = null
    let status = 200
    
    if (useProxy && GITHUB_PROXY_URL) {
      const result = await fetchRESTViaProxy<number[][] | Record<string, unknown>>(`/repos/${owner}/${repo}/stats/code_frequency`)
      // GitHub returns empty object {} when computing
      if (Array.isArray(result.data)) {
        data = result.data
      }
    } else {
      const response = await octokit.repos.getCodeFrequencyStats({ owner, repo })
      status = response.status
      if (Array.isArray(response.data)) {
        data = response.data
      }
    }

    // GitHub returns 202 when stats are being computed - don't wait, just return empty
    if (status === 202 || !data || !Array.isArray(data)) {
      return { data: [], isCalculated: false }
    }

    return {
      data: data.map((item) => ({
        week: item[0],
        additions: item[1],
        deletions: Math.abs(item[2]),
      })),
      isCalculated: false,
    }
  } catch (error) {
    const err = error as { status?: number }
    // 422 = Too many commits (>10k), use fallback
    if (err.status === 422 && fallbackCommits && fallbackCommits.length > 0) {
      return {
        data: calculateCodeFrequencyFromCommits(fallbackCommits),
        isCalculated: true,
      }
    }
    // For large repos via proxy, also use fallback
    if (fallbackCommits && fallbackCommits.length > 0) {
      return {
        data: calculateCodeFrequencyFromCommits(fallbackCommits),
        isCalculated: true,
      }
    }
    return { data: [], isCalculated: false }
  }
}

export async function getContributors(
  octokit: Octokit,
  owner: string,
  repo: string,
  useProxy: boolean = false
): Promise<ContributorStats[]> {
  try {
    // Use simple contributors endpoint via proxy (more reliable)
    if (useProxy && GITHUB_PROXY_URL) {
      return await getContributorsFallback(octokit, owner, repo, true)
    }
    
    const response = await octokit.repos.getContributorsStats({ owner, repo })

    // GitHub returns 202 when stats are being computed - use fallback immediately
    if (response.status === 202 || !response.data || !Array.isArray(response.data)) {
      return await getContributorsFallback(octokit, owner, repo, useProxy)
    }

    return response.data.map((contributor) => ({
      author: contributor.author?.login || 'Unknown',
      avatar: contributor.author?.avatar_url || '',
      total: contributor.total,
      weeks: contributor.weeks.map((w) => ({
        week: w.w ?? 0,
        additions: w.a ?? 0,
        deletions: w.d ?? 0,
        commits: w.c ?? 0,
      })),
    }))
  } catch {
    // Try fallback on error
    return await getContributorsFallback(octokit, owner, repo, useProxy)
  }
}

// Fallback: Use simple contributors endpoint (doesn't have weekly stats but always works)
async function getContributorsFallback(
  octokit: Octokit,
  owner: string,
  repo: string,
  useProxy: boolean = false
): Promise<ContributorStats[]> {
  try {
    if (useProxy && GITHUB_PROXY_URL) {
      const result = await fetchRESTViaProxy<Array<{ login: string; avatar_url: string; contributions: number }>>(`/repos/${owner}/${repo}/contributors?per_page=30`)
      if (!result.data || !Array.isArray(result.data)) {
        return []
      }
      return result.data.map((contributor) => ({
        author: contributor.login || 'Unknown',
        avatar: contributor.avatar_url || '',
        total: contributor.contributions,
        weeks: [],
      }))
    }
    
    const { data } = await octokit.repos.listContributors({
      owner,
      repo,
      per_page: 30,
    })

    return data.map((contributor) => ({
      author: contributor.login || 'Unknown',
      avatar: contributor.avatar_url || '',
      total: contributor.contributions,
      weeks: [], // No weekly data available from this endpoint
    }))
  } catch {
    return []
  }
}

export async function analyzeRepo(
  accessToken?: string,
  repoUrl?: string
): Promise<FullRepoAnalysis | { error: string; requiresAuth?: boolean }> {
  if (!repoUrl) {
    return { error: 'Repository URL is required' }
  }

  const parsed = parseRepoUrl(repoUrl)
  if (!parsed) {
    return { error: 'Invalid repository URL format' }
  }

  const { owner, repo } = parsed

  // Create Octokit instance
  const octokit = new Octokit({
    auth: accessToken || undefined,
  })

  // Use proxy for unauthenticated requests (if proxy is configured)
  const useProxy = !accessToken && !!GITHUB_PROXY_URL

  try {
    // First, try to get repo info to check if it exists and if we have access
    const repoInfo = await getRepoInfo(octokit, owner, repo, useProxy)

    // If it's private and we don't have auth, return error
    if (repoInfo.private && !accessToken) {
      return {
        error: 'This is a private repository. Please sign in with GitHub to access it.',
        requiresAuth: true,
      }
    }

    // Get languages, commits, and contributors in parallel (code frequency needs commits for fallback)
    const [languages, commitsResult, contributors] = await Promise.all([
      getLanguages(octokit, owner, repo, useProxy),
      getCommits(octokit, owner, repo, accessToken),
      getContributors(octokit, owner, repo, useProxy),
    ])

    const { commits, totalCount: totalCommits } = commitsResult

    // Get code frequency with fallback to calculated data for large repos
    const codeFrequencyResult = await getCodeFrequency(octokit, owner, repo, commits, useProxy)

    // Calculate language percentages
    const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)
    const languagePercentages = Object.entries(languages)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
        color: langColors[name] || langColors.default,
      }))
      .sort((a, b) => b.bytes - a.bytes)

    // Calculate totals from commits
    const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0)
    const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0)

    // Estimate total lines (this is an approximation based on additions - deletions from recent commits)
    // Note: GitHub API doesn't provide total LOC, so this is based on available data
    const totalLines = totalAdditions - totalDeletions > 0 ? totalAdditions - totalDeletions : totalAdditions

    return {
      repo: repoInfo,
      languages,
      totalLines,
      languagePercentages,
      commits,
      totalCommits,
      codeFrequency: codeFrequencyResult.data,
      codeFrequencyIsCalculated: codeFrequencyResult.isCalculated,
      contributors,
      totalAdditions,
      totalDeletions,
      isPrivate: repoInfo.private,
      requiresAuth: false,
    }
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string }
    if (err.status === 404) {
      return {
        error: 'Repository not found. It may be private - please sign in with GitHub to access private repositories.',
        requiresAuth: true,
      }
    }
    if (err.status === 403) {
      return {
        error: 'Rate limit exceeded. Please sign in with GitHub for higher rate limits.',
        requiresAuth: true,
      }
    }
    return { error: err.message || 'Failed to analyze repository' }
  }
}

export async function getUserRepos(accessToken: string): Promise<UserRepo[]> {
  const octokit = new Octokit({ auth: accessToken })

  try {
    const repos: UserRepo[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        direction: 'desc',
        per_page: perPage,
        page,
      })

      if (data.length === 0) break

      repos.push(
        ...data.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          private: repo.private,
          language: repo.language,
          updatedAt: repo.updated_at || new Date().toISOString(),
        }))
      )

      if (data.length < perPage) break
      page++
      if (page > 5) break // Limit to 500 repos max
    }

    return repos
  } catch (error) {
    console.error('Error fetching user repos:', error)
    return []
  }
}

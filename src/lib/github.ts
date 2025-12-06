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
  repo: string
): Promise<RepoStats> {
  const { data } = await octokit.repos.get({ owner, repo })

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
  repo: string
): Promise<LanguageStats> {
  const { data } = await octokit.repos.listLanguages({ owner, repo })
  return data
}

export async function getCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  perPage: number = 100
): Promise<CommitStats[]> {
  try {
    // Get list of commits
    const { data: commitList } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: Math.min(perPage, 100),
    })

    // Get detailed info for each commit (limited to avoid rate limits)
    const detailedCommits = await Promise.all(
      commitList.slice(0, 50).map(async (commit) => {
        try {
          const { data: detail } = await octokit.repos.getCommit({
            owner,
            repo,
            ref: commit.sha,
          })

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
        } catch {
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

    return detailedCommits
  } catch (error) {
    console.error('Error fetching commits:', error)
    return []
  }
}

export async function getCodeFrequency(
  octokit: Octokit,
  owner: string,
  repo: string,
  retries: number = 3
): Promise<CodeFrequency[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data, status } = await octokit.repos.getCodeFrequencyStats({ owner, repo })

      // GitHub returns 202 when stats are being computed
      if (status === 202 || !Array.isArray(data)) {
        if (attempt < retries - 1) {
          // Wait 2 seconds before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000))
          continue
        }
        return []
      }

      return data.map((item) => ({
        week: item[0],
        additions: item[1],
        deletions: Math.abs(item[2]),
      }))
    } catch {
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        continue
      }
      return []
    }
  }
  return []
}

export async function getContributors(
  octokit: Octokit,
  owner: string,
  repo: string,
  retries: number = 5
): Promise<ContributorStats[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await octokit.repos.getContributorsStats({ owner, repo })

      // GitHub returns 202 when stats are being computed
      // The data might be empty or not an array in this case
      if (response.status === 202 || !response.data || !Array.isArray(response.data)) {
        if (attempt < retries - 1) {
          // Exponential backoff: 1s, 2s, 3s, 4s
          await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000))
          continue
        }
        // On final attempt, try the simple contributors endpoint as fallback
        return await getContributorsFallback(octokit, owner, repo)
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
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000))
        continue
      }
      // Try fallback on error
      return await getContributorsFallback(octokit, owner, repo)
    }
  }
  return []
}

// Fallback: Use simple contributors endpoint (doesn't have weekly stats but always works)
async function getContributorsFallback(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<ContributorStats[]> {
  try {
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

  try {
    // First, try to get repo info to check if it exists and if we have access
    const repoInfo = await getRepoInfo(octokit, owner, repo)

    // If it's private and we don't have auth, return error
    if (repoInfo.private && !accessToken) {
      return {
        error: 'This is a private repository. Please sign in with GitHub to access it.',
        requiresAuth: true,
      }
    }

    // Get all stats in parallel
    const [languages, commits, codeFrequency, contributors] = await Promise.all([
      getLanguages(octokit, owner, repo),
      getCommits(octokit, owner, repo),
      getCodeFrequency(octokit, owner, repo),
      getContributors(octokit, owner, repo),
    ])

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
      codeFrequency,
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

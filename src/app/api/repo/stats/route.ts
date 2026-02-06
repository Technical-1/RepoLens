import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Octokit } from '@octokit/rest'
import { statsCache } from '@/lib/cache'
import { StatsRequestSchema, formatZodError } from '@/lib/validations'

interface CodeFrequencyResult {
  data: { week: number; additions: number; deletions: number }[]
  computing: boolean
  unavailable?: boolean
  reason?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()

    // Validate request body
    const validation = StatsRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      )
    }

    const { owner, repo, type } = validation.data
    const accessToken = session?.accessToken

    if (type === 'codeFrequency') {
      const cacheKey = `${owner}/${repo}`.toLowerCase()
      
      // Check cache for unauthenticated requests
      if (!accessToken) {
        const cached = statsCache.get(cacheKey)
        if (cached) {
          const cachedData = cached.data as CodeFrequencyResult
          // Return cached data if it has data or is marked as unavailable
          if ((cachedData.data && Array.isArray(cachedData.data) && cachedData.data.length > 0) || cachedData.unavailable) {
            return NextResponse.json(cached.data, {
              headers: { 'X-Cache': 'HIT' },
            })
          }
        }
      }

      const octokit = new Octokit({
        auth: accessToken || undefined,
      })

      try {
      const { data, status } = await octokit.repos.getCodeFrequencyStats({ owner, repo })

      if (status === 202 || !Array.isArray(data)) {
        return NextResponse.json({ data: [], computing: true })
      }

        const result: CodeFrequencyResult = {
        data: data.map((item) => ({
          week: item[0],
          additions: item[1],
          deletions: Math.abs(item[2]),
        })),
        computing: false,
      }
      
      // Cache successful results for unauthenticated requests
      if (!accessToken && result.data.length > 0) {
          statsCache.set(cacheKey, result)
      }

      return NextResponse.json(result)
      } catch (apiError) {
        // Handle GitHub API errors gracefully
        const error = apiError as { status?: number; message?: string }
        
        // 422 = Repository has too many commits (>10,000)
        // This is a permanent condition, so we cache the unavailable state
        if (error.status === 422) {
          const unavailableResult: CodeFrequencyResult = {
            data: [],
            computing: false,
            unavailable: true,
            reason: 'Repository has too many commits for code frequency analysis',
          }
          
          // Cache the unavailable state to avoid repeated API calls
          if (!accessToken) {
            statsCache.set(cacheKey, unavailableResult)
          }
          
          return NextResponse.json(unavailableResult)
        }
        
        // 403 = Rate limited or forbidden
        if (error.status === 403) {
          return NextResponse.json({
            data: [],
            computing: false,
            unavailable: true,
            reason: 'Rate limited or access denied',
          })
        }
        
        // Re-throw other errors
        throw apiError
      }
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

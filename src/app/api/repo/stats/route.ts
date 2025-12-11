import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Octokit } from '@octokit/rest'

// Cache for code frequency stats (these don't change often)
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const MAX_CACHE_SIZE = 50

function cleanupCache() {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { owner, repo, type } = await request.json()

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Owner and repo are required' }, { status: 400 })
    }

    // @ts-expect-error - accessToken is added dynamically
    const accessToken = session?.accessToken as string | undefined

    if (type === 'codeFrequency') {
      const cacheKey = `${owner}/${repo}`.toLowerCase()
      
      // Check cache for unauthenticated requests
      if (!accessToken) {
        const cached = cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          // Only return cached data if it's not empty (was successfully computed)
          const cachedData = cached.data as { data: unknown[]; computing: boolean }
          if (cachedData.data && Array.isArray(cachedData.data) && cachedData.data.length > 0) {
            return NextResponse.json(cached.data, {
              headers: { 'X-Cache': 'HIT' },
            })
          }
        }
        
        if (cache.size > MAX_CACHE_SIZE) {
          cleanupCache()
        }
      }

      const octokit = new Octokit({
        auth: accessToken || undefined,
      })

      const { data, status } = await octokit.repos.getCodeFrequencyStats({ owner, repo })

      if (status === 202 || !Array.isArray(data)) {
        return NextResponse.json({ data: [], computing: true })
      }

      const result = {
        data: data.map((item) => ({
          week: item[0],
          additions: item[1],
          deletions: Math.abs(item[2]),
        })),
        computing: false,
      }
      
      // Cache successful results for unauthenticated requests
      if (!accessToken && result.data.length > 0) {
        cache.set(cacheKey, { data: result, timestamp: Date.now() })
      }

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

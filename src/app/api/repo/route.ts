import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeRepo } from '@/lib/github'

// Simple in-memory cache for unauthenticated requests
// This helps reduce API calls when multiple users analyze the same repo
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes in milliseconds
const MAX_CACHE_SIZE = 100 // Limit cache size to prevent memory issues

function cleanupCache() {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key)
    }
  }
  // If still too large, remove oldest entries
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE)
    toRemove.forEach(([key]) => cache.delete(key))
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { repoUrl } = await request.json()

    // @ts-expect-error - accessToken is added dynamically
    const accessToken = session?.accessToken as string | undefined
    
    // For unauthenticated requests, check cache first
    if (!accessToken) {
      const cacheKey = repoUrl.toLowerCase().trim()
      const cached = cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`Cache hit for: ${cacheKey}`)
        return NextResponse.json(cached.data, {
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Age': String(Math.floor((Date.now() - cached.timestamp) / 1000)),
          },
        })
      }
      
      // Clean up old entries periodically
      if (cache.size > 0) {
        cleanupCache()
      }
    }

    const result = await analyzeRepo(accessToken, repoUrl)

    if ('error' in result) {
      return NextResponse.json(result, { status: result.requiresAuth ? 401 : 400 })
    }
    
    // Cache successful results for unauthenticated requests
    if (!accessToken) {
      const cacheKey = repoUrl.toLowerCase().trim()
      cache.set(cacheKey, { data: result, timestamp: Date.now() })
      console.log(`Cached result for: ${cacheKey} (cache size: ${cache.size})`)
      
      return NextResponse.json(result, {
        headers: {
          'X-Cache': 'MISS',
        },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error analyzing repo:', error)
    return NextResponse.json(
      { error: 'Failed to analyze repository' },
      { status: 500 }
    )
  }
}

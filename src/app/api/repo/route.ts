import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeRepo, canonicalRepoKey } from '@/lib/github'
import { repoCache } from '@/lib/cache'
import { RepoRequestSchema, formatZodError } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()

    // Validate request body
    const validation = RepoRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      )
    }

    const { repoUrl } = validation.data
    const accessToken = session?.accessToken
    const cacheKey = canonicalRepoKey(repoUrl)

    // For unauthenticated requests, check cache first
    if (!accessToken) {
      const cached = repoCache.get(cacheKey)

      if (cached) {
        return NextResponse.json(cached.data, {
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Age': String(Math.floor(cached.age / 1000)),
          },
        })
      }
    }

    const result = await analyzeRepo(accessToken, repoUrl)

    if ('error' in result) {
      return NextResponse.json(result, { status: result.requiresAuth ? 401 : 400 })
    }

    // Cache successful results for unauthenticated requests
    if (!accessToken) {
      repoCache.set(cacheKey, result)

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

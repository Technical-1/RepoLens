import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeRepo } from '@/lib/github'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { repoUrl } = await request.json()

    // @ts-expect-error - accessToken is added dynamically
    const accessToken = session?.accessToken as string | undefined

    const result = await analyzeRepo(accessToken, repoUrl)

    if ('error' in result) {
      return NextResponse.json(result, { status: result.requiresAuth ? 401 : 400 })
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

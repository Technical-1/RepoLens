import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserRepos } from '@/lib/github'

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // @ts-expect-error - accessToken is added dynamically
    const accessToken = session.accessToken as string

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      )
    }

    const repos = await getUserRepos(accessToken)

    return NextResponse.json({ repos })
  } catch (error) {
    console.error('Error fetching user repos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}

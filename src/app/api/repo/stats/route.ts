import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Octokit } from '@octokit/rest'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { owner, repo, type } = await request.json()

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Owner and repo are required' }, { status: 400 })
    }

    // @ts-expect-error - accessToken is added dynamically
    const accessToken = session?.accessToken as string | undefined

    const octokit = new Octokit({
      auth: accessToken || undefined,
    })

    if (type === 'codeFrequency') {
      const { data, status } = await octokit.repos.getCodeFrequencyStats({ owner, repo })

      if (status === 202 || !Array.isArray(data)) {
        return NextResponse.json({ data: [], computing: true })
      }

      return NextResponse.json({
        data: data.map((item) => ({
          week: item[0],
          additions: item[1],
          deletions: Math.abs(item[2]),
        })),
        computing: false,
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}


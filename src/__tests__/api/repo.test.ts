import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

// `auth` from NextAuth v5 is an overloaded function; cast it to its no-arg
// session signature so vi.mocked picks the overload that accepts null.
type AuthSessionFn = () => Promise<Session | null>

// Mock auth before importing the route
vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>()
  return { ...actual, analyzeRepo: vi.fn() }
})

vi.mock('@/lib/cache', () => ({
  repoCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    size: vi.fn().mockReturnValue(0),
  },
}))

import { POST } from '@/app/api/repo/route'
import { analyzeRepo } from '@/lib/github'
import { auth } from '@/auth'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/repo', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/repo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth as unknown as AuthSessionFn).mockResolvedValue(null)
  })

  it('returns 400 for missing repoUrl', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeTruthy()
  })

  it('returns 400 for invalid repoUrl', async () => {
    const res = await POST(makeRequest({ repoUrl: 'not-a-repo' }))
    expect(res.status).toBe(400)
  })

  it('calls analyzeRepo with valid input', async () => {
    vi.mocked(analyzeRepo).mockResolvedValue({
      repo: {} as never,
      languages: {},
      totalLines: 100,
      totalLinesIsEstimated: false,
      languagePercentages: [],
      commits: [],
      totalCommits: 0,
      codeFrequency: [],
      codeFrequencyIsCalculated: false,
      contributors: [],
      totalAdditions: 0,
      totalDeletions: 0,
      isPrivate: false,
      requiresAuth: false,
    })

    const res = await POST(makeRequest({ repoUrl: 'facebook/react' }))
    expect(res.status).toBe(200)
    expect(analyzeRepo).toHaveBeenCalledWith(undefined, 'facebook/react')
  })

  it('returns error from analyzeRepo', async () => {
    vi.mocked(analyzeRepo).mockResolvedValue({
      error: 'Repository not found',
      requiresAuth: true,
    })

    const res = await POST(makeRequest({ repoUrl: 'facebook/react' }))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Repository not found')
  })

  it('returns 500 on unexpected errors', async () => {
    vi.mocked(analyzeRepo).mockRejectedValue(new Error('Network failure'))

    const res = await POST(makeRequest({ repoUrl: 'facebook/react' }))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Failed to analyze repository')
  })

  it('uses a canonical cache key for url variants', async () => {
    const { repoCache } = await import('@/lib/cache')
    vi.mocked(analyzeRepo).mockResolvedValue({
      repo: {} as never, languages: {}, totalLines: 1, totalLinesIsEstimated: false,
      languagePercentages: [], commits: [], totalCommits: 0, codeFrequency: [],
      codeFrequencyIsCalculated: false, contributors: [], totalAdditions: 0,
      totalDeletions: 0, isPrivate: false, requiresAuth: false,
    })

    await POST(makeRequest({ repoUrl: 'https://github.com/Facebook/React' }))
    expect(vi.mocked(repoCache.set)).toHaveBeenCalledWith('facebook/react', expect.anything())
  })
})

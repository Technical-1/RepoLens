import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Track the mock function so we can change it per-test
const mockGetCodeFrequencyStats = vi.fn()

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}))

vi.mock('@octokit/rest', () => ({
  Octokit: class MockOctokit {
    repos = {
      getCodeFrequencyStats: mockGetCodeFrequencyStats,
    }
  },
}))

vi.mock('@/lib/cache', () => ({
  statsCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
  },
}))

import { POST } from '@/app/api/repo/stats/route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/repo/stats', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/repo/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for missing fields', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid type', async () => {
    const res = await POST(makeRequest({ owner: 'fb', repo: 'react', type: 'invalid' }))
    expect(res.status).toBe(400)
  })

  it('returns computing status for 202 response', async () => {
    mockGetCodeFrequencyStats.mockResolvedValue({ data: {}, status: 202 })

    const res = await POST(makeRequest({ owner: 'fb', repo: 'react', type: 'codeFrequency' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.computing).toBe(true)
    expect(json.data).toEqual([])
  })

  it('returns formatted code frequency data', async () => {
    mockGetCodeFrequencyStats.mockResolvedValue({
      data: [
        [1718409600, 500, -200],
        [1719014400, 300, -100],
      ],
      status: 200,
    })

    const res = await POST(makeRequest({ owner: 'fb', repo: 'react', type: 'codeFrequency' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.computing).toBe(false)
    expect(json.data).toHaveLength(2)
    expect(json.data[0]).toEqual({ week: 1718409600, additions: 500, deletions: 200 })
  })

  it('returns unavailable for 422 error (too many commits)', async () => {
    mockGetCodeFrequencyStats.mockRejectedValue({ status: 422 })

    const res = await POST(makeRequest({ owner: 'fb', repo: 'react', type: 'codeFrequency' }))
    const json = await res.json()
    expect(json.unavailable).toBe(true)
    expect(json.reason).toContain('too many commits')
  })

  it('returns unavailable for 403 error (rate limited)', async () => {
    mockGetCodeFrequencyStats.mockRejectedValue({ status: 403 })

    const res = await POST(makeRequest({ owner: 'fb', repo: 'react', type: 'codeFrequency' }))
    const json = await res.json()
    expect(json.unavailable).toBe(true)
    expect(json.reason).toContain('Rate limited')
  })
})

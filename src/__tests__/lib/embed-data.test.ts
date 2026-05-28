import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.stubEnv('NEXT_PUBLIC_GITHUB_PROXY_URL', 'https://proxy.test')
})

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response
}

async function load() {
  return await import('@/lib/embed-data')
}

describe('getCodeStatsData', () => {
  it('sums full code_frequency history and uses participation for commit count', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ full_name: 'facebook/react' })) // repo
      .mockResolvedValueOnce(jsonResponse({ all: [2, 3, 5] }))               // participation
      .mockResolvedValueOnce(jsonResponse([[1, 500, -200], [2, 300, -100]])) // code_frequency
    vi.stubGlobal('fetch', fetchMock)

    const { getCodeStatsData } = await load()
    const data = await getCodeStatsData('facebook', 'react')

    expect(data.fullName).toBe('facebook/react')
    expect(data.totalAdditions).toBe(800)
    expect(data.totalDeletions).toBe(300)
    expect(data.totalLines).toBe(500)
    expect(data.commitCount).toBe(10)
    expect(data.linesAvailable).toBe(true)
    expect(data.commitCountAvailable).toBe(true)
    // Exactly 3 calls — NO per-commit detail loop.
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('marks stats unavailable instead of fabricating when code_frequency fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ full_name: 'big/repo' }))   // repo
      .mockResolvedValueOnce({ ok: false, status: 202 } as Response)    // participation not ready
      .mockResolvedValueOnce({ ok: false, status: 422 } as Response)    // code_frequency too large
    vi.stubGlobal('fetch', fetchMock)

    const { getCodeStatsData } = await load()
    const data = await getCodeStatsData('big', 'repo')

    expect(data.linesAvailable).toBe(false)
    expect(data.commitCountAvailable).toBe(false)
    expect(data.totalLines).toBe(0)
    expect(data.commitCount).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(3) // still no per-commit calls
  })
})

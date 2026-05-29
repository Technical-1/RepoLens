import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.stubEnv('NEXT_PUBLIC_GITHUB_PROXY_URL', 'https://proxy.test')
})

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response
}

// GraphQL commit-totals response shape returned by the proxy.
function graphqlResponse(totalCount: number, nodes: Array<{ additions: number; deletions: number }>) {
  return jsonResponse({
    data: { repository: { defaultBranchRef: { target: { history: { totalCount, nodes } } } } },
  })
}

async function load() {
  return await import('@/lib/embed-data')
}

describe('getCodeStatsData', () => {
  it('uses full code_frequency history for lines and GraphQL totalCount for commits', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ full_name: 'facebook/react' }))          // repo
      .mockResolvedValueOnce(jsonResponse([[1, 500, -200], [2, 300, -100]]))          // code_frequency
      .mockResolvedValueOnce(graphqlResponse(18500, [{ additions: 1, deletions: 1 }])) // graphql
    vi.stubGlobal('fetch', fetchMock)

    const { getCodeStatsData } = await load()
    const data = await getCodeStatsData('facebook', 'react')

    expect(data.fullName).toBe('facebook/react')
    // lines come from code_frequency (accurate), NOT the graphql estimate
    expect(data.totalAdditions).toBe(800)
    expect(data.totalDeletions).toBe(300)
    expect(data.totalLines).toBe(500)
    expect(data.linesAvailable).toBe(true)
    // commits come from graphql totalCount
    expect(data.commitCount).toBe(18500)
    expect(data.commitCountAvailable).toBe(true)
    // repo + code_frequency + graphql — no per-commit loop
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('falls back to a GraphQL recent-commit estimate when code_frequency is empty/computing', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ full_name: 'Technical-1/All-About-Me' })) // repo
      .mockResolvedValueOnce(jsonResponse({}))                                          // code_frequency 202 {}
      .mockResolvedValueOnce(graphqlResponse(371, [                                     // graphql
        { additions: 700, deletions: 600 },
        { additions: 300, deletions: 100 },
      ]))
    vi.stubGlobal('fetch', fetchMock)

    const { getCodeStatsData } = await load()
    const data = await getCodeStatsData('Technical-1', 'All-About-Me')

    // estimate from recent commits — lines are shown, not "—"
    expect(data.linesAvailable).toBe(true)
    expect(data.totalAdditions).toBe(1000)
    expect(data.totalDeletions).toBe(700)
    expect(data.totalLines).toBe(300)
    expect(data.commitCount).toBe(371)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('reports unavailable (renders "—") only when BOTH code_frequency and GraphQL fail', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ full_name: 'big/repo' })) // repo
      .mockResolvedValueOnce({ ok: false, status: 422 } as Response)  // code_frequency too large
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)  // graphql fails
    vi.stubGlobal('fetch', fetchMock)

    const { getCodeStatsData } = await load()
    const data = await getCodeStatsData('big', 'repo')

    expect(data.linesAvailable).toBe(false)
    expect(data.commitCountAvailable).toBe(false)
    expect(data.totalLines).toBe(0)
    expect(data.commitCount).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})

import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseRepoUrl } from '@/lib/github'
import { parseLastPageFromLink } from '@/lib/github'
import { sumCodeFrequency } from '@/lib/github'
import { canonicalRepoKey } from '@/lib/github'
import { getCommitsGraphQL } from '@/lib/github'
import type { CodeFrequency } from '@/types'

describe('parseRepoUrl', () => {
  it('parses owner/repo format', () => {
    expect(parseRepoUrl('facebook/react')).toEqual({ owner: 'facebook', repo: 'react' })
  })

  it('parses full HTTPS URL', () => {
    expect(parseRepoUrl('https://github.com/facebook/react')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('parses HTTP URL', () => {
    expect(parseRepoUrl('http://github.com/vercel/next.js')).toEqual({
      owner: 'vercel',
      repo: 'next.js',
    })
  })

  it('strips .git suffix', () => {
    expect(parseRepoUrl('https://github.com/facebook/react.git')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('strips trailing slash', () => {
    expect(parseRepoUrl('https://github.com/facebook/react/')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('parses URL without protocol', () => {
    expect(parseRepoUrl('github.com/facebook/react')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('returns null for invalid input', () => {
    expect(parseRepoUrl('')).toBeNull()
    expect(parseRepoUrl('just-a-word')).toBeNull()
    expect(parseRepoUrl('https://gitlab.com/foo/bar')).toBeNull()
  })

  it('handles repos with dots and hyphens', () => {
    expect(parseRepoUrl('vercel/next.js')).toEqual({ owner: 'vercel', repo: 'next.js' })
    expect(parseRepoUrl('my-org/my-repo')).toEqual({ owner: 'my-org', repo: 'my-repo' })
  })
})

describe('parseLastPageFromLink', () => {
  it('extracts the last page number from a GitHub Link header', () => {
    const link =
      '<https://api.github.com/repositories/1/commits?per_page=1&page=2>; rel="next", ' +
      '<https://api.github.com/repositories/1/commits?per_page=1&page=4821>; rel="last"'
    expect(parseLastPageFromLink(link)).toBe(4821)
  })

  it('returns null when there is no rel="last" segment', () => {
    expect(parseLastPageFromLink('<https://api.github.com/x?page=2>; rel="next"')).toBeNull()
  })

  it('returns null for empty / missing headers', () => {
    expect(parseLastPageFromLink(null)).toBeNull()
    expect(parseLastPageFromLink(undefined)).toBeNull()
    expect(parseLastPageFromLink('')).toBeNull()
  })
})

describe('sumCodeFrequency', () => {
  it('sums additions and deletions across all weeks', () => {
    const weeks: CodeFrequency[] = [
      { week: 1, additions: 500, deletions: 200 },
      { week: 2, additions: 300, deletions: 100 },
    ]
    expect(sumCodeFrequency(weeks)).toEqual({ additions: 800, deletions: 300, net: 500 })
  })

  it('clamps net to zero when deletions exceed additions', () => {
    const weeks: CodeFrequency[] = [{ week: 1, additions: 10, deletions: 50 }]
    expect(sumCodeFrequency(weeks)).toEqual({ additions: 10, deletions: 50, net: 0 })
  })

  it('returns zeros for an empty array', () => {
    expect(sumCodeFrequency([])).toEqual({ additions: 0, deletions: 0, net: 0 })
  })
})

describe('getCommitsGraphQL pagination', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Build a fake GraphQL `history` page response.
  const makeNode = (i: number) => ({
    oid: `sha${i}`,
    message: `commit ${i}\nbody`,
    committedDate: '2024-01-01T00:00:00Z',
    author: { name: 'Author', avatarUrl: '' },
    additions: 2,
    deletions: 1,
    changedFilesIfAvailable: 1,
  })

  const makePage = (
    count: number,
    { hasNextPage, endCursor, totalCount }: { hasNextPage: boolean; endCursor: string | null; totalCount: number }
  ) => ({
    ok: true,
    json: async () => ({
      data: {
        repository: {
          defaultBranchRef: {
            target: {
              history: {
                totalCount,
                pageInfo: { hasNextPage, endCursor },
                nodes: Array.from({ length: count }, (_, i) => makeNode(i)),
              },
            },
          },
        },
      },
    }),
  })

  // Pull the `variables` out of a recorded fetch call's request body.
  const variablesOf = (call: unknown[]) =>
    JSON.parse((call[1] as { body: string }).body).variables as {
      first: number
      after: string | null
    }

  it('fetches a single page by default (count=100) and never requests more', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makePage(100, { hasNextPage: true, endCursor: 'C1', totalCount: 5000 }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await getCommitsGraphQL('token', 'owner', 'repo')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(res.commits).toHaveLength(100)
    expect(res.totalCount).toBe(5000)
    expect(variablesOf(fetchMock.mock.calls[0]).first).toBe(100)
  })

  it('paginates with cursors up to the requested depth, capping page size at 100', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makePage(100, { hasNextPage: true, endCursor: 'C1', totalCount: 5000 }))
      .mockResolvedValueOnce(makePage(100, { hasNextPage: true, endCursor: 'C2', totalCount: 5000 }))
      .mockResolvedValueOnce(makePage(50, { hasNextPage: true, endCursor: 'C3', totalCount: 5000 }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await getCommitsGraphQL('token', 'owner', 'repo', 250)

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(res.commits).toHaveLength(250)
    expect(res.totalCount).toBe(5000)

    // Page 1: no cursor, full page. Page 2: after C1. Page 3: after C2, only 50 left.
    expect(variablesOf(fetchMock.mock.calls[0])).toMatchObject({ first: 100, after: null })
    expect(variablesOf(fetchMock.mock.calls[1])).toMatchObject({ first: 100, after: 'C1' })
    expect(variablesOf(fetchMock.mock.calls[2])).toMatchObject({ first: 50, after: 'C2' })
  })

  it('stops early when history is exhausted (hasNextPage=false)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makePage(100, { hasNextPage: true, endCursor: 'C1', totalCount: 160 }))
      .mockResolvedValueOnce(makePage(60, { hasNextPage: false, endCursor: null, totalCount: 160 }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await getCommitsGraphQL('token', 'owner', 'repo', 2500)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(res.commits).toHaveLength(160)
    expect(res.totalCount).toBe(160)
  })
})

describe('canonicalRepoKey', () => {
  it('maps every URL variant of the same repo to one key', () => {
    const expected = 'facebook/react'
    expect(canonicalRepoKey('facebook/react')).toBe(expected)
    expect(canonicalRepoKey('github.com/facebook/react')).toBe(expected)
    expect(canonicalRepoKey('https://github.com/Facebook/React')).toBe(expected)
    expect(canonicalRepoKey('https://github.com/facebook/react.git')).toBe(expected)
  })

  it('falls back to a normalized raw string for unparseable input', () => {
    expect(canonicalRepoKey('  Not-A-Repo  ')).toBe('not-a-repo')
  })

  it('trims surrounding whitespace before parsing', () => {
    expect(canonicalRepoKey('  facebook/react  ')).toBe('facebook/react')
  })
})

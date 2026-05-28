import { describe, it, expect } from 'vitest'
import { parseRepoUrl } from '@/lib/github'
import { parseLastPageFromLink } from '@/lib/github'
import { sumCodeFrequency } from '@/lib/github'
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

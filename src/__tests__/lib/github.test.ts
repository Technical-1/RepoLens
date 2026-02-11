import { describe, it, expect } from 'vitest'
import { parseRepoUrl } from '@/lib/github'

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

import { describe, it, expect } from 'vitest'
import { RepoRequestSchema, StatsRequestSchema, formatZodError } from '@/lib/validations'

describe('RepoRequestSchema', () => {
  it('accepts owner/repo format', () => {
    const result = RepoRequestSchema.safeParse({ repoUrl: 'facebook/react' })
    expect(result.success).toBe(true)
  })

  it('accepts full GitHub URL', () => {
    const result = RepoRequestSchema.safeParse({ repoUrl: 'https://github.com/facebook/react' })
    expect(result.success).toBe(true)
  })

  it('accepts GitHub URL without protocol', () => {
    const result = RepoRequestSchema.safeParse({ repoUrl: 'github.com/facebook/react' })
    expect(result.success).toBe(true)
  })

  it('rejects empty string', () => {
    const result = RepoRequestSchema.safeParse({ repoUrl: '' })
    expect(result.success).toBe(false)
  })

  it('rejects single word', () => {
    const result = RepoRequestSchema.safeParse({ repoUrl: 'justarepo' })
    expect(result.success).toBe(false)
  })

  it('rejects URL exceeding max length', () => {
    const result = RepoRequestSchema.safeParse({ repoUrl: 'a'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('rejects missing repoUrl field', () => {
    const result = RepoRequestSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('StatsRequestSchema', () => {
  it('accepts valid codeFrequency request', () => {
    const result = StatsRequestSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      type: 'codeFrequency',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty owner', () => {
    const result = StatsRequestSchema.safeParse({
      owner: '',
      repo: 'react',
      type: 'codeFrequency',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = StatsRequestSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      type: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = StatsRequestSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('formatZodError', () => {
  it('formats single error', () => {
    const result = RepoRequestSchema.safeParse({ repoUrl: '' })
    if (!result.success) {
      const message = formatZodError(result.error)
      expect(message).toBeTruthy()
      expect(typeof message).toBe('string')
    }
  })

  it('joins multiple errors with period', () => {
    const result = StatsRequestSchema.safeParse({})
    if (!result.success) {
      const message = formatZodError(result.error)
      expect(message).toContain('.')
    }
  })
})

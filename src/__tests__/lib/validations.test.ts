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
  it('formats single error with the actual issue message', () => {
    const result = RepoRequestSchema.safeParse({ repoUrl: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const message = formatZodError(result.error)
      expect(message).toContain('required')
    }
  })

  it('joins multiple errors with period separator', () => {
    const result = StatsRequestSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const message = formatZodError(result.error)
      // Should contain multiple issue messages joined by ". "
      const parts = message.split('. ')
      expect(parts.length).toBeGreaterThanOrEqual(2)
      // Each part should be a meaningful message, not empty
      parts.forEach((part) => {
        expect(part.length).toBeGreaterThan(0)
      })
    }
  })
})

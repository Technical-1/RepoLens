import { describe, it, expect } from 'vitest'
import { validateEmbedParams } from '@/lib/embed-validation'

describe('validateEmbedParams', () => {
  it('accepts normal owner/repo', () => {
    expect(validateEmbedParams('facebook', 'react')).toEqual({ ok: true, owner: 'facebook', repo: 'react' })
  })

  it('accepts names with dots, hyphens, underscores', () => {
    expect(validateEmbedParams('my-org', 'next.js_v2')).toEqual({ ok: true, owner: 'my-org', repo: 'next.js_v2' })
  })

  it('rejects path traversal and slashes', () => {
    expect(validateEmbedParams('../../etc', 'react').ok).toBe(false)
    expect(validateEmbedParams('facebook', 'react/stats').ok).toBe(false)
  })

  it('rejects bare dot and dot-dot segments (endpoint confusion)', () => {
    expect(validateEmbedParams('..', 'react').ok).toBe(false)
    expect(validateEmbedParams('facebook', '..').ok).toBe(false)
    expect(validateEmbedParams('.', 'react').ok).toBe(false)
    expect(validateEmbedParams('foo..bar', 'react').ok).toBe(false)
  })

  it('rejects query injection characters', () => {
    expect(validateEmbedParams('facebook', 'react?foo=bar').ok).toBe(false)
    expect(validateEmbedParams('a b', 'react').ok).toBe(false)
  })

  it('rejects null / empty values', () => {
    expect(validateEmbedParams(null, 'react').ok).toBe(false)
    expect(validateEmbedParams('facebook', '').ok).toBe(false)
  })
})

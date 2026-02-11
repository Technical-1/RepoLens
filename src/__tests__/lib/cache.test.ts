import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCache } from '@/lib/cache'

describe('createCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores and retrieves values', () => {
    const cache = createCache<string>({ ttl: 60000, maxSize: 10 })
    cache.set('key1', 'value1')
    const result = cache.get('key1')
    expect(result).not.toBeNull()
    expect(result!.data).toBe('value1')
  })

  it('returns null for missing keys', () => {
    const cache = createCache<string>({ ttl: 60000, maxSize: 10 })
    expect(cache.get('nonexistent')).toBeNull()
  })

  it('expires entries after TTL', () => {
    const cache = createCache<string>({ ttl: 5000, maxSize: 10 })
    cache.set('key1', 'value1')

    expect(cache.get('key1')).not.toBeNull()

    vi.advanceTimersByTime(5001)

    expect(cache.get('key1')).toBeNull()
  })

  it('reports age of cached entries', () => {
    const cache = createCache<string>({ ttl: 60000, maxSize: 10 })
    cache.set('key1', 'value1')

    vi.advanceTimersByTime(2000)

    const result = cache.get('key1')
    expect(result).not.toBeNull()
    expect(result!.age).toBeGreaterThanOrEqual(2000)
  })

  it('evicts oldest entries when maxSize is reached', () => {
    const cache = createCache<string>({ ttl: 60000, maxSize: 2 })
    cache.set('a', 'first')
    vi.advanceTimersByTime(100)
    cache.set('b', 'second')
    vi.advanceTimersByTime(100)
    // This should trigger cleanup and evict 'a'
    cache.set('c', 'third')

    expect(cache.get('a')).toBeNull()
    expect(cache.get('c')).not.toBeNull()
    expect(cache.get('b')).not.toBeNull()
  })

  it('has() returns correct boolean', () => {
    const cache = createCache<string>({ ttl: 60000, maxSize: 10 })
    cache.set('key1', 'value1')
    expect(cache.has('key1')).toBe(true)
    expect(cache.has('missing')).toBe(false)
  })

  it('delete() removes entries', () => {
    const cache = createCache<string>({ ttl: 60000, maxSize: 10 })
    cache.set('key1', 'value1')
    expect(cache.delete('key1')).toBe(true)
    expect(cache.get('key1')).toBeNull()
  })

  it('clear() removes all entries', () => {
    const cache = createCache<string>({ ttl: 60000, maxSize: 10 })
    cache.set('a', '1')
    cache.set('b', '2')
    cache.clear()
    expect(cache.size()).toBe(0)
  })

  it('size() returns current entry count', () => {
    const cache = createCache<string>({ ttl: 60000, maxSize: 10 })
    expect(cache.size()).toBe(0)
    cache.set('a', '1')
    expect(cache.size()).toBe(1)
    cache.set('b', '2')
    expect(cache.size()).toBe(2)
  })

  it('cleanup() removes expired entries', () => {
    const cache = createCache<string>({ ttl: 5000, maxSize: 10 })
    cache.set('a', '1')
    cache.set('b', '2')

    vi.advanceTimersByTime(5001)
    cache.cleanup()

    expect(cache.size()).toBe(0)
  })
})

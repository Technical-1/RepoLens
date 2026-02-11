interface CacheOptions {
  /** Time-to-live in milliseconds */
  ttl: number
  /** Maximum number of entries to keep in cache */
  maxSize: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface CacheResult<T> {
  data: T
  age: number
}

/**
 * Creates a simple in-memory cache with TTL and max size limits
 */
export function createCache<T>(options: CacheOptions) {
  const { ttl, maxSize } = options
  const cache = new Map<string, CacheEntry<T>>()

  function cleanup() {
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > ttl) {
        cache.delete(key)
      }
    }
    // If still at or above capacity, remove oldest entries to make room
    if (cache.size >= maxSize) {
      const entries = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toRemove = entries.slice(0, cache.size - maxSize + 1)
      toRemove.forEach(([key]) => cache.delete(key))
    }
  }

  return {
    /**
     * Get a cached value if it exists and is not expired
     */
    get(key: string): CacheResult<T> | null {
      const entry = cache.get(key)
      if (!entry) return null

      const age = Date.now() - entry.timestamp
      if (age > ttl) {
        cache.delete(key)
        return null
      }

      return { data: entry.data, age }
    },

    /**
     * Set a value in the cache
     */
    set(key: string, data: T): void {
      // Clean up before adding if we're at capacity
      if (cache.size >= maxSize) {
        cleanup()
      }
      cache.set(key, { data, timestamp: Date.now() })
    },

    /**
     * Check if a key exists and is not expired
     */
    has(key: string): boolean {
      const result = this.get(key)
      return result !== null
    },

    /**
     * Get the current cache size
     */
    size(): number {
      return cache.size
    },

    /**
     * Delete a specific key
     */
    delete(key: string): boolean {
      return cache.delete(key)
    },

    /**
     * Clear all entries
     */
    clear(): void {
      cache.clear()
    },

    /**
     * Trigger manual cleanup of expired entries
     */
    cleanup,
  }
}

// Pre-configured caches for common use cases
export const repoCache = createCache<unknown>({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 100,
})

export const statsCache = createCache<unknown>({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 50,
})


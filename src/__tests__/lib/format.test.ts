import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatNumber,
  formatBytes,
  formatDate,
  formatRelativeDate,
  formatRelativeDateWithPrefix,
} from '@/lib/format'

describe('formatNumber', () => {
  it('returns raw string for small numbers', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(42)).toBe('42')
    expect(formatNumber(999)).toBe('999')
  })

  it('formats thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1.0K')
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(999999)).toBe('1000.0K')
  })

  it('formats millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1.0M')
    expect(formatNumber(2500000)).toBe('2.5M')
  })

  it('uses locale formatting when useLocale is true', () => {
    expect(formatNumber(999, true)).toBe('999')
    // K/M formatting takes precedence over locale
    expect(formatNumber(1000, true)).toBe('1.0K')
  })
})

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(999)).toBe('999 B')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1000)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1000000)).toBe('1.0 MB')
    expect(formatBytes(5500000)).toBe('5.5 MB')
  })
})

describe('formatDate', () => {
  it('formats ISO date strings', () => {
    // Use a fixed date to avoid locale issues
    const result = formatDate('2024-06-15T12:00:00Z')
    expect(result).toContain('Jun')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })
})

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Today" for same day', () => {
    expect(formatRelativeDate('2024-06-15T10:00:00Z')).toBe('Today')
  })

  it('returns "Yesterday" for one day ago', () => {
    expect(formatRelativeDate('2024-06-14T10:00:00Z')).toBe('Yesterday')
  })

  it('returns days ago for 2-6 days', () => {
    expect(formatRelativeDate('2024-06-12T10:00:00Z')).toBe('3 days ago')
  })

  it('returns weeks ago for 7-29 days', () => {
    expect(formatRelativeDate('2024-06-01T10:00:00Z')).toBe('2 weeks ago')
  })

  it('returns months ago for 30-364 days', () => {
    expect(formatRelativeDate('2024-03-15T10:00:00Z')).toBe('3 months ago')
  })

  it('returns years ago for 365+ days', () => {
    expect(formatRelativeDate('2022-06-15T10:00:00Z')).toBe('2 years ago')
  })
})

describe('formatRelativeDateWithPrefix', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses default "Updated" prefix', () => {
    expect(formatRelativeDateWithPrefix('2024-06-15T10:00:00Z')).toBe('Updated today')
    expect(formatRelativeDateWithPrefix('2024-06-14T10:00:00Z')).toBe('Updated yesterday')
    expect(formatRelativeDateWithPrefix('2024-06-12T10:00:00Z')).toBe('Updated 3 days ago')
  })

  it('uses custom prefix', () => {
    expect(formatRelativeDateWithPrefix('2024-06-15T10:00:00Z', 'Created')).toBe('Created today')
    expect(formatRelativeDateWithPrefix('2024-06-12T10:00:00Z', 'Pushed')).toBe('Pushed 3 days ago')
  })
})

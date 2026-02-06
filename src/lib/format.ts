/**
 * Format a number with K/M suffixes for large values
 * @param num - The number to format
 * @param useLocale - Whether to use locale formatting for small numbers
 */
export function formatNumber(num: number, useLocale = false): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return useLocale ? num.toLocaleString() : num.toString()
}

/**
 * Format bytes to human-readable format (B, KB, MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1000000) return (bytes / 1000000).toFixed(1) + ' MB'
  if (bytes >= 1000) return (bytes / 1000).toFixed(1) + ' KB'
  return bytes + ' B'
}

/**
 * Format a date string to a readable format (e.g., "Jan 1, 2024")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a date string to relative time (e.g., "2 days ago", "3 weeks ago")
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

/**
 * Format a date with a prefix (e.g., "Updated today", "Updated 2 days ago")
 */
export function formatRelativeDateWithPrefix(dateString: string, prefix: string = 'Updated'): string {
  const relative = formatRelativeDate(dateString)
  if (relative === 'Today') return `${prefix} today`
  if (relative === 'Yesterday') return `${prefix} yesterday`
  return `${prefix} ${relative}`
}


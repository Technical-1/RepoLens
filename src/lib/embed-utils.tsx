import { ImageResponse } from 'next/og'

export interface EmbedTheme {
  bg: string
  text: string
  muted: string
  cardBg: string
  border: string
  isDark: boolean
}

/**
 * Get theme colors for embed images
 */
export function getEmbedTheme(theme: string): EmbedTheme {
  const isDark = theme === 'dark'
  return {
    bg: isDark ? '#0d1117' : '#ffffff',
    text: isDark ? '#e6edf3' : '#1f2328',
    muted: isDark ? '#8b949e' : '#656d76',
    cardBg: isDark ? '#161b22' : '#f6f8fa',
    border: isDark ? '#30363d' : '#d0d7de',
    isDark,
  }
}

/**
 * Format a number with K/M suffixes for embed images
 */
export function formatEmbedNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

/**
 * Create an error image response for embed routes
 */
export function createErrorImageResponse(
  theme: string,
  errorTitle: string,
  errorDescription: string,
  width: number,
  height: number
): ImageResponse {
  const { bg, text, muted, border } = getEmbedTheme(theme)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: bg,
          padding: 40,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          border: `2px solid ${border}`,
          borderRadius: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#f8514926',
            marginBottom: 16,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <span style={{ fontSize: 24, fontWeight: 700, color: text, marginBottom: 8 }}>{errorTitle}</span>
        <span style={{ fontSize: 14, color: muted, textAlign: 'center' }}>{errorDescription}</span>
      </div>
    ),
    {
      width,
      height,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    }
  )
}

/**
 * Get error title and description based on error message
 */
export function getErrorDetails(message: string): { title: string; description: string } {
  if (message.includes('rate limit')) {
    return {
      title: 'Rate Limit Exceeded',
      description: 'GitHub API rate limit reached. Try again later.',
    }
  }
  if (message.includes('10000 commits')) {
    return {
      title: 'Repository Too Large',
      description: 'This repo has 10,000+ commits. Stats unavailable via API.',
    }
  }
  return {
    title: 'Unable to Load Stats',
    description: 'Could not fetch repository data.',
  }
}

/**
 * Common header component for embed images
 */
export function EmbedHeader({
  fullName,
  subtitle,
  theme,
}: {
  fullName: string
  subtitle: string
  theme: EmbedTheme
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #238636, #2ea043)',
          marginRight: 16,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: theme.text }}>{fullName}</span>
        <span style={{ fontSize: 16, color: theme.muted }}>{subtitle}</span>
      </div>
    </div>
  )
}

/**
 * Stat card component for embed images
 */
export interface StatItem {
  label: string
  value: string
  color: string
}

export function renderStatCards(stats: StatItem[], theme: EmbedTheme, centered: boolean = false) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 24,
        justifyContent: centered ? 'center' : 'flex-start',
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.cardBg,
            borderRadius: 12,
            padding: '20px 28px',
            minWidth: 120,
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 700, color: stat.color }}>{stat.value}</span>
          <span style={{ fontSize: 16, color: theme.muted, marginTop: 4 }}>{stat.label}</span>
        </div>
      ))}
    </div>
  )
}


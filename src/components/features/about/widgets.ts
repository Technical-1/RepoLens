export const SAMPLE_OWNER = 'Technical-1'
export const SAMPLE_REPO = 'RepoLens'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://repolens.io'

export type WidgetTheme = 'dark' | 'light'

export interface WidgetDef {
  key: 'code-stats' | 'stats' | 'languages'
  label: string
  description: string
  alt: string
}

export const WIDGETS: WidgetDef[] = [
  {
    key: 'code-stats',
    label: 'Code Statistics',
    description: 'Total lines, lines added, lines removed, and commit count.',
    alt: 'RepoLens code statistics',
  },
  {
    key: 'stats',
    label: 'Stats Overview',
    description: 'Stars, forks, watchers, and open issues.',
    alt: 'RepoLens stats overview',
  },
  {
    key: 'languages',
    label: 'Language Breakdown',
    description: 'Top programming languages used in the repository.',
    alt: 'RepoLens language breakdown',
  },
]

export function embedSrc(
  key: WidgetDef['key'],
  owner: string,
  repo: string,
  theme: WidgetTheme
): string {
  const params = new URLSearchParams({ owner, repo, theme })
  return `${SITE_URL}/api/embed/${key}?${params.toString()}`
}

export function linkHref(owner: string, repo: string): string {
  return `${SITE_URL}/?repo=${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
}

export function markdownSnippet(
  w: WidgetDef,
  owner: string,
  repo: string,
  theme: WidgetTheme
): string {
  return `[![${w.alt}](${embedSrc(w.key, owner, repo, theme)})](${linkHref(owner, repo)})`
}

export function htmlSnippet(
  w: WidgetDef,
  owner: string,
  repo: string,
  theme: WidgetTheme
): string {
  return `<a href="${linkHref(owner, repo)}">\n  <img src="${embedSrc(w.key, owner, repo, theme)}" width="400" alt="${w.alt}" />\n</a>`
}

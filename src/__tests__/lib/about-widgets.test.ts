import { describe, it, expect } from 'vitest'
import {
  WIDGETS,
  embedSrc,
  linkHref,
  markdownSnippet,
  htmlSnippet,
} from '@/components/features/about/widgets'

describe('about widgets', () => {
  it('defines the three embed widgets', () => {
    expect(WIDGETS.map((w) => w.key)).toEqual(['code-stats', 'stats', 'languages'])
  })

  it('builds an embed src with owner, repo, and theme', () => {
    const src = embedSrc('stats', 'Technical-1', 'RepoLens', 'light')
    expect(src).toContain('/api/embed/stats')
    expect(src).toContain('owner=Technical-1')
    expect(src).toContain('repo=RepoLens')
    expect(src).toContain('theme=light')
  })

  it('builds a click-through link to the analyzer', () => {
    expect(linkHref('Technical-1', 'RepoLens')).toContain('?repo=Technical-1/RepoLens')
  })

  it('builds a markdown snippet wrapping the image in a link', () => {
    const w = WIDGETS[0]
    const md = markdownSnippet(w, 'Technical-1', 'RepoLens', 'dark')
    expect(md).toBe(
      `[![${w.alt}](${embedSrc(w.key, 'Technical-1', 'RepoLens', 'dark')})](${linkHref('Technical-1', 'RepoLens')})`
    )
  })

  it('builds an html snippet with a 400px wide image', () => {
    const w = WIDGETS[0]
    const html = htmlSnippet(w, 'Technical-1', 'RepoLens', 'dark')
    expect(html).toContain(`<img src="${embedSrc(w.key, 'Technical-1', 'RepoLens', 'dark')}"`)
    expect(html).toContain('width="400"')
    expect(html).toContain(`alt="${w.alt}"`)
  })
})

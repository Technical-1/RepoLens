# `/about` Info Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/about` page that explains RepoLens, documents its methodology and engineering choices, provides an interactive embeddable-widget guide, and answers common questions.

**Architecture:** A server component `page.tsx` exports SEO `metadata` and renders a client `AboutContent` wrapper. `AboutContent` renders its own `Header`/`Footer`/`ParticleBackground` (there is no `(public)` group layout) plus a sticky scroll-spy `SectionNav` and four stacked sections: intro, how-it-works, an interactive widget guide, and an FAQ accordion. Widget previews are plain `<img>` tags pointing at the existing `/api/embed/*` SVG endpoints, so no new fetch logic or API routes are needed.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, lucide-react icons, Vitest + Testing Library.

---

## File structure

**Create:**
- `src/components/features/about/widgets.ts` — widget metadata + snippet/URL builders (pure functions, shared by component and tests).
- `src/components/features/about/WidgetGuide.tsx` — client; live previews, theme toggle, copy-to-clipboard snippets.
- `src/components/features/about/FaqAccordion.tsx` — client; collapsible Q&A.
- `src/components/features/about/SectionNav.tsx` — client; sticky sub-nav + IntersectionObserver scroll-spy.
- `src/components/features/about/AboutIntro.tsx` — presentational; "What is RepoLens".
- `src/components/features/about/HowItWorks.tsx` — presentational; methodology + engineering choices.
- `src/components/features/about/AboutContent.tsx` — client; assembles the page (Header/Footer/background/sections).
- `src/app/(public)/about/page.tsx` — server; `metadata` export + renders `AboutContent`.
- Tests under `src/__tests__/components/` and `src/__tests__/app/`.

**Modify:**
- `src/app/sitemap.ts` — add `/about` entry.
- `src/components/layout/Header.tsx` — add an "About" nav link.
- `src/components/layout/Footer.tsx` — add an "About" link.

---

## Task 1: Widget metadata + snippet builders

**Files:**
- Create: `src/components/features/about/widgets.ts`
- Test: `src/__tests__/lib/about-widgets.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/about-widgets.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/about-widgets.test.ts`
Expected: FAIL — cannot resolve module `@/components/features/about/widgets`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/features/about/widgets.ts`:

```ts
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
  return `${SITE_URL}/api/embed/${key}?owner=${owner}&repo=${repo}&theme=${theme}`
}

export function linkHref(owner: string, repo: string): string {
  return `${SITE_URL}/?repo=${owner}/${repo}`
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/about-widgets.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/features/about/widgets.ts src/__tests__/lib/about-widgets.test.ts
git commit -m "feat(about): widget metadata and embed snippet builders"
```

---

## Task 2: WidgetGuide component

**Files:**
- Create: `src/components/features/about/WidgetGuide.tsx`
- Test: `src/__tests__/components/WidgetGuide.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/WidgetGuide.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import WidgetGuide from '@/components/features/about/WidgetGuide'

describe('WidgetGuide', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a live preview image for each widget', () => {
    render(<WidgetGuide />)
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(3)
    imgs.forEach((img) => {
      expect(img.getAttribute('src')).toContain('theme=dark')
    })
  })

  it('switches every preview to light when the light toggle is pressed', () => {
    render(<WidgetGuide />)
    fireEvent.click(screen.getByRole('button', { name: /^light$/i }))
    screen.getAllByRole('img').forEach((img) => {
      expect(img.getAttribute('src')).toContain('theme=light')
    })
  })

  it('copies the markdown snippet to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    render(<WidgetGuide />)
    const first = screen.getByText('Code Statistics').closest('div')!
    fireEvent.click(within(first).getByRole('button', { name: /copy markdown snippet/i }))

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0][0]).toContain('/api/embed/code-stats')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/WidgetGuide.test.tsx`
Expected: FAIL — cannot resolve `@/components/features/about/WidgetGuide`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/features/about/WidgetGuide.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  WIDGETS,
  SAMPLE_OWNER,
  SAMPLE_REPO,
  embedSrc,
  markdownSnippet,
  htmlSnippet,
  type WidgetTheme,
} from './widgets'

export default function WidgetGuide() {
  const [theme, setTheme] = useState<WidgetTheme>('dark')
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard?.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <section id="widgets" className="scroll-mt-32 py-12">
      <h2 className="text-2xl font-bold text-white mb-2">Embeddable widgets</h2>
      <p className="text-github-muted mb-6 max-w-3xl">
        Drop a live RepoLens badge into any README. Toggle the theme, then copy a snippet.
      </p>

      <div
        role="group"
        aria-label="Widget theme"
        className="inline-flex rounded-lg border border-github-border overflow-hidden mb-8"
      >
        {(['dark', 'light'] as WidgetTheme[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            aria-pressed={theme === t}
            className={`px-4 py-2 text-sm capitalize transition-colors ${
              theme === t
                ? 'bg-github-accent text-white'
                : 'bg-github-card text-github-muted hover:text-github-text'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {WIDGETS.map((w) => {
          const snippets = [
            { id: `${w.key}-md`, label: 'Markdown', value: markdownSnippet(w, SAMPLE_OWNER, SAMPLE_REPO, theme) },
            { id: `${w.key}-html`, label: 'HTML', value: htmlSnippet(w, SAMPLE_OWNER, SAMPLE_REPO, theme) },
          ]
          return (
            <div key={w.key} className="glass-card rounded-xl border border-github-border/50 p-6">
              <h3 className="text-lg font-semibold text-white">{w.label}</h3>
              <p className="text-sm text-github-muted mb-4">{w.description}</p>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={embedSrc(w.key, SAMPLE_OWNER, SAMPLE_REPO, theme)}
                width={400}
                alt={w.alt}
                className="rounded-lg mb-4 max-w-full"
              />

              <div className="space-y-3">
                {snippets.map((snip) => (
                  <div key={snip.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase tracking-wide text-github-muted">{snip.label}</span>
                      <button
                        onClick={() => copy(snip.id, snip.value)}
                        aria-label={`Copy ${snip.label} snippet for ${w.label}`}
                        className="flex items-center gap-1 text-xs text-github-link hover:text-white transition-colors"
                      >
                        {copied === snip.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === snip.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-github-darker border border-github-border p-3 text-xs text-github-text">
                      <code>{snip.value}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-sm text-github-muted mt-6">
        Params: <code>owner</code>, <code>repo</code>, <code>theme</code> (<code>dark</code> | <code>light</code>),
        and <code>hideRepoName=true</code> to hide the repo name.
      </p>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/WidgetGuide.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/features/about/WidgetGuide.tsx src/__tests__/components/WidgetGuide.test.tsx
git commit -m "feat(about): interactive widget guide with theme toggle and copy"
```

---

## Task 3: FaqAccordion component

**Files:**
- Create: `src/components/features/about/FaqAccordion.tsx`
- Test: `src/__tests__/components/FaqAccordion.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/FaqAccordion.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FaqAccordion from '@/components/features/about/FaqAccordion'

describe('FaqAccordion', () => {
  it('opens the first item by default', () => {
    render(<FaqAccordion />)
    const first = screen.getByRole('button', { name: /private repos missing/i })
    expect(first).toHaveAttribute('aria-expanded', 'true')
  })

  it('expands a collapsed item when clicked', () => {
    render(<FaqAccordion />)
    const stored = screen.getByRole('button', { name: /is any of my data stored/i })
    expect(stored).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(stored)
    expect(stored).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/never persists your credentials/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/FaqAccordion.test.tsx`
Expected: FAIL — cannot resolve `@/components/features/about/FaqAccordion`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/features/about/FaqAccordion.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FaqItem {
  q: string
  a: string
}

const FAQ: FaqItem[] = [
  {
    q: 'Why are some of my private repos missing?',
    a: 'RepoLens only sees private repositories after you sign in with GitHub and grant access. Without signing in, only public repositories are available.',
  },
  {
    q: 'How accurate are the line counts?',
    a: 'Line totals are computed from commit additions and deletions across the history RepoLens fetches. Very large repositories are analyzed over their recent history, so totals are a close estimate rather than a full file-by-file count.',
  },
  {
    q: 'Is any of my data stored?',
    a: 'No. RepoLens never persists your credentials or repository data. Authentication happens directly with GitHub and stats are computed on demand.',
  },
  {
    q: 'Why does a large repo take a moment to analyze?',
    a: 'Commit history is walked through the GitHub GraphQL API and is subject to rate limits. Bigger repositories simply have more history to page through.',
  },
]

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="scroll-mt-32 py-12">
      <h2 className="text-2xl font-bold text-white mb-6">FAQ</h2>
      <div className="space-y-3">
        {FAQ.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} className="glass-card rounded-xl border border-github-border/50 overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-medium text-white">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-github-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && <p className="px-5 pb-5 text-github-muted">{item.a}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/FaqAccordion.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/features/about/FaqAccordion.tsx src/__tests__/components/FaqAccordion.test.tsx
git commit -m "feat(about): FAQ accordion"
```

---

## Task 4: SectionNav (sticky scroll-spy)

**Files:**
- Create: `src/components/features/about/SectionNav.tsx`
- Test: `src/__tests__/components/SectionNav.test.tsx`

- [ ] **Step 1: Write the failing test**

jsdom has no `IntersectionObserver`, so the test stubs it. Create `src/__tests__/components/SectionNav.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SectionNav, { ABOUT_SECTIONS } from '@/components/features/about/SectionNav'

describe('SectionNav', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    )
  })

  it('renders an anchor for every section', () => {
    render(<SectionNav sections={ABOUT_SECTIONS} />)
    expect(screen.getByRole('link', { name: 'What' })).toHaveAttribute('href', '#what')
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how')
    expect(screen.getByRole('link', { name: 'Widgets' })).toHaveAttribute('href', '#widgets')
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/SectionNav.test.tsx`
Expected: FAIL — cannot resolve `@/components/features/about/SectionNav`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/features/about/SectionNav.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

export interface NavSection {
  id: string
  label: string
}

export const ABOUT_SECTIONS: NavSection[] = [
  { id: 'what', label: 'What' },
  { id: 'how', label: 'How it works' },
  { id: 'widgets', label: 'Widgets' },
  { id: 'faq', label: 'FAQ' },
]

export default function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActive(visible[0].target.id)
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav className="sticky top-16 z-40 -mx-4 px-4 py-3 bg-github-darker/80 backdrop-blur-lg border-b border-github-border/50">
      <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
              active === s.id ? 'bg-github-accent text-white' : 'text-github-muted hover:text-github-text'
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/SectionNav.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/features/about/SectionNav.tsx src/__tests__/components/SectionNav.test.tsx
git commit -m "feat(about): sticky scroll-spy section nav"
```

---

## Task 5: Static sections (AboutIntro + HowItWorks)

**Files:**
- Create: `src/components/features/about/AboutIntro.tsx`
- Create: `src/components/features/about/HowItWorks.tsx`
- Test: `src/__tests__/components/AboutSections.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/AboutSections.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutIntro from '@/components/features/about/AboutIntro'
import HowItWorks from '@/components/features/about/HowItWorks'

describe('About static sections', () => {
  it('renders the intro under the #what anchor', () => {
    const { container } = render(<AboutIntro />)
    expect(container.querySelector('#what')).not.toBeNull()
    expect(screen.getByRole('heading', { name: /what is repolens/i })).toBeInTheDocument()
  })

  it('renders the how-it-works engineering choices under the #how anchor', () => {
    const { container } = render(<HowItWorks />)
    expect(container.querySelector('#how')).not.toBeNull()
    expect(screen.getByRole('heading', { name: /graphql over rest/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /privacy first/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/AboutSections.test.tsx`
Expected: FAIL — cannot resolve the two modules.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/features/about/AboutIntro.tsx`:

```tsx
export default function AboutIntro() {
  return (
    <section id="what" className="scroll-mt-32 py-12">
      <h2 className="text-2xl font-bold text-white mb-4">What is RepoLens?</h2>
      <p className="text-github-muted leading-relaxed max-w-3xl">
        RepoLens turns any GitHub repository into a clear, visual story: lines of
        code, language breakdown, commit history, code frequency, and contributors
        — all in one place. Sign in with GitHub to analyze your private
        repositories, or paste any public repo URL to get started.
      </p>
    </section>
  )
}
```

Create `src/components/features/about/HowItWorks.tsx`:

```tsx
interface Choice {
  title: string
  body: string
}

const CHOICES: Choice[] = [
  {
    title: 'GraphQL over REST',
    body: 'Commit history is fetched in a single GitHub GraphQL call instead of 51+ REST requests, keeping analysis fast and rate-limit friendly.',
  },
  {
    title: 'Validated inputs',
    body: 'Every API input is checked with Zod schemas, so malformed requests fail early with clear messages instead of corrupting results.',
  },
  {
    title: 'Privacy first',
    body: 'No credentials or repository data are ever stored. Authentication happens directly with GitHub and stats are computed on demand.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-32 py-12">
      <h2 className="text-2xl font-bold text-white mb-4">How it works</h2>
      <p className="text-github-muted leading-relaxed max-w-3xl mb-8">
        RepoLens reads a repository through the GitHub API and computes its stats
        on the fly. Line totals come from commit additions and deletions across
        the fetched history; for very large repositories this covers recent
        history, so totals are a close estimate rather than a full file-by-file
        count.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {CHOICES.map((c) => (
          <div key={c.title} className="glass-card rounded-xl border border-github-border/50 p-5">
            <h3 className="font-semibold text-white mb-2">{c.title}</h3>
            <p className="text-sm text-github-muted">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/AboutSections.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/features/about/AboutIntro.tsx src/components/features/about/HowItWorks.tsx src/__tests__/components/AboutSections.test.tsx
git commit -m "feat(about): intro and how-it-works sections"
```

---

## Task 6: AboutContent wrapper + page with metadata

**Files:**
- Create: `src/components/features/about/AboutContent.tsx`
- Create: `src/app/(public)/about/page.tsx`
- Test: `src/__tests__/components/AboutContent.test.tsx`

- [ ] **Step 1: Write the failing test**

`AboutContent` renders `Header` (which calls `useSession`) and a dynamically imported `ParticleBackground`. The test mocks both so it can render in jsdom. Create `src/__tests__/components/AboutContent.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@/components/effects/ParticleBackground', () => ({
  default: () => null,
}))

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
  )
})

import AboutContent from '@/components/features/about/AboutContent'

describe('AboutContent', () => {
  it('renders all four section headings', () => {
    render(<AboutContent />)
    expect(screen.getByRole('heading', { name: /what is repolens/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /embeddable widgets/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^faq$/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/AboutContent.test.tsx`
Expected: FAIL — cannot resolve `@/components/features/about/AboutContent`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/features/about/AboutContent.tsx`:

```tsx
'use client'

import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SectionNav, { ABOUT_SECTIONS } from './SectionNav'
import AboutIntro from './AboutIntro'
import HowItWorks from './HowItWorks'
import WidgetGuide from './WidgetGuide'
import FaqAccordion from './FaqAccordion'

const ParticleBackground = dynamic(
  () => import('@/components/effects/ParticleBackground'),
  { ssr: false }
)

export default function AboutContent() {
  return (
    <main className="min-h-screen animated-gradient relative">
      <ParticleBackground />
      <Header />

      <div className="pt-16 relative z-10">
        <SectionNav sections={ABOUT_SECTIONS} />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <AboutIntro />
          <HowItWorks />
          <WidgetGuide />
          <FaqAccordion />
        </div>
      </div>

      <Footer />
    </main>
  )
}
```

Create `src/app/(public)/about/page.tsx`:

```tsx
import type { Metadata } from 'next'
import AboutContent from '@/components/features/about/AboutContent'

export const metadata: Metadata = {
  title: 'About & Widgets',
  description:
    'Learn what RepoLens is, how it computes repository stats, and how to embed live RepoLens widgets in your README. Includes a frequently asked questions section.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About RepoLens — How it works & embeddable widgets',
    description:
      'What RepoLens is, how it computes stats, an interactive widget guide, and FAQ.',
    url: '/about',
  },
}

export default function AboutPage() {
  return <AboutContent />
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/AboutContent.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add "src/components/features/about/AboutContent.tsx" "src/app/(public)/about/page.tsx" src/__tests__/components/AboutContent.test.tsx
git commit -m "feat(about): assemble /about page with SEO metadata"
```

---

## Task 7: Add `/about` to the sitemap

**Files:**
- Modify: `src/app/sitemap.ts`
- Test: `src/__tests__/app/sitemap.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/app/sitemap.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import sitemap from '@/app/sitemap'

describe('sitemap', () => {
  it('includes the /about page', () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls.some((u) => u.endsWith('/about'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/app/sitemap.test.ts`
Expected: FAIL — no URL ends with `/about`.

- [ ] **Step 3: Write minimal implementation**

In `src/app/sitemap.ts`, add a second entry to the returned array (after the existing root entry):

```ts
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
```

The full return becomes:

```ts
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/app/sitemap.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/__tests__/app/sitemap.test.ts
git commit -m "feat(about): list /about in sitemap"
```

---

## Task 8: Nav links in Header and Footer

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Test: `src/__tests__/components/Nav.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/Nav.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

describe('navigation links', () => {
  it('Header links to /about', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
  })

  it('Footer links to /about', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/Nav.test.tsx`
Expected: FAIL — no `About` link found in Header (and Footer).

- [ ] **Step 3: Write minimal implementation**

In `src/components/layout/Header.tsx`, insert a nav between the logo `</Link>` and the `{/* Auth */}` comment:

```tsx
          {/* Primary nav */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-github-muted hover:text-github-text transition-colors"
            >
              About
            </Link>
          </nav>

```

In `src/components/layout/Footer.tsx`, add the `Link` import at the top:

```tsx
import Link from 'next/link'
```

Then insert this link between the built-by `</a>` and the `<p>Built with Next.js …</p>`:

```tsx
          <Link href="/about" className="hover:text-github-text transition-colors">
            About &amp; Widgets
          </Link>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/Nav.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/Footer.tsx src/__tests__/components/Nav.test.tsx
git commit -m "feat(about): link to /about from header and footer"
```

---

## Task 9: Full verification

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`
Expected: PASS — all suites green, including the new `about-widgets`, `WidgetGuide`, `FaqAccordion`, `SectionNav`, `AboutSections`, `AboutContent`, `sitemap`, and `Nav` tests.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors (the `<img>` in `WidgetGuide` carries an inline `eslint-disable-next-line @next/next/no-img-element` because it points at a dynamic external SVG endpoint, which `next/image` is not suited for).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds; the route list includes `/about`.

- [ ] **Step 4: Commit any lint/build fixups (only if needed)**

```bash
git add -A
git commit -m "chore(about): lint and build fixups"
```

---

## Self-review notes

- **Spec coverage:** `/about` route + metadata (Task 6), `(public)` placement (Task 6), sticky scroll-spy sub-nav (Task 4), four sections — intro/how/widgets/faq (Tasks 2–6), interactive widget guide with live previews + theme toggle + copy snippets (Task 2), FAQ starter set (Task 3), Header/Footer nav (Task 8), sitemap/SEO (Tasks 6–7), tests for all interactive pieces (Tasks 1–8). Deep account-wide stats remain out of scope per the spec.
- **No new dependencies:** uses existing React, Tailwind classes, and `lucide-react` icons (`Copy`, `Check`, `ChevronDown`).
- **Type consistency:** `WidgetTheme`, `WidgetDef`, `embedSrc`, `linkHref`, `markdownSnippet`, `htmlSnippet`, `NavSection`, and `ABOUT_SECTIONS` are defined in Tasks 1/4 and consumed unchanged in later tasks.

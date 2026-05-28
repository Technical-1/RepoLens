# Bucket 2 — Embed Widget Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the three `/api/embed/*` routes safe and reliable: validate `owner`/`repo` (block path/query injection), stop leaking raw error strings, eliminate the ~50 sequential per-commit calls that trip the unauthenticated rate limit, and stop fabricating the commit count.

**Architecture:** Two new pure-ish modules. `src/lib/embed-validation.ts` holds a Zod schema + `validateEmbedParams`. `src/lib/embed-data.ts` holds `getCodeStatsData`, which uses only `code_frequency` + `participation` (no per-commit loop) and reports availability flags instead of inventing numbers. The three routes import these; routes validate params (returning a plain 400 before any image rendering), render, and return a generic 500 on failure. Tests target the pure modules and the route 400 paths — never the `next/og` `ImageResponse` (which needs a wasm runtime).

**Tech Stack:** TypeScript, Next.js 15 edge routes, `next/og`, Zod, Vitest (global `fetch` stub + `vi.stubEnv`).

---

### Task 1: Param validation module (fixes #4)

**Files:**
- Create: `src/lib/embed-validation.ts`
- Test: `src/__tests__/lib/embed-validation.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/__tests__/lib/embed-validation.test.ts`:

```ts
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

  it('rejects query injection characters', () => {
    expect(validateEmbedParams('facebook', 'react?foo=bar').ok).toBe(false)
    expect(validateEmbedParams('a b', 'react').ok).toBe(false)
  })

  it('rejects null / empty values', () => {
    expect(validateEmbedParams(null, 'react').ok).toBe(false)
    expect(validateEmbedParams('facebook', '').ok).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/embed-validation.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write minimal implementation** — create `src/lib/embed-validation.ts`:

```ts
import { z } from 'zod'

// GitHub logins and repo names: alphanumerics plus . _ - only.
// Blocks "/", "?", "..", whitespace → no path/query injection against the proxy.
const NAME = /^[A-Za-z0-9._-]+$/

export const EmbedParamsSchema = z.object({
  owner: z.string().min(1).max(100).regex(NAME),
  repo: z.string().min(1).max(100).regex(NAME),
})

export type EmbedValidationResult =
  | { ok: true; owner: string; repo: string }
  | { ok: false }

export function validateEmbedParams(
  owner: string | null,
  repo: string | null
): EmbedValidationResult {
  const result = EmbedParamsSchema.safeParse({ owner, repo })
  if (!result.success) return { ok: false }
  return { ok: true, owner: result.data.owner, repo: result.data.repo }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/embed-validation.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/embed-validation.ts src/__tests__/lib/embed-validation.test.ts
git commit -m "feat(embed): add owner/repo validation schema"
```

---

### Task 2: `getCodeStatsData` module — no per-commit loop, no fabricated count (fixes #3, #7)

**Files:**
- Create: `src/lib/embed-data.ts`
- Test: `src/__tests__/lib/embed-data.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/__tests__/lib/embed-data.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.stubEnv('NEXT_PUBLIC_GITHUB_PROXY_URL', 'https://proxy.test')
})

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response
}

async function load() {
  return await import('@/lib/embed-data')
}

describe('getCodeStatsData', () => {
  it('sums full code_frequency history and uses participation for commit count', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ full_name: 'facebook/react' })) // repo
      .mockResolvedValueOnce(jsonResponse({ all: [2, 3, 5] }))               // participation
      .mockResolvedValueOnce(jsonResponse([[1, 500, -200], [2, 300, -100]])) // code_frequency
    vi.stubGlobal('fetch', fetchMock)

    const { getCodeStatsData } = await load()
    const data = await getCodeStatsData('facebook', 'react')

    expect(data.fullName).toBe('facebook/react')
    expect(data.totalAdditions).toBe(800)
    expect(data.totalDeletions).toBe(300)
    expect(data.totalLines).toBe(500)
    expect(data.commitCount).toBe(10)
    expect(data.linesAvailable).toBe(true)
    expect(data.commitCountAvailable).toBe(true)
    // Exactly 3 calls — NO per-commit detail loop.
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('marks stats unavailable instead of fabricating when code_frequency fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ full_name: 'big/repo' }))   // repo
      .mockResolvedValueOnce({ ok: false, status: 202 } as Response)    // participation not ready
      .mockResolvedValueOnce({ ok: false, status: 422 } as Response)    // code_frequency too large
    vi.stubGlobal('fetch', fetchMock)

    const { getCodeStatsData } = await load()
    const data = await getCodeStatsData('big', 'repo')

    expect(data.linesAvailable).toBe(false)
    expect(data.commitCountAvailable).toBe(false)
    expect(data.totalLines).toBe(0)
    expect(data.commitCount).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(3) // still no per-commit calls
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/embed-data.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write minimal implementation** — create `src/lib/embed-data.ts`:

```ts
// Reads the proxy URL at call time so tests can stub the env per-case.
function getProxyUrl(): string {
  return process.env.NEXT_PUBLIC_GITHUB_PROXY_URL || ''
}

async function proxyFetch<T>(path: string): Promise<T> {
  const base = getProxyUrl()
  if (!base) throw new Error('Proxy not configured')
  const res = await fetch(`${base}/github${path}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'X-RepoLens-Server': 'repolens-server-request',
    },
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json() as Promise<T>
}

export interface CodeStatsData {
  fullName: string
  totalAdditions: number
  totalDeletions: number
  totalLines: number
  commitCount: number
  linesAvailable: boolean
  commitCountAvailable: boolean
}

/**
 * Gather code-stats for the embed widget using at most 3 proxy calls:
 * repo info, participation (commit count), and code_frequency (line totals).
 * No per-commit detail loop, and no fabricated values — availability is reported
 * via flags so the caller can render "—" instead of a made-up number.
 */
export async function getCodeStatsData(owner: string, repo: string): Promise<CodeStatsData> {
  const repoData = await proxyFetch<{ full_name: string }>(`/repos/${owner}/${repo}`)

  let commitCount = 0
  let commitCountAvailable = false
  try {
    const participation = await proxyFetch<{ all: number[] }>(
      `/repos/${owner}/${repo}/stats/participation`
    )
    if (participation && Array.isArray(participation.all)) {
      commitCount = participation.all.reduce((sum, week) => sum + week, 0)
      commitCountAvailable = true
    }
  } catch {
    // leave commit count unavailable
  }

  let totalAdditions = 0
  let totalDeletions = 0
  let linesAvailable = false
  try {
    const cf = await proxyFetch<number[][]>(`/repos/${owner}/${repo}/stats/code_frequency`)
    if (Array.isArray(cf) && cf.length > 0) {
      for (const week of cf) {
        totalAdditions += week[1] || 0
        totalDeletions += Math.abs(week[2] || 0)
      }
      linesAvailable = true
    }
  } catch {
    // leave line stats unavailable
  }

  return {
    fullName: repoData.full_name,
    totalAdditions,
    totalDeletions,
    totalLines: Math.max(totalAdditions - totalDeletions, 0),
    commitCount,
    linesAvailable,
    commitCountAvailable,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/embed-data.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/embed-data.ts src/__tests__/lib/embed-data.test.ts
git commit -m "feat(embed): add getCodeStatsData (no per-commit loop, no fabricated count)"
```

---

### Task 3: Wire validation + generic errors into the stats route (#4, #8)

**Files:**
- Modify: `src/app/api/embed/stats/route.tsx`
- Test: `src/__tests__/api/embed-stats.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/__tests__/api/embed-stats.test.ts` (only the 400 path — never renders an ImageResponse):

```ts
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/embed/stats/route'

function req(qs: string) {
  return new NextRequest(`http://localhost:3000/api/embed/stats?${qs}`)
}

describe('GET /api/embed/stats validation', () => {
  it('returns 400 when owner is missing', async () => {
    const res = await GET(req('repo=react'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for injection attempts in repo', async () => {
    const res = await GET(req('owner=facebook&repo=react%2Fstats'))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/api/embed-stats.test.ts`
Expected: FAIL on the injection test — current code accepts any non-empty `repo` and proceeds to fetch (then likely errors differently, not 400).

- [ ] **Step 3: Update the route.** In `src/app/api/embed/stats/route.tsx`:

Add the import after the existing `embed-utils` import:

```ts
import { validateEmbedParams } from '@/lib/embed-validation'
```

Replace this block:

```ts
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const theme = searchParams.get('theme') || 'dark'
  const hideRepoName = searchParams.get('hideRepoName') === 'true'

  if (!owner || !repo) {
    return new Response('Missing owner or repo parameter', { status: 400 })
  }
```

with:

```ts
  const theme = searchParams.get('theme') || 'dark'
  const hideRepoName = searchParams.get('hideRepoName') === 'true'

  const params = validateEmbedParams(searchParams.get('owner'), searchParams.get('repo'))
  if (!params.ok) {
    return new Response('Invalid or missing owner/repo parameter', { status: 400 })
  }
  const { owner, repo } = params
```

Then replace the final catch-block body:

```ts
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Embed stats error:', message)
    return new Response(`Failed to fetch repository data: ${message}`, { status: 500 })
  }
```

with:

```ts
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Embed stats error:', message)
    return new Response('Failed to generate stats image', { status: 500 })
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/api/embed-stats.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/embed/stats/route.tsx src/__tests__/api/embed-stats.test.ts
git commit -m "fix(embed/stats): validate params and stop leaking error details"
```

---

### Task 4: Same hardening for the languages route (#4, #8)

**Files:**
- Modify: `src/app/api/embed/languages/route.tsx`
- Test: `src/__tests__/api/embed-languages.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/__tests__/api/embed-languages.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/embed/languages/route'

function req(qs: string) {
  return new NextRequest(`http://localhost:3000/api/embed/languages?${qs}`)
}

describe('GET /api/embed/languages validation', () => {
  it('returns 400 when repo is missing', async () => {
    expect((await GET(req('owner=facebook'))).status).toBe(400)
  })
  it('returns 400 for traversal in owner', async () => {
    expect((await GET(req('owner=..%2F..&repo=react'))).status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/api/embed-languages.test.ts`
Expected: FAIL on the traversal test.

- [ ] **Step 3: Update the route.** Apply the identical edits as Task 3 Step 3 to `src/app/api/embed/languages/route.tsx`:
  1. Add `import { validateEmbedParams } from '@/lib/embed-validation'`.
  2. Replace the `owner`/`repo`/`!owner || !repo` block with the validated version (same code as Task 3).
  3. Replace the final catch `new Response(\`Failed to fetch repository data: ${message}\`, ...)` with `return new Response('Failed to generate languages image', { status: 500 })`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/api/embed-languages.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/embed/languages/route.tsx src/__tests__/api/embed-languages.test.ts
git commit -m "fix(embed/languages): validate params and stop leaking error details"
```

---

### Task 5: Rebuild the code-stats route on `getCodeStatsData` (#3, #4, #7, #8)

**Files:**
- Modify: `src/app/api/embed/code-stats/route.tsx`
- Test: `src/__tests__/api/embed-code-stats.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/__tests__/api/embed-code-stats.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/embed/code-stats/route'

function req(qs: string) {
  return new NextRequest(`http://localhost:3000/api/embed/code-stats?${qs}`)
}

describe('GET /api/embed/code-stats validation', () => {
  it('returns 400 when params missing', async () => {
    expect((await GET(req('owner=facebook'))).status).toBe(400)
  })
  it('returns 400 for query injection in repo', async () => {
    expect((await GET(req('owner=facebook&repo=react%3Ffoo'))).status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/api/embed-code-stats.test.ts`
Expected: FAIL on the injection test.

- [ ] **Step 3: Replace the route's imports and data-gathering.** In `src/app/api/embed/code-stats/route.tsx`:

Replace the top imports block (the `embed-utils` import and the local `CommitListItem`/`CommitDetail` interfaces, `GITHUB_PROXY_URL`, and `fetchFromProxy`) so the file begins:

```tsx
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import {
  getEmbedTheme,
  formatEmbedNumber,
  createErrorImageResponse,
  getErrorDetails,
  type StatItem,
} from '@/lib/embed-utils'
import { validateEmbedParams } from '@/lib/embed-validation'
import { getCodeStatsData } from '@/lib/embed-data'

export const runtime = 'edge'

const IMAGE_WIDTH = 720
const IMAGE_HEIGHT_FULL = 260
const IMAGE_HEIGHT_COMPACT = 160
```

(Delete the now-unused `CommitListItem`, `CommitDetail`, module-level `GITHUB_PROXY_URL`, and `fetchFromProxy` — they live in `embed-data.ts` now.)

- [ ] **Step 4: Replace the handler body.** Replace everything from `export async function GET` down to the line that computes `const totalLines = ...` and builds `stats`, with:

```tsx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const theme = searchParams.get('theme') || 'dark'
  const hideRepoName = searchParams.get('hideRepoName') === 'true'

  const params = validateEmbedParams(searchParams.get('owner'), searchParams.get('repo'))
  if (!params.ok) {
    return new Response('Invalid or missing owner/repo parameter', { status: 400 })
  }
  const { owner, repo } = params

  try {
    let repoFullName = `${owner}/${repo}`
    let stats: StatItem[]

    try {
      const data = await getCodeStatsData(owner, repo)
      repoFullName = data.fullName
      stats = [
        { label: 'Total Lines', value: data.linesAvailable ? formatEmbedNumber(data.totalLines) : '—', color: '#58a6ff' },
        { label: 'Lines Added', value: data.linesAvailable ? formatEmbedNumber(data.totalAdditions) : '—', color: '#3fb950' },
        { label: 'Lines Removed', value: data.linesAvailable ? formatEmbedNumber(data.totalDeletions) : '—', color: '#f85149' },
        { label: 'Commits', value: data.commitCountAvailable ? formatEmbedNumber(data.commitCount) : '—', color: '#a371f7' },
      ]
    } catch (apiError: unknown) {
      const message = apiError instanceof Error ? apiError.message : 'Unknown error'
      console.error('GitHub API error:', message)
      const { title, description } = getErrorDetails(message)
      return createErrorImageResponse(theme, title, description, IMAGE_WIDTH, IMAGE_HEIGHT_FULL)
    }

    const themeColors = getEmbedTheme(theme)
    const imageHeight = hideRepoName ? IMAGE_HEIGHT_COMPACT : IMAGE_HEIGHT_FULL
```

Leave the existing `return new ImageResponse( ... )` JSX exactly as-is (it already reads `repoFullName`, `stats`, `themeColors`, `imageHeight`, `hideRepoName`). Then replace the outer catch body with:

```tsx
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Embed code-stats error:', message)
    return new Response('Failed to generate code-stats image', { status: 500 })
  }
}
```

- [ ] **Step 5: Typecheck (catches any leftover references to deleted helpers)**

Run: `npx tsc --noEmit`
Expected: no errors. If it complains about unused `formatEmbedNumber` or a dangling `fetchFromProxy`, remove the stragglers.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/__tests__/api/embed-code-stats.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/app/api/embed/code-stats/route.tsx src/__tests__/api/embed-code-stats.test.ts
git commit -m "fix(embed/code-stats): drop per-commit loop and fabricated count, validate params (#3,#7)"
```

---

### Task 6: Full-suite verification

- [ ] **Step 1: Run everything**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 2: Typecheck + lint + production build (edge routes compile)**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: build succeeds; no type/lint errors.

---

## Self-Review

**Spec coverage:**
- #3 fabricated commit count → Task 2 (participation-based, flagged) + Task 5 (renders "—") ✓
- #4 validate owner/repo → Tasks 1, 3, 4, 5 ✓
- #7 rate-limit / 50 sequential calls → Task 2 (≤3 calls, asserted by `toHaveBeenCalledTimes(3)`) ✓
- #8 error-detail leakage → Tasks 3, 4, 5 (generic 500 bodies) ✓

**Placeholder scan:** No TBD/TODO; the only ambiguous instruction ("remove stragglers" in Task 5 Step 5) is gated by an explicit `tsc --noEmit` check. ✓

**Type consistency:** `validateEmbedParams(owner: string | null, repo: string | null)` returning `{ ok: true; owner; repo } | { ok: false }` is identical across Tasks 1, 3, 4, 5. `CodeStatsData` fields (`fullName`, `totalAdditions`, `totalDeletions`, `totalLines`, `commitCount`, `linesAvailable`, `commitCountAvailable`) defined in Task 2 are exactly the fields read in Task 5. `StatItem` is imported from `embed-utils` in both the module and route. ✓

**Test-env note:** Route tests only exercise the 400 path (plain `Response`); the `ImageResponse` success path is covered indirectly through `getCodeStatsData` unit tests, avoiding the `next/og` wasm dependency in jsdom.

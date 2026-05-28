# Bucket 1 — Core Analysis & Metrics Accuracy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "total lines of code" accurate (full `code_frequency` history with an honest estimate fallback), fix the proxy total-commit-count that returns 1, and normalize the repo cache key so URL variants share an entry.

**Architecture:** Add three small **pure** helpers to `src/lib/github.ts` (`parseLastPageFromLink`, `sumCodeFrequency`, `canonicalRepoKey`), then wire them into `getTotalCommitCount`, `analyzeRepo`, and `src/app/api/repo/route.ts`. A new `totalLinesIsEstimated` flag flows through the `FullRepoAnalysis` type into the `StatsOverview` UI so estimates are labeled. Pure helpers are unit-tested directly; the route is tested with the existing `vi.mock` pattern but keeping the real helpers via `importOriginal`.

**Tech Stack:** TypeScript, Next.js 15 App Router, Vitest (globals, jsdom), `@octokit/rest`, GitHub REST/GraphQL.

---

### Task 1: Pure helper — `parseLastPageFromLink` (fixes #5 root cause)

**Files:**
- Modify: `src/lib/github.ts`
- Test: `src/__tests__/lib/github.test.ts`

- [ ] **Step 1: Write the failing test** — append to `src/__tests__/lib/github.test.ts`:

```ts
import { parseLastPageFromLink } from '@/lib/github'

describe('parseLastPageFromLink', () => {
  it('extracts the last page number from a GitHub Link header', () => {
    const link =
      '<https://api.github.com/repositories/1/commits?per_page=1&page=2>; rel="next", ' +
      '<https://api.github.com/repositories/1/commits?per_page=1&page=4821>; rel="last"'
    expect(parseLastPageFromLink(link)).toBe(4821)
  })

  it('returns null when there is no rel="last" segment', () => {
    expect(parseLastPageFromLink('<https://api.github.com/x?page=2>; rel="next"')).toBeNull()
  })

  it('returns null for empty / missing headers', () => {
    expect(parseLastPageFromLink(null)).toBeNull()
    expect(parseLastPageFromLink(undefined)).toBeNull()
    expect(parseLastPageFromLink('')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/github.test.ts -t parseLastPageFromLink`
Expected: FAIL — `parseLastPageFromLink is not a function` / import error.

- [ ] **Step 3: Write minimal implementation** — add near the top of `src/lib/github.ts` (after the imports, before `parseRepoUrl`):

```ts
/**
 * Parse the `page=N>; rel="last"` value out of a GitHub Link header.
 * Returns null when the header is absent or has no last-page segment.
 */
export function parseLastPageFromLink(linkHeader: string | null | undefined): number | null {
  if (!linkHeader) return null
  const match = linkHeader.match(/[?&]page=(\d+)>;\s*rel="last"/)
  return match ? parseInt(match[1], 10) : null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/github.test.ts -t parseLastPageFromLink`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts src/__tests__/lib/github.test.ts
git commit -m "feat(github): add parseLastPageFromLink helper for commit counts"
```

---

### Task 2: Use `parseLastPageFromLink` in `getTotalCommitCount` (fixes #5)

**Files:**
- Modify: `src/lib/github.ts` (the existing `getTotalCommitCount`, ~lines 420-460)

This unifies the proxy and direct branches and removes the `result.data.length || 0` (≤1) bug. The proxy branch now reads the forwarded `link` header (already returned by `fetchRESTViaProxy`).

- [ ] **Step 1: Replace the whole `getTotalCommitCount` function body** with:

```ts
async function getTotalCommitCount(
  octokit: Octokit,
  owner: string,
  repo: string,
  useProxy: boolean = false
): Promise<number> {
  try {
    let linkHeader: string | null | undefined = null
    let dataLength = 0

    if (useProxy && GITHUB_PROXY_URL) {
      const result = await fetchRESTViaProxy<unknown[]>(
        `/repos/${owner}/${repo}/commits?per_page=1`
      )
      linkHeader = result.headers.get('link')
      dataLength = Array.isArray(result.data) ? result.data.length : 0
    } else {
      const response = await octokit.repos.listCommits({ owner, repo, per_page: 1 })
      linkHeader = response.headers.link
      dataLength = response.data.length
    }

    const lastPage = parseLastPageFromLink(linkHeader)
    if (lastPage !== null) return lastPage

    // No pagination header → small repo, the single returned commit is the count basis
    return dataLength
  } catch (error) {
    console.warn('Could not get total commit count:', error)
    return 0
  }
}
```

- [ ] **Step 2: Verify the suite still compiles & passes**

Run: `npx vitest run src/__tests__/lib/github.test.ts`
Expected: PASS (all existing + Task 1 tests).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/github.ts
git commit -m "fix(github): parse Link header for proxy total commit count (was capped at 1)"
```

---

### Task 3: Pure helper — `sumCodeFrequency` (basis for #2)

**Files:**
- Modify: `src/lib/github.ts`
- Test: `src/__tests__/lib/github.test.ts`

- [ ] **Step 1: Write the failing test** — append to `src/__tests__/lib/github.test.ts`:

```ts
import { sumCodeFrequency } from '@/lib/github'
import type { CodeFrequency } from '@/types'

describe('sumCodeFrequency', () => {
  it('sums additions and deletions across all weeks', () => {
    const weeks: CodeFrequency[] = [
      { week: 1, additions: 500, deletions: 200 },
      { week: 2, additions: 300, deletions: 100 },
    ]
    expect(sumCodeFrequency(weeks)).toEqual({ additions: 800, deletions: 300, net: 500 })
  })

  it('clamps net to zero when deletions exceed additions', () => {
    const weeks: CodeFrequency[] = [{ week: 1, additions: 10, deletions: 50 }]
    expect(sumCodeFrequency(weeks)).toEqual({ additions: 10, deletions: 50, net: 0 })
  })

  it('returns zeros for an empty array', () => {
    expect(sumCodeFrequency([])).toEqual({ additions: 0, deletions: 0, net: 0 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/github.test.ts -t sumCodeFrequency`
Expected: FAIL — `sumCodeFrequency is not a function`.

- [ ] **Step 3: Write minimal implementation** — add to `src/lib/github.ts` just below `calculateCodeFrequencyFromCommits`:

```ts
/**
 * Sum additions/deletions across the full code_frequency history.
 * `net` (additions − deletions, clamped ≥ 0) approximates current lines of code.
 * Note: code_frequency already stores deletions as positive values.
 */
export function sumCodeFrequency(codeFrequency: CodeFrequency[]): {
  additions: number
  deletions: number
  net: number
} {
  let additions = 0
  let deletions = 0
  for (const week of codeFrequency) {
    additions += week.additions
    deletions += week.deletions
  }
  return { additions, deletions, net: Math.max(additions - deletions, 0) }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/github.test.ts -t sumCodeFrequency`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts src/__tests__/lib/github.test.ts
git commit -m "feat(github): add sumCodeFrequency helper for full-history line totals"
```

---

### Task 4: Add `totalLinesIsEstimated` to the analysis type

**Files:**
- Modify: `src/types/index.ts:51-65` (the `FullRepoAnalysis` interface)
- Modify: `src/__tests__/fixtures.ts` (the `mockRepoAnalysis` object)
- Modify: `src/__tests__/api/repo.test.ts` (the inline analysis literal, ~lines 52-66)

- [ ] **Step 1: Add the field to `FullRepoAnalysis`** — in `src/types/index.ts`, immediately after the `totalLines: number` line (line 54):

```ts
  totalLines: number
  /** true when totalLines is a recent-commit estimate (code_frequency unavailable) */
  totalLinesIsEstimated: boolean
```

- [ ] **Step 2: Update the fixture** — in `src/__tests__/fixtures.ts`, after `totalLines: 250000,` (line 25) add:

```ts
  totalLines: 250000,
  totalLinesIsEstimated: false,
```

- [ ] **Step 3: Update the inline literal in the route test** — in `src/__tests__/api/repo.test.ts`, inside the `analyzeRepo` mock object, after `totalLines: 100,` add:

```ts
      totalLines: 100,
      totalLinesIsEstimated: false,
```

- [ ] **Step 4: Verify the suite compiles**

Run: `npx tsc --noEmit`
Expected: errors ONLY in `src/lib/github.ts` `analyzeRepo` (it does not yet set `totalLinesIsEstimated`). That is expected and fixed in Task 5. Confirm no other files error.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/__tests__/fixtures.ts src/__tests__/api/repo.test.ts
git commit -m "feat(types): add totalLinesIsEstimated flag to FullRepoAnalysis"
```

---

### Task 5: Compute totals from full history in `analyzeRepo` (fixes #2)

**Files:**
- Modify: `src/lib/github.ts` (the totals block in `analyzeRepo`, ~lines 715-749)

Replaces the recent-commit-only `totalAdditions`/`totalDeletions`/`totalLines` math. When `code_frequency` is real (present and not the calculated fallback), sum the full history for all three line metrics so the site matches the embed widget; otherwise fall back to the recent-commit sum and flag it estimated.

- [ ] **Step 1: Replace the totals block.** Find this existing code in `analyzeRepo`:

```ts
    // Calculate totals from commits
    const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0)
    const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0)

    // Estimate total lines (this is an approximation based on additions - deletions from recent commits)
    // Note: GitHub API doesn't provide total LOC, so this is based on available data
    const totalLines = totalAdditions - totalDeletions > 0 ? totalAdditions - totalDeletions : totalAdditions
```

Replace it with:

```ts
    // Prefer full code_frequency history (matches the embed widget); fall back to
    // recent commits and flag the result as an estimate.
    const hasFullHistory =
      codeFrequencyResult.data.length > 0 && !codeFrequencyResult.isCalculated

    let totalAdditions: number
    let totalDeletions: number
    let totalLines: number
    let totalLinesIsEstimated: boolean

    if (hasFullHistory) {
      const summed = sumCodeFrequency(codeFrequencyResult.data)
      totalAdditions = summed.additions
      totalDeletions = summed.deletions
      totalLines = summed.net
      totalLinesIsEstimated = false
    } else {
      totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0)
      totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0)
      totalLines = Math.max(totalAdditions - totalDeletions, 0) || totalAdditions
      totalLinesIsEstimated = true
    }
```

- [ ] **Step 2: Add the new field to the returned object.** In the `return { ... }` of `analyzeRepo`, add `totalLinesIsEstimated,` next to `totalLines,`:

```ts
      totalLines,
      totalLinesIsEstimated,
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (the Task 4 error is now resolved).

- [ ] **Step 4: Run the full lib + api suite**

Run: `npx vitest run src/__tests__/lib src/__tests__/api`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts
git commit -m "fix(github): compute total lines from full code_frequency history (#2)"
```

---

### Task 6: Label estimated line stats in `StatsOverview`

**Files:**
- Modify: `src/components/features/stats/StatsOverview.tsx:25-77`
- Test: `src/__tests__/components/StatsOverview.test.tsx`

- [ ] **Step 1: Write the failing test** — append to `src/__tests__/components/StatsOverview.test.tsx` (inside the `describe`):

```ts
  it('labels line stats "All time" when not estimated', () => {
    render(<StatsOverview data={mockRepoAnalysis} />)
    expect(screen.getAllByText('All time').length).toBeGreaterThan(0)
  })

  it('labels line stats as estimated when totalLinesIsEstimated is true', () => {
    const estimated = { ...mockRepoAnalysis, totalLinesIsEstimated: true }
    render(<StatsOverview data={estimated} />)
    expect(screen.getAllByText(/Est\. from \d+ commits/).length).toBeGreaterThan(0)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/StatsOverview.test.tsx -t estimated`
Expected: FAIL — current subtext is the hardcoded `Last N commits` string.

- [ ] **Step 3: Update the component.** In `StatsOverview.tsx`, replace this line inside `useMemo`:

```ts
    const commitCountText = `Last ${data.commits.length} commits`
```

with:

```ts
    const lineSubtext = data.totalLinesIsEstimated
      ? `Est. from ${data.commits.length} commits`
      : 'All time'
```

Then change the `subtext` of the three line cards (`Total Lines`, `Lines Added`, `Lines Removed`) from `commitCountText` to `lineSubtext`. Finally update the `useMemo` dependency array to swap `data.commits.length` context — replace the array with:

```ts
  }, [data.totalLines, data.totalAdditions, data.totalDeletions, data.totalCommits, data.repo.stars, data.repo.forks, data.commits.length, data.totalLinesIsEstimated])
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/StatsOverview.test.tsx`
Expected: PASS (all existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/features/stats/StatsOverview.tsx src/__tests__/components/StatsOverview.test.tsx
git commit -m "feat(stats): label line metrics as all-time vs estimated"
```

---

### Task 7: Canonical cache key — `canonicalRepoKey` (fixes #6)

**Files:**
- Modify: `src/lib/github.ts`
- Test: `src/__tests__/lib/github.test.ts`

- [ ] **Step 1: Write the failing test** — append to `src/__tests__/lib/github.test.ts`:

```ts
import { canonicalRepoKey } from '@/lib/github'

describe('canonicalRepoKey', () => {
  it('maps every URL variant of the same repo to one key', () => {
    const expected = 'facebook/react'
    expect(canonicalRepoKey('facebook/react')).toBe(expected)
    expect(canonicalRepoKey('github.com/facebook/react')).toBe(expected)
    expect(canonicalRepoKey('https://github.com/Facebook/React')).toBe(expected)
    expect(canonicalRepoKey('https://github.com/facebook/react.git')).toBe(expected)
  })

  it('falls back to a normalized raw string for unparseable input', () => {
    expect(canonicalRepoKey('  Not-A-Repo  ')).toBe('not-a-repo')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/github.test.ts -t canonicalRepoKey`
Expected: FAIL — `canonicalRepoKey is not a function`.

- [ ] **Step 3: Write minimal implementation** — add to `src/lib/github.ts` immediately after `parseRepoUrl`:

```ts
/**
 * Produce a stable cache key for a repository regardless of URL form.
 * Falls back to a normalized raw string when the input is not a valid repo URL.
 */
export function canonicalRepoKey(repoUrl: string): string {
  const parsed = parseRepoUrl(repoUrl)
  if (!parsed) return repoUrl.toLowerCase().trim()
  return `${parsed.owner}/${parsed.repo}`.toLowerCase()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/github.test.ts -t canonicalRepoKey`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts src/__tests__/lib/github.test.ts
git commit -m "feat(github): add canonicalRepoKey for stable cache keys"
```

---

### Task 8: Use `canonicalRepoKey` in the repo route (fixes #6)

**Files:**
- Modify: `src/app/api/repo/route.ts:24-48`
- Modify: `src/__tests__/api/repo.test.ts` (the `vi.mock('@/lib/github', ...)` block, lines 9-11)

- [ ] **Step 1: Keep the real helper in the route test mock.** Replace the existing mock in `src/__tests__/api/repo.test.ts`:

```ts
vi.mock('@/lib/github', () => ({
  analyzeRepo: vi.fn(),
}))
```

with a partial mock that preserves the real `canonicalRepoKey`/`parseRepoUrl`:

```ts
vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>()
  return { ...actual, analyzeRepo: vi.fn() }
})
```

- [ ] **Step 2: Write the failing test** — append a test to `src/__tests__/api/repo.test.ts` proving variants share a cache entry:

```ts
  it('uses a canonical cache key for url variants', async () => {
    const { repoCache } = await import('@/lib/cache')
    vi.mocked(analyzeRepo).mockResolvedValue({
      repo: {} as never, languages: {}, totalLines: 1, totalLinesIsEstimated: false,
      languagePercentages: [], commits: [], totalCommits: 0, codeFrequency: [],
      codeFrequencyIsCalculated: false, contributors: [], totalAdditions: 0,
      totalDeletions: 0, isPrivate: false, requiresAuth: false,
    })

    await POST(makeRequest({ repoUrl: 'https://github.com/Facebook/React' }))
    expect(vi.mocked(repoCache.set)).toHaveBeenCalledWith('facebook/react', expect.anything())
  })
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/__tests__/api/repo.test.ts -t "canonical cache key"`
Expected: FAIL — `set` is called with the raw lowercased URL, not `facebook/react`.

- [ ] **Step 4: Update the route.** In `src/app/api/repo/route.ts`:

Add to the import on line 4:

```ts
import { analyzeRepo, canonicalRepoKey } from '@/lib/github'
```

Replace the two `const cacheKey = repoUrl.toLowerCase().trim()` occurrences (lines 26 and 47) both with:

```ts
      const cacheKey = canonicalRepoKey(repoUrl)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/api/repo.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/repo/route.ts src/__tests__/api/repo.test.ts
git commit -m "fix(api): canonicalize repo cache key so url variants share entries (#6)"
```

---

### Task 9: Full-suite verification

- [ ] **Step 1: Run everything**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

---

## Self-Review

**Spec coverage:**
- #2 total lines accuracy → Tasks 3, 4, 5, 6 ✓
- #5 proxy commit count → Tasks 1, 2 ✓
- #6 cache key normalization → Tasks 7, 8 ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step shows complete code. ✓

**Type consistency:** `totalLinesIsEstimated: boolean` defined in Task 4 (`types/index.ts`), set in Task 5 (`analyzeRepo`), consumed in Task 6 (`StatsOverview`), and present in test literals (Tasks 4, 8). `sumCodeFrequency` return shape `{ additions, deletions, net }` is identical in Task 3 (def + test) and Task 5 (use). `canonicalRepoKey(repoUrl: string): string` matches between Task 7 and Task 8. ✓

# Full-history lines-of-code stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the misleading "Est. from 100 commits" line-stats label by feeding the already-fetched deepened commit history (up to 2,500 commits) into the headline totals, and label honestly — "All time" when coverage is complete, the real covered-commit count otherwise.

**Architecture:** On the `code_frequency`-unavailable fallback path, `analyzeRepo` already pages up to `MAX_FALLBACK_COMMITS` (2,500) commits via GraphQL to deepen the chart, but computes headline totals from the original 100-commit list. We feed the deepened data forward into the totals, track how many commits the estimate spans, and flip the estimate flag off when that span covers the whole repo. The "covers full history" decision is extracted into a pure, unit-tested helper.

**Tech Stack:** TypeScript, Next.js, Octokit (GitHub REST + GraphQL), Vitest, React Testing Library.

---

## File Structure

- `src/lib/github.ts` — add pure helper `estimateCoversFullHistory`; rework the estimate branch of `analyzeRepo` to use deepened data and the new flag/count.
- `src/types/index.ts` — add `totalLinesCommitsCovered` to `FullRepoAnalysis`.
- `src/components/features/stats/StatsOverview.tsx` — use the new field in the subtext.
- `src/__tests__/lib/github.test.ts` — unit tests for `estimateCoversFullHistory`.
- `src/__tests__/fixtures.ts` — add the new required field to the mock.
- `src/__tests__/components/StatsOverview.test.tsx` — assert subtext uses the covered count.

---

### Task 1: Pure helper `estimateCoversFullHistory`

**Files:**
- Modify: `src/lib/github.ts` (add exported function near `sumCodeFrequency`, ~line 608)
- Test: `src/__tests__/lib/github.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/__tests__/lib/github.test.ts`. First extend the import on line 6 area to include the new symbol:

```ts
import { estimateCoversFullHistory } from '@/lib/github'
```

Then append this describe block at the end of the file:

```ts
describe('estimateCoversFullHistory', () => {
  it('is true when commits covered reaches the total count', () => {
    expect(estimateCoversFullHistory(2500, 2500)).toBe(true)
    expect(estimateCoversFullHistory(2500, 2000)).toBe(true) // covered exceeds (defensive)
  })

  it('is false when more history exists beyond what we covered', () => {
    expect(estimateCoversFullHistory(2500, 50000)).toBe(false)
    expect(estimateCoversFullHistory(100, 200)).toBe(false)
  })

  it('is false when the total count is unknown (zero)', () => {
    expect(estimateCoversFullHistory(2500, 0)).toBe(false)
    expect(estimateCoversFullHistory(0, 0)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/github.test.ts -t "estimateCoversFullHistory"`
Expected: FAIL — `estimateCoversFullHistory is not a function` / import resolves to undefined.

- [ ] **Step 3: Write minimal implementation**

In `src/lib/github.ts`, immediately after the `sumCodeFrequency` function (before `interface CodeFrequencyResult`, ~line 609), add:

```ts
/**
 * Whether a commit-derived estimate spans the repo's entire history.
 * True only when we have a known total and covered at least that many commits;
 * a zero/unknown total is treated as "not full" so we stay honest and labeled.
 */
export function estimateCoversFullHistory(
  commitsCovered: number,
  totalCount: number
): boolean {
  return totalCount > 0 && commitsCovered >= totalCount
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/github.test.ts -t "estimateCoversFullHistory"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts src/__tests__/lib/github.test.ts
git commit -m "feat(stats): add estimateCoversFullHistory helper

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

### Task 2: Add `totalLinesCommitsCovered` to the type and fixture

**Files:**
- Modify: `src/types/index.ts:51-67` (`FullRepoAnalysis`)
- Modify: `src/__tests__/fixtures.ts`

This task makes the type change and updates the fixture together so the project still compiles. No new test — it is exercised by Task 4.

- [ ] **Step 1: Add the field to the type**

In `src/types/index.ts`, inside `FullRepoAnalysis`, immediately after the `totalLinesIsEstimated` line (line 56), add:

```ts
  /** Number of commits the totalLines estimate is based on (meaningful only when totalLinesIsEstimated). */
  totalLinesCommitsCovered: number
```

- [ ] **Step 2: Add the field to the fixture**

In `src/__tests__/fixtures.ts`, immediately after the `totalLinesIsEstimated: false,` line (line 26), add:

```ts
  totalLinesCommitsCovered: 100,
```

- [ ] **Step 3: Verify the type compiles**

Run: `npx tsc --noEmit`
Expected: PASS — no errors. (If `analyzeRepo` errors here because its return object lacks the field, that is fixed in Task 3; it is acceptable for `tsc` to flag `src/lib/github.ts` at this point — proceed to Task 3 and re-run there. The fixture and type must agree, which is what this step confirms.)

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/__tests__/fixtures.ts
git commit -m "feat(stats): add totalLinesCommitsCovered to FullRepoAnalysis

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

### Task 3: Feed deepened history into `analyzeRepo` totals

**Files:**
- Modify: `src/lib/github.ts:805-862` (the deepen block, the totals block, and the return object inside `analyzeRepo`)

This is network-bound integration code not covered by unit tests directly; the unit-testable decision lives in `estimateCoversFullHistory` (Task 1). Verification here is typecheck + lint + full suite + manual smoke (Task 5).

- [ ] **Step 1: Track covered-commit count in the deepen block**

In `src/lib/github.ts`, replace the existing deepen block (currently lines 805-813):

```ts
    if (codeFrequencyResult.isCalculated && (accessToken || GITHUB_PROXY_URL)) {
      const deep = await getCommitsGraphQL(accessToken, owner, repo, MAX_FALLBACK_COMMITS)
      if (deep.commits.length > commits.length) {
        codeFrequencyResult = {
          data: calculateCodeFrequencyFromCommits(deep.commits),
          isCalculated: true,
        }
      }
    }
```

with:

```ts
    // How many commits the estimate spans. Starts at the display list (100) and
    // grows when we deepen via paginated GraphQL on the fallback path.
    let estimateCommitsCovered = commits.length

    if (codeFrequencyResult.isCalculated && (accessToken || GITHUB_PROXY_URL)) {
      const deep = await getCommitsGraphQL(accessToken, owner, repo, MAX_FALLBACK_COMMITS)
      if (deep.commits.length > commits.length) {
        codeFrequencyResult = {
          data: calculateCodeFrequencyFromCommits(deep.commits),
          isCalculated: true,
        }
        estimateCommitsCovered = deep.commits.length
      }
    }
```

- [ ] **Step 2: Use deepened data and the helper in the totals block**

Replace the totals block (currently lines 826-847):

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
      totalLines = Math.max(totalAdditions - totalDeletions, 0)
      totalLinesIsEstimated = true
    }
```

with:

```ts
    // Prefer full code_frequency history (matches the embed widget); fall back to
    // the deepened commit-derived estimate and flag it unless it covers everything.
    const hasFullHistory =
      codeFrequencyResult.data.length > 0 && !codeFrequencyResult.isCalculated

    let totalAdditions: number
    let totalDeletions: number
    let totalLines: number
    let totalLinesIsEstimated: boolean
    let totalLinesCommitsCovered = 0

    if (hasFullHistory) {
      const summed = sumCodeFrequency(codeFrequencyResult.data)
      totalAdditions = summed.additions
      totalDeletions = summed.deletions
      totalLines = summed.net
      totalLinesIsEstimated = false
    } else {
      // Sum the deepened code_frequency we already fetched (up to 2,500 commits),
      // not just the 100 commits in the display list. Fall back to the display
      // list only if that calculated data is empty.
      if (codeFrequencyResult.data.length > 0) {
        const summed = sumCodeFrequency(codeFrequencyResult.data)
        totalAdditions = summed.additions
        totalDeletions = summed.deletions
        totalLines = summed.net
      } else {
        totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0)
        totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0)
        totalLines = Math.max(totalAdditions - totalDeletions, 0)
      }
      totalLinesCommitsCovered = estimateCommitsCovered
      // If the estimate now spans the whole repo, it is no longer an estimate.
      totalLinesIsEstimated = !estimateCoversFullHistory(estimateCommitsCovered, totalCommits)
    }
```

- [ ] **Step 3: Return the new field**

In the `return { ... }` object of `analyzeRepo` (currently ~line 849-864), add `totalLinesCommitsCovered,` immediately after the `totalLinesIsEstimated,` line:

```ts
      totalLines,
      totalLinesIsEstimated,
      totalLinesCommitsCovered,
      languagePercentages,
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS — no type errors, no lint errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts
git commit -m "fix(stats): compute line totals from deepened history, not 100 commits

On the code_frequency-unavailable fallback, analyzeRepo already pages up
to 2,500 commits to deepen the chart but summed only the 100-commit
display list for the headline totals. Sum the deepened data instead, and
drop the estimate flag entirely when that span covers the full history.

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

### Task 4: Honest subtext in `StatsOverview`

**Files:**
- Modify: `src/components/features/stats/StatsOverview.tsx:26-28`
- Test: `src/__tests__/components/StatsOverview.test.tsx`

- [ ] **Step 1: Write the failing test**

In `src/__tests__/components/StatsOverview.test.tsx`, replace the existing estimated test (lines 74-78):

```ts
  it('labels line stats as estimated when totalLinesIsEstimated is true', () => {
    const estimated = { ...mockRepoAnalysis, totalLinesIsEstimated: true }
    render(<StatsOverview data={estimated} />)
    expect(screen.getAllByText(/Est\. from \d+ commits/).length).toBeGreaterThan(0)
  })
```

with:

```ts
  it('labels line stats with the covered-commit count when estimated', () => {
    const estimated = {
      ...mockRepoAnalysis,
      totalLinesIsEstimated: true,
      totalLinesCommitsCovered: 2500,
    }
    render(<StatsOverview data={estimated} />)
    // 2500 -> "2.5K" via formatNumber's compact form
    expect(screen.getAllByText('Est. from 2.5K commits').length).toBeGreaterThan(0)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/StatsOverview.test.tsx -t "covered-commit count"`
Expected: FAIL — current code renders `Est. from 2 commits` (from `data.commits.length`), not `Est. from 2.5K commits`.

- [ ] **Step 3: Update the subtext**

In `src/components/features/stats/StatsOverview.tsx`, replace lines 26-28:

```ts
    const lineSubtext = data.totalLinesIsEstimated
      ? `Est. from ${data.commits.length} commits`
      : 'All time'
```

with:

```ts
    const lineSubtext = data.totalLinesIsEstimated
      ? `Est. from ${formatNumber(data.totalLinesCommitsCovered, true)} commits`
      : 'All time'
```

Then update the `useMemo` dependency array on line 79: replace `data.commits.length` with `data.totalLinesCommitsCovered`:

```ts
  }, [data.totalLines, data.totalAdditions, data.totalDeletions, data.totalCommits, data.repo.stars, data.repo.forks, data.totalLinesCommitsCovered, data.totalLinesIsEstimated])
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/StatsOverview.test.tsx`
Expected: PASS — all StatsOverview tests pass (including the unchanged "All time" test).

- [ ] **Step 5: Commit**

```bash
git add src/components/features/stats/StatsOverview.tsx src/__tests__/components/StatsOverview.test.tsx
git commit -m "fix(stats): show real covered-commit count in line-stats subtext

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test -- --run`
Expected: PASS — all tests green, no regressions.

- [ ] **Step 2: Typecheck, lint, and build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: PASS — clean typecheck, no lint errors, successful production build.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`, open the app, and analyze:
- A normal repo (e.g. `facebook/react` if `code_frequency` resolves) → line stats read "All time".
- A repo that previously showed "Est. from 100 commits" → now reads either "All time" (if ≤2,500 commits) or "Est. from <N>K commits" with N reflecting actual coverage.

Expected: No "Est. from 100 commits" for repos under the 2,500 cap; honest counts otherwise.
```

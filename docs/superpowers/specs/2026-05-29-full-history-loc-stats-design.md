# Full-history lines-of-code stats — design

**Date:** 2026-05-29
**Author:** Jacob Kanfer
**Status:** Approved (design)

## Problem

The repo stats page shows "Total Lines / Lines Added / Lines Removed" with a
subtext that sometimes reads **"Est. from 100 commits."** That estimate is both
inaccurate and misleading: it implies the number is derived from only the 100
most recent commits, when in fact the code already fetches far more history but
throws it away for the headline numbers.

### Root cause

In `analyzeRepo` (`src/lib/github.ts`):

- For most repos, GitHub's `/stats/code_frequency` endpoint returns weekly
  additions/deletions across the **entire history**. `sumCodeFrequency` turns
  that into true all-time totals and the subtext reads "All time". This path is
  correct and unchanged.
- The estimate path triggers only when `code_frequency` is unavailable:
  - HTTP 422 — repos with >10k commits (GitHub permanently refuses this stat),
  - HTTP 202 — stats still computing (transient),
  - unauthenticated requests with no proxy configured.
- On that fallback path the code *already* pages up to `MAX_FALLBACK_COMMITS`
  (2,500) commits via GraphQL to deepen the **chart** (`github.ts:805-813`), but
  the headline totals are still computed from the original **100-commit** list
  (`github.ts:842-846`). The deeper data we already paid to fetch is discarded
  for the numbers, and the subtext hardcodes `data.commits.length` (100).

## Decision

Scope is the LOC accuracy fix only. For huge repos where GitHub won't serve
full stats, **use what we already fetch** (up to 2,500 commits) rather than
paging the entire history — no new API cost, large accuracy gain, ships fast.

## Change

Three files, no additional GitHub API calls.

### 1. `src/lib/github.ts` — `analyzeRepo`

During the existing deepen step, track:

- `estimateCommitsCovered: number` — how many commits the estimate spans
  (starts at `commits.length`, becomes `deep.commits.length` after deepening).
- `estimateCoversFullHistory: boolean` — true when we reached the end of history
  before hitting the 2,500 cap, i.e. `deep.totalCount > 0 &&
  deep.commits.length >= deep.totalCount`.

Extract that boolean decision into a tiny pure helper so it is unit-testable:

```ts
export function estimateCoversFullHistory(
  commitsCovered: number,
  totalCount: number
): boolean {
  return totalCount > 0 && commitsCovered >= totalCount
}
```

In the estimate branch (the current `else` at ~842), compute totals by summing
the **deepened** `codeFrequencyResult.data` via the existing `sumCodeFrequency`
(falling back to the 100-commit reduce only if that data is empty). When
`estimateCoversFullHistory` is true, set `totalLinesIsEstimated = false` — the
estimate now covers everything, so it is no longer an estimate.

### 2. `src/types/index.ts`

Add to `FullRepoAnalysis`:

```ts
/** Number of commits the totalLines estimate is based on (meaningful only when totalLinesIsEstimated). */
totalLinesCommitsCovered: number
```

### 3. `src/components/features/stats/StatsOverview.tsx`

Use the new field in the subtext so it reflects reality:

```ts
const lineSubtext = data.totalLinesIsEstimated
  ? `Est. from ${formatNumber(data.totalLinesCommitsCovered, true)} commits`
  : 'All time'
```

## User-visible result

| Repo | Before | After |
|---|---|---|
| Normal (`code_frequency` works) | "All time" | unchanged |
| ≤2,500 commits, big-repo fallback | "Est. from 100 commits" | **"All time"**, true number (every commit walked) |
| >2,500 commits | "Est. from 100 commits" (wildly low) | "Est. from 2.5K commits" (25× more accurate, honest) |

For the majority of repos that hit the fallback, the caveat disappears entirely
and the number becomes exact. Only genuinely giant repos keep an honest,
much-tighter estimate.

## Testing

- `src/__tests__/lib/github.test.ts` — unit-test `estimateCoversFullHistory`
  across boundaries (under cap → true, at cap with more history → false,
  zero totalCount → false).
- `src/__tests__/components/StatsOverview.test.tsx` — assert the subtext renders
  the covered-commit count when estimated and "All time" when not.

## Out of scope (acknowledged)

- GraphQL per-commit `additions` can double-count merge commits — pre-existing
  behavior, unchanged here.
- Truly massive repos (>2,500 commits) remain estimates by the explicit
  "use what we already fetch" decision.
- HTTP 202 still-computing retry/polling is not addressed (the chart already
  polls client-side).

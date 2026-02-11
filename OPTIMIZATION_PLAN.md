# RepoLens Optimization Plan

> Comprehensive audit findings organized into phases for incremental implementation.
> Each task is designed to be executed independently as a Claude Code task.

---

## Phase 1: Critical — Bundle Size & Production Readiness

These have the highest impact on user experience and should be done first.

### 1.1 Lazy-Load Recharts with `next/dynamic`

- **Impact:** ~200KB bundle reduction
- **Files:** `src/components/features/stats/CodeFrequencyChart.tsx`
- **Task:** Wrap the chart in a `next/dynamic` import with `{ ssr: false }` and a loading skeleton fallback. Extract the chart rendering into a separate inner component if needed.

### 1.2 Remove Barrel Export Anti-Pattern

- **Impact:** 20-50KB better tree-shaking
- **Files:**
  - `src/components/index.ts` (remove or deprecate)
  - `src/app/(public)/page.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/repo/[owner]/[name]/RepoPageClient.tsx`
- **Task:** Replace all imports from `@/components` with direct imports from each component's file (e.g., `@/components/layout/Header`). Then delete `src/components/index.ts`.

### 1.3 Lazy-Load ParticleBackground

- **Impact:** Faster initial paint, reduced main thread work
- **Files:** All files that import `ParticleBackground`
- **Task:** Use `next/dynamic` with `{ ssr: false }` to lazy-load the canvas-based particle system.

### 1.4 Lazy-Load EmbedShare Modal

- **Impact:** Only loaded when user clicks "Embed"
- **Files:** `src/components/features/stats/StatsOverview.tsx` (or wherever EmbedShare is rendered)
- **Task:** Dynamically import `EmbedShare` since it's only shown on user interaction.

### 1.5 Add Error Boundaries

- **Impact:** Prevents full-app white-screen crashes
- **Files:**
  - Create `src/app/error.tsx` (Next.js App Router error boundary)
  - Create `src/app/repo/[owner]/[name]/error.tsx`
  - Create `src/app/dashboard/error.tsx`
- **Task:** Implement Next.js file-convention error boundaries for each route segment. Include a user-friendly fallback UI with a "Try Again" button.

### 1.6 Remove Console Logs from Production Code

- **Impact:** Cleaner production output, no info leakage
- **Files (30+ occurrences):**
  - `src/lib/github.ts` (lines: 262, 288, 353, 357, 395, 414, 460, 492, 584, 592, 814)
  - `src/app/api/repo/route.ts` (lines: 30, 50, 61)
  - `src/app/api/repo/stats/route.ts` (line: 113)
  - `src/app/api/user/repos/route.ts` (line: 29)
  - `src/app/api/embed/stats/route.tsx` (lines: 61, 166)
  - `src/app/api/embed/code-stats/route.tsx` (lines: 133, 239)
  - `src/app/api/embed/languages/route.tsx` (lines: 71, 200)
- **Task:** Either remove all console statements or add `compiler: { removeConsole: process.env.NODE_ENV === 'production' }` to `next.config.ts`. For error logging that should remain, consider a lightweight logger utility that no-ops in production.

---

## Phase 2: High Priority — Performance & React Optimization

### 2.1 Add `useMemo` to ContributorsList

- **Impact:** Prevents re-sorting on every render
- **File:** `src/components/features/contributors/ContributorsList.tsx`
- **Task:** Memoize `sortedContributors`, `displayedContributors`, and `maxCommits` with `useMemo`. Wrap `getContributorStats` helper in `useCallback` or extract outside the component.

### 2.2 Add `useMemo` to LanguageBreakdown

- **Impact:** Prevents recomputing totals on every render
- **File:** `src/components/features/stats/LanguageBreakdown.tsx`
- **Task:** Memoize `totalBytes` and `displayedLanguages` with `useMemo`.

### 2.3 Add `useMemo` to StatsOverview

- **Impact:** Prevents recreating stats array on every render
- **File:** `src/components/features/stats/StatsOverview.tsx`
- **Task:** Memoize the `stats` array with `useMemo`, keyed on the relevant `data.*` fields.

### 2.4 Memoize Inline Functions & Static Arrays

- **Impact:** Reduces unnecessary child re-renders
- **Files:**
  - `src/components/embed/EmbedShare.tsx` — wrap `buildEmbedUrl` in `useCallback`
  - `src/components/ui/RepoInput.tsx` — move `exampleRepos` array outside the component
  - `src/components/features/repos/UserReposList.tsx` — memoize `filteredRepos` with `useMemo`
  - `src/app/(public)/page.tsx` — wrap `analyzeRepoInternal` in `useCallback`
- **Task:** Apply memoization to each file as described.

### 2.5 Add `optimizePackageImports` for lucide-react

- **Impact:** 5-10KB bundle reduction
- **File:** `next.config.ts`
- **Task:** Add `experimental: { optimizePackageImports: ['lucide-react'] }` to the Next.js config.

### 2.6 Add Next.js Compiler Optimizations

- **File:** `next.config.ts`
- **Task:** Add the following to the config:
  ```ts
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  ```

---

## Phase 3: Accessibility & UX Polish

### 3.1 Add ARIA Labels to Interactive Elements

- **Files:**
  - `src/components/ui/RepoInput.tsx` — add `aria-label` to input, `aria-describedby` for errors
  - `src/components/layout/Header.tsx` — add `aria-label` to sign-in/sign-out buttons
  - `src/components/embed/EmbedShare.tsx` — add `aria-label` to close button, `role="dialog"`, `aria-modal="true"`
  - `src/components/features/commits/CommitHistory.tsx` — add `aria-expanded` to expand/collapse
  - `src/components/features/contributors/ContributorsList.tsx` — same as above
  - `src/components/effects/ParticleBackground.tsx` — add `role="presentation"` and `aria-hidden="true"` to canvas
- **Task:** Add appropriate ARIA attributes to each component as listed.

### 3.2 Add Keyboard Navigation to EmbedShare Modal

- **File:** `src/components/embed/EmbedShare.tsx`
- **Task:** Add Escape key handler to close modal. Add backdrop click-to-close (close when clicking outside the modal content). Consider focus trapping inside the modal while open.

### 3.3 Add `prefers-reduced-motion` Support

- **Files:**
  - `src/app/globals.css` — wrap heavy animations in `@media (prefers-reduced-motion: no-preference)`
  - `src/components/effects/ParticleBackground.tsx` — check `window.matchMedia('(prefers-reduced-motion: reduce)')` and disable/simplify animation
- **Task:** Respect user motion preferences for all animations (gradient, particles, stagger-children, hover transforms).

### 3.4 Add Empty/Error States for Edge Cases

- **Files:**
  - `src/components/features/contributors/ContributorsList.tsx` — handle zero contributors
  - `src/components/features/commits/CommitHistory.tsx` — handle zero commits
  - Image components in Header, CommitHistory, ContributorsList — add `onError` fallbacks
- **Task:** Add graceful empty-state UI and image error fallbacks.

---

## Phase 4: Code Quality & Robustness

### 4.1 Validate Environment Variables at Startup

- **Files:**
  - Create `src/lib/env.ts`
  - Update `src/auth.ts` and `src/lib/github.ts` to import from `env.ts`
- **Task:** Create a Zod schema that validates all required env vars (`AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GITHUB_PROXY_URL`) and fails fast at build/startup if missing.

### 4.2 Add AbortController to CodeFrequencyChart Polling

- **File:** `src/components/features/stats/CodeFrequencyChart.tsx`
- **Task:** Pass an `AbortController.signal` to fetch calls inside the polling effect. Abort on component unmount to prevent state updates on unmounted components.

### 4.3 Expand Sitemap with Dynamic Routes

- **File:** `src/app/sitemap.ts`
- **Task:** Consider adding popular/featured repository pages to the sitemap. At minimum, add a `/dashboard` entry (if appropriate for crawling) or document why it's excluded. Explore whether recently analyzed repos could be added dynamically.

### 4.4 Clean Up Unused Exports

- **File:** `src/lib/github.ts`
- **Task:** Audit exported functions. `fetchRESTViaProxy` appears exported but unused — remove the export if not needed externally.

---

## Phase 5: Testing Foundation

### 5.1 Set Up Testing Infrastructure

- **Task:** Install and configure testing dependencies:
  - `vitest` (or `jest`) + `@testing-library/react` + `@testing-library/jest-dom`
  - Add `test` and `test:watch` scripts to `package.json`
  - Create `vitest.config.ts` (or `jest.config.ts`) with Next.js/TypeScript support
  - Add a sample test to verify the setup works

### 5.2 Unit Tests for Utility Functions

- **Files to test:**
  - `src/lib/format.ts` — number formatting, date formatting
  - `src/lib/cache.ts` — TTL behavior, max size, eviction
  - `src/lib/validations.ts` — Zod schema validation (valid/invalid inputs)
  - `src/lib/github.ts` — `parseRepoUrl` (various URL formats)
- **Task:** Write comprehensive unit tests for all pure utility functions.

### 5.3 Component Tests for Key UI

- **Files to test:**
  - `src/components/ui/RepoInput.tsx` — input validation, submission, error display
  - `src/components/ui/LoadingSkeleton.tsx` — renders correctly
  - `src/components/features/stats/StatsOverview.tsx` — renders stats from data
  - `src/components/features/stats/LanguageBreakdown.tsx` — renders language bars
- **Task:** Write rendering and interaction tests for core UI components.

### 5.4 API Route Tests

- **Files to test:**
  - `src/app/api/repo/route.ts` — valid/invalid inputs, caching behavior
  - `src/app/api/repo/stats/route.ts` — polling responses (200, 202, 422)
- **Task:** Write integration tests for API routes with mocked GitHub API responses.

---

## Phase 6: Advanced Optimizations (Optional)

These are lower-priority enhancements for when the above are complete.

### 6.1 Optimize Particle System Performance

- **File:** `src/components/effects/ParticleBackground.tsx`
- **Task:** Reduce default particle count (60 desktop, 25 mobile). Consider spatial hashing to replace O(n²) connection algorithm. Optionally skip connection checks on alternating frames.

### 6.2 Add Bundle Analyzer

- **Task:** Install `@next/bundle-analyzer`. Add an `analyze` script to `package.json`. Use it to verify bundle improvements from Phase 1-2.

### 6.3 Consider Lighter Chart Alternative

- **Task:** Evaluate replacing Recharts (~200KB) with a lighter alternative like Chart.js (~50KB), or a custom SVG chart. Only pursue if lazy-loading from Phase 1.1 is insufficient.

### 6.4 Add CSS Containment for Cards

- **File:** `src/app/globals.css`
- **Task:** Add `contain: layout style paint` to `.stat-card`, `.glass-card`, and other repeated card elements to limit browser reflow/repaint scope.

### 6.5 Evaluate SWR/React Query for Data Fetching

- **File:** `src/app/dashboard/page.tsx`
- **Task:** The current manual ref-based caching could be simplified with SWR or React Query. Evaluate if the added dependency is worth the DX improvement and built-in features (deduplication, revalidation, error retry).

---

## Progress Tracker

| Phase | Status | Tasks Done |
|-------|--------|------------|
| Phase 1: Critical | **Complete** | 6/6 |
| Phase 2: Performance | **Complete** | 6/6 |
| Phase 3: Accessibility | **Complete** | 4/4 |
| Phase 4: Code Quality | **Complete** | 4/4 |
| Phase 5: Testing | **Complete** | 4/4 |
| Phase 6: Advanced | **Complete** | 5/5 |
| **Total** | | **29/29** |

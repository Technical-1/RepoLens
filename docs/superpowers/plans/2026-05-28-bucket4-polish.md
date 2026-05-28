# Bucket 4 — Copy, Docs & Formatting Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (#10) Make `formatBytes` use 1024-based math so `KB`/`MB` labels are accurate; (#9) reword the README and PrivacyNotice so the "tokens are never stored" claim honestly reflects the encrypted NextAuth cookie session.

**Architecture:** Two independent, low-risk changes. `formatBytes` switches thresholds/divisors from 1000 to 1024 and its existing tests are updated to match. The privacy copy is reworded in `PrivacyNotice.tsx` and `README.md` — no functional/auth change (decision: reword, do not re-architect).

**Tech Stack:** TypeScript, Vitest, React (client component), Markdown.

---

### Task 1: 1024-based `formatBytes` (fixes #10)

**Files:**
- Modify: `src/lib/format.ts:20-24`
- Test: `src/__tests__/lib/format.test.ts:35-51` (update existing expectations)

- [ ] **Step 1: Update the failing tests first.** Replace the entire `describe('formatBytes', ...)` block in `src/__tests__/lib/format.test.ts` with:

```ts
describe('formatBytes', () => {
  it('formats bytes below 1 KiB', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(1000)).toBe('1000 B') // < 1024, stays in bytes
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('formats kilobytes using 1024', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('formats megabytes using 1024', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.5 MB')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/format.test.ts -t formatBytes`
Expected: FAIL — current implementation divides by 1000 (e.g. `formatBytes(1024)` → `'1.0 KB'` would actually currently be `'1.0 KB'`? No — current `formatBytes(1024)` = `(1024/1000).toFixed(1)+' KB'` = `'1.0 KB'`, but `formatBytes(1000)` currently → `'1.0 KB'` not `'1000 B'`). Confirm the `formatBytes(1000)` and MB cases fail.

- [ ] **Step 3: Update the implementation.** Replace `formatBytes` in `src/lib/format.ts`:

```ts
/**
 * Format bytes to human-readable format (B, KB, MB) using 1024-based units.
 */
export function formatBytes(bytes: number): string {
  const KB = 1024
  const MB = KB * 1024
  if (bytes >= MB) return (bytes / MB).toFixed(1) + ' MB'
  if (bytes >= KB) return (bytes / KB).toFixed(1) + ' KB'
  return bytes + ' B'
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/format.test.ts`
Expected: PASS (all `format` tests, including the updated `formatBytes`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/__tests__/lib/format.test.ts
git commit -m "fix(format): use 1024-based math for KB/MB byte formatting (#10)"
```

---

### Task 2: Reword the privacy copy (fixes #9)

**Files:**
- Modify: `src/components/ui/PrivacyNotice.tsx:16-39`
- Modify: `README.md:67-75` (the "Privacy & Security" bullet list)

No automated test — this is user-facing copy. Verification is a grep proving the inaccurate absolute claim is gone.

- [ ] **Step 1: Update the PrivacyNotice paragraph.** In `src/components/ui/PrivacyNotice.tsx`, replace the `<p>` body (lines 16-21):

```tsx
            We never store your login credentials, personal information, or access tokens. 
            All authentication happens directly with GitHub&apos;s secure OAuth system. Your data 
            is only used in real-time to display repository statistics and is never saved 
            to any database.
```

with:

```tsx
            We never sell your data or save it to a database. Authentication happens directly
            with GitHub&apos;s secure OAuth system; your session — including the GitHub access
            token — is kept only in an encrypted, http-only cookie in your browser and is used
            in real time to display repository statistics.
```

- [ ] **Step 2: Update the first PrivacyNotice bullet.** Replace (line ~25):

```tsx
              OAuth tokens stay in your browser session only
```

with:

```tsx
              OAuth token kept only in an encrypted browser session cookie
```

And replace (line ~31):

```tsx
              No server-side storage of credentials
```

with:

```tsx
              No database storage of credentials or tokens
```

- [ ] **Step 3: Update the README "Privacy & Security" section.** In `README.md`, replace these bullet lines (lines 71-75):

```markdown
- Uses GitHub OAuth for secure authentication
- Never saves login credentials or access tokens to any database
- Tokens exist only in your browser session
- All API calls go directly to GitHub
- Sign out anytime to revoke access
```

with:

```markdown
- Uses GitHub OAuth for secure authentication
- Never saves login credentials or access tokens to any database
- The access token is held only in an encrypted, http-only session cookie in your browser (standard NextAuth session) — not in any server-side store
- All API calls go directly to GitHub
- Sign out anytime to clear the session and revoke access
```

- [ ] **Step 4: Verify the misleading absolute claim is gone**

Run: `git grep -n "only in your browser session" -- README.md src/`
Expected: no matches (the phrase has been replaced everywhere).

- [ ] **Step 5: Typecheck (PrivacyNotice still compiles)**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/PrivacyNotice.tsx README.md
git commit -m "docs(privacy): accurately describe encrypted-cookie session storage (#9)"
```

---

### Task 3: Verification

- [ ] **Step 1: Run the suite + lint**

Run: `npm test && npm run lint`
Expected: all PASS.

---

## Self-Review

**Spec coverage:**
- #10 byte unit labeling → Task 1 (impl + updated tests) ✓
- #9 privacy claim mismatch → Task 2 (PrivacyNotice + README), per the locked "reword the claims" decision ✓

**Placeholder scan:** No TBD/TODO; copy strings are written out in full. ✓

**Type consistency:** `formatBytes(bytes: number): string` signature unchanged — only internals and test expectations change, so all other callers (`LanguageBreakdown`, etc.) remain valid. ✓

**Behavioral note:** Switching to 1024 means values in the 1000–1023 range now render as `B` instead of `KB` (e.g. a 1000-byte language total shows `1000 B`). This is intended and matches GitHub's own 1024-based size reporting.

# Bucket 3 — Output Safety (JSON-LD XSS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the reflected XSS where URL-derived `owner`/`name` are serialized with `JSON.stringify` and injected via `dangerouslySetInnerHTML` without escaping `</script>`.

**Architecture:** Add a single `safeJsonLd()` serializer to `src/lib/structured-data.ts` that escapes `<`, `>`, and `&` to their `\uXXXX` JSON escapes (valid JSON, inert in HTML). Apply it at both JSON-LD injection sites: the user-controlled repo page and the static root layout. Pure unit tests prove no raw `</script>` can survive and that output still parses back to the original object. Optional final task adds a Content-Security-Policy header as defense-in-depth.

**Tech Stack:** TypeScript, Next.js 15 App Router (Server Components), Vitest.

---

### Task 1: `safeJsonLd` serializer

**Files:**
- Modify: `src/lib/structured-data.ts`
- Test: `src/__tests__/lib/structured-data.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/__tests__/lib/structured-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { safeJsonLd, getRepoPageJsonLd } from '@/lib/structured-data'

describe('safeJsonLd', () => {
  it('escapes angle brackets so a </script> payload cannot break out', () => {
    const malicious = getRepoPageJsonLd('foo', 'bar</script><script>alert(1)</script>')
    const out = safeJsonLd(malicious)
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<script>')
    expect(out).toContain('\\u003c') // escaped "<"
  })

  it('escapes ampersands', () => {
    expect(safeJsonLd({ a: 'x & y' })).toContain('\\u0026')
  })

  it('still parses back to the original object', () => {
    const obj = getRepoPageJsonLd('facebook', 'react')
    expect(JSON.parse(safeJsonLd(obj))).toEqual(obj)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/structured-data.test.ts`
Expected: FAIL — `safeJsonLd is not a function`.

- [ ] **Step 3: Write minimal implementation** — add to the top of `src/lib/structured-data.ts` (after the `siteUrl` const):

```ts
/**
 * Serialize an object to JSON safe for embedding in an inline <script> tag.
 * Escapes <, >, and & to their \u escapes so a "</script>" substring in any
 * user-derived value cannot terminate the script element (reflected XSS).
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/structured-data.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/structured-data.ts src/__tests__/lib/structured-data.test.ts
git commit -m "feat(structured-data): add safeJsonLd escaping serializer"
```

---

### Task 2: Apply `safeJsonLd` at both injection sites (fixes #1)

**Files:**
- Modify: `src/app/repo/[owner]/[name]/page.tsx:33-40`
- Modify: `src/app/layout.tsx:105-113`

- [ ] **Step 1: Update the repo page.** In `src/app/repo/[owner]/[name]/page.tsx`:

Change the import on line 3:

```ts
import { getRepoPageJsonLd, safeJsonLd } from '@/lib/structured-data'
```

Change the script injection (line 39) from:

```tsx
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
```

to:

```tsx
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
```

- [ ] **Step 2: Update the root layout.** In `src/app/layout.tsx`:

Change the import on line 5:

```ts
import { getWebApplicationJsonLd, safeJsonLd } from '@/lib/structured-data'
```

Change line 112 from:

```tsx
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
```

to:

```tsx
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
```

- [ ] **Step 3: Verify no raw `JSON.stringify` remains in a script injection**

Run: `git grep -n "dangerouslySetInnerHTML" src/`
Expected: both hits now pass through `safeJsonLd(...)`; no `JSON.stringify(jsonLd)` remains.

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add "src/app/repo/[owner]/[name]/page.tsx" src/app/layout.tsx
git commit -m "fix(security): escape JSON-LD output to prevent reflected XSS (#1)"
```

---

### Task 3 (OPTIONAL): Content-Security-Policy header as defense-in-depth

Only do this if you want belt-and-suspenders hardening. The escaping in Tasks 1-2 is the actual fix; a strict CSP can break the inline `next/font` styles and JSON-LD `<script>`, so test carefully.

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add a `headers()` function** to the `nextConfig` object in `next.config.ts`:

```ts
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
```

(Note: a full `Content-Security-Policy` with nonces requires middleware to coordinate with Next's inline scripts; the three headers above are safe wins. Add a scripted CSP only after verifying inline JSON-LD + fonts still load.)

- [ ] **Step 2: Build and smoke-test**

Run: `npm run build && npm run start`
Then load `http://localhost:3000` and a `/repo/facebook/react` page; confirm no console CSP/security-header errors and styles render.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore(security): add baseline security response headers"
```

---

### Task 4: Verification

- [ ] **Step 1: Run the suite**

Run: `npm test`
Expected: all PASS.

---

## Self-Review

**Spec coverage:** #1 JSON-LD XSS → Tasks 1 (serializer + tests) and 2 (both injection sites). ✓ The root-layout site (`layout.tsx`) is static today, but escaping it too prevents a future regression if user data is ever added there.

**Placeholder scan:** No TBD/TODO. Task 3 is explicitly optional and gated by a manual smoke test. ✓

**Type consistency:** `safeJsonLd(data: unknown): string` — single signature defined in Task 1, called identically in Task 2 at both sites and in the Task 1 tests. ✓

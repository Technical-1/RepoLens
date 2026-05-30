# RepoLens `/about` Info Hub — Design Spec

**Date:** 2026-05-30
**Status:** Approved (design)
**Author:** Jacob Kanfer

## Summary

Add a public information hub at `/about` that explains RepoLens, documents its
methodology and engineering choices, provides an interactive guide to the
embeddable SVG widgets, and answers common questions. The page is a single
long-scroll layout with a sticky in-page sub-nav. It introduces no new
dependencies and reuses the existing visual system.

### Background / why

RepoLens currently has only functional pages — home (search), dashboard, and
per-repo analysis. Nothing explains what the app does, how its stats are
computed, or how to use the embeddable widgets the README advertises. An info
hub helps real users and doubles as a portfolio showcase of the engineering
decisions behind the app.

A deeper "computed values across all of a user's repos" feature was considered
and explicitly **descoped**: deep per-repo analysis (`analyzeRepo()`) across an
entire account would blow GitHub API rate limits and require persistence the app
does not have. See "Out of scope" below.

## Goals

- A single public page that serves as the canonical "what / how / widgets / FAQ"
  destination.
- Turn the README-only widget feature into a real, interactive product page.
- Showcase engineering choices (GraphQL-over-REST, Zod validation, privacy-first).
- Strong SEO: one URL, server-rendered, in the sitemap.

## Non-goals / Out of scope

- No account-wide deep stats (lines/commits summed across all repos). Descoped
  due to rate-limit cost and lack of persistence.
- No CMS/MDX content pipeline — content lives in the components/page as JSX.
- No per-reader custom-repo input in the widget guide (live preview uses a fixed
  sample repo). This was an explicit choice over the "custom repo" option.
- No new npm dependencies.

## Architecture

### Route & placement

- New file: `src/app/(public)/about/page.tsx`.
- Lives in the existing `(public)` route group, inheriting
  `src/app/(public)/layout.tsx` chrome.
- Server component with a `metadata` export (title, description, OpenGraph).
- Add `/about` to `sitemap.xml`.
- Reuses the existing visual system: `animated-gradient` background,
  `ParticleBackground`, `glass-card`, `github-*` Tailwind colors, shared
  `Header` / `Footer`.

### Navigation integration

- Add an **"About"** `<Link href="/about">` in `src/components/layout/Header.tsx`
  (left of the auth controls — Header currently has no nav links).
- Add a matching **"About"** link in `src/components/layout/Footer.tsx`.

### Page structure — single long-scroll + sticky sub-nav

`SectionNav` (client component): sticky bar pinned just below the fixed header,
anchors **What · How it works · Widgets · FAQ**. Scroll-spy via
`IntersectionObserver` highlights the active section.

Four stacked `<section id="…">` blocks:

| id            | Component       | Content |
|---------------|-----------------|---------|
| `what`        | `AboutIntro`    | What RepoLens is, who it's for, the one-line pitch. |
| `how`         | `HowItWorks`    | Methodology (how lines/commits are counted + accuracy caveats) and engineering choices (GraphQL-over-REST, Zod validation, privacy-first / no stored credentials). |
| `widgets`     | `WidgetGuide`   | Interactive widget guide (see below). |
| `faq`         | `FaqAccordion`  | Collapsible Q&A. |

### Components

All new components live under `src/components/features/about/` (new folder),
matching the existing `src/components/features/<domain>/` convention.

1. **`SectionNav`** (client) — sticky sub-nav + scroll-spy. Props: section
   definitions `{ id, label }[]`. Renders anchor links; observes section
   elements to set the active anchor.

2. **`AboutIntro`** (server) — static intro copy.

3. **`HowItWorks`** (server) — static methodology + engineering copy, laid out as
   cards in the existing `glass-card` style.

4. **`WidgetGuide`** (client) — the interactive section:
   - Renders all three widgets (`code-stats`, `languages`, `stats`) as live
     previews via `<img src="/api/embed/<widget>?owner=…&repo=…&theme=…">`
     against the sample repo `Technical-1/RepoLens`.
   - A single **dark/light theme toggle** updates `?theme=` on every preview at
     once (state lifted to `WidgetGuide`).
   - Per-widget **copy-to-clipboard** buttons for **Markdown** and **HTML**
     snippets, reflecting the active theme. Snippets document the params
     `owner`, `repo`, `theme` (`dark` | `light`), and `hideRepoName` (`true`).
   - No new fetch logic: the embed endpoints already return rendered SVG, so a
     preview is just an `<img>`; the toggle swaps the query param.

5. **`FaqAccordion`** (client) — collapsible Q&A. Starter items:
   - "Why are some of my private repos missing?"
   - "How accurate are the line counts?"
   - "Is any of my data stored?" (no — credentials are never persisted)
   - "Why does a large repo take a moment to analyze?" (rate limits / GraphQL
     commit walk)

### Data flow

- No new API routes. The widget previews consume existing `/api/embed/*`
  endpoints. Everything else is static content rendered at build/request time.

### Error handling

- Widget previews: if an embed endpoint errors, it already returns an error SVG
  (`createErrorImageResponse`), so the `<img>` still renders something sensible.
  Add `alt` text per preview as a fallback.
- Copy-to-clipboard: guard `navigator.clipboard` (may be undefined in insecure
  contexts); show a brief "Copied" confirmation on success, fall back silently
  if unavailable.

## Testing

Vitest + Testing Library, matching `src/__tests__/` conventions:

- `SectionNav` renders all four anchors with correct `href="#…"`.
- `WidgetGuide` theme toggle updates each preview `<img>` `src` to the new
  `theme` param.
- `WidgetGuide` copy button writes the expected Markdown/HTML snippet to a mocked
  `navigator.clipboard.writeText`.
- `FaqAccordion` expands/collapses an item on click (`aria-expanded` toggles).

## Build sequence (high level)

1. Scaffold `/about` page + `metadata`, register in `sitemap.xml`.
2. Build `SectionNav` (sticky + scroll-spy).
3. Build `AboutIntro` and `HowItWorks` (static content).
4. Build `WidgetGuide` (previews, theme toggle, copy snippets).
5. Build `FaqAccordion`.
6. Wire nav links into `Header` and `Footer`.
7. Tests for the interactive components.

## Open questions

- None blocking. Final copy for `HowItWorks` and FAQ can be refined during
  implementation.

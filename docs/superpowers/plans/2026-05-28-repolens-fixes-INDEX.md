# RepoLens Fixes — Plan Index

Generated 2026-05-28 from the `/investigate` findings (Project Hub project 162, 10 tasks), grouped into 4 implementation buckets.

## Locked design decisions

| Decision | Choice | Affects |
|----------|--------|---------|
| "Total lines of code" definition | **Sum full `code_frequency` history when available; fall back to a recent-commit estimate flagged `estimated`** for >10k-commit repos | Bucket 1 |
| code-stats embed fallback when `code_frequency` unavailable | **Drop the per-commit detail loop**; rely only on `code_frequency` + `participation`, render `—` when unavailable | Bucket 2 |
| Privacy claim vs JWT token | **Reword README + PrivacyNotice** to describe the encrypted-cookie session honestly (no auth re-architecture) | Bucket 4 |
| Bytes units (`formatBytes`) | Switch to 1024-based math, keep `KB`/`MB` labels (default — low risk) | Bucket 4 |
| CSP header | Optional defense-in-depth task at the end of Bucket 3; escaping is the primary fix | Bucket 3 |

## Buckets & build order

| Order | Plan | Tasks | Why this order |
|-------|------|-------|----------------|
| 1 | `2026-05-28-bucket1-metrics-accuracy.md` | #2 total lines, #5 proxy commit count, #6 cache key | Produces the canonical metric/count logic the rest builds on |
| 2 | `2026-05-28-bucket2-embed-hardening.md` | #3 fabricated commit count, #4 validation, #7 rate-limit, #8 error leakage | Largest security + reliability surface; consumes Bucket 1's "sum full history" pattern |
| 3 | `2026-05-28-bucket3-output-safety.md` | #1 JSON-LD XSS (+ optional CSP) | Independent; can ship first if you want to front-load the security fix |
| 4 | `2026-05-28-bucket4-polish.md` | #9 privacy copy, #10 byte units | Trivial, no dependencies, batch last |

## Cross-bucket invariant

Bucket 1 establishes that **"total lines" = net of full `code_frequency` history**. Bucket 2's `getCodeStatsData` uses the *same* summing approach, so the website and the embed widget report identical numbers for the same repo. If you change the definition in one place, change it in both.

## Execution

Each plan is self-contained and TDD-structured (`- [ ]` steps). Recommended: subagent-driven execution, one task per fresh subagent with review between tasks. Run `npm test` after each bucket; the whole suite must stay green.

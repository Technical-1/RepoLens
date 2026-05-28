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

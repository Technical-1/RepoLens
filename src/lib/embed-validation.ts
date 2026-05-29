import { z } from 'zod'

// GitHub logins and repo names: alphanumerics plus . _ - only.
// The charclass blocks "/", "?", and whitespace; the refinement additionally
// rejects "." / ".." and any embedded ".." so a dot-segment cannot reorder the
// proxy path (SSRF / endpoint confusion). ".github"-style names stay valid.
const NAME = /^[A-Za-z0-9._-]+$/
const noTraversal = (v: string) => v !== '.' && v !== '..' && !v.includes('..')

const namePart = z
  .string()
  .min(1)
  .max(100)
  .regex(NAME)
  .refine(noTraversal, 'Path traversal sequences are not allowed')

export const EmbedParamsSchema = z.object({
  owner: namePart,
  repo: namePart,
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

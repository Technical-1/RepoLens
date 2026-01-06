import { z } from 'zod'

/**
 * Validation schema for repository analysis requests
 */
export const RepoRequestSchema = z.object({
  repoUrl: z
    .string()
    .min(1, 'Repository URL is required')
    .max(500, 'Repository URL is too long')
    .refine(
      (url) => {
        // Accept various GitHub URL formats
        const patterns = [
          /^https?:\/\/github\.com\/[^\/]+\/[^\/]+/,
          /^github\.com\/[^\/]+\/[^\/]+/,
          /^[^\/]+\/[^\/]+$/,
        ]
        return patterns.some((pattern) => pattern.test(url.trim()))
      },
      { message: 'Invalid repository URL format. Use owner/repo or a GitHub URL.' }
    ),
})

export type RepoRequest = z.infer<typeof RepoRequestSchema>

/**
 * Validation schema for stats polling requests
 */
export const StatsRequestSchema = z.object({
  owner: z
    .string()
    .min(1, 'Owner is required')
    .max(100, 'Owner name is too long'),
  repo: z
    .string()
    .min(1, 'Repo name is required')
    .max(100, 'Repo name is too long'),
  type: z.enum(['codeFrequency'], {
    message: 'Invalid stats type',
  }),
})

export type StatsRequest = z.infer<typeof StatsRequestSchema>

/**
 * Helper function to format Zod errors for API responses
 */
export function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map((issue) => issue.message)
  return issues.join('. ')
}


import { z } from 'zod/v4'

/**
 * Validated environment variables.
 * Parsed once at module load — fails fast if required vars are missing.
 */

const serverSchema = z.object({
  AUTH_GITHUB_ID: z.string().min(1, 'AUTH_GITHUB_ID is required'),
  AUTH_GITHUB_SECRET: z.string().min(1, 'AUTH_GITHUB_SECRET is required'),
})

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default('https://repolens.io'),
  NEXT_PUBLIC_GITHUB_PROXY_URL: z.string().optional().default(''),
})

function parseServerEnv() {
  // Skip validation during build (static pages) and tests (env vars may not be set)
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
  const isTest = process.env.NODE_ENV === 'test'
  if ((isBuild || isTest) && !process.env.AUTH_GITHUB_ID) {
    return {
      AUTH_GITHUB_ID: '',
      AUTH_GITHUB_SECRET: '',
    }
  }

  const result = serverSchema.safeParse(process.env)
  if (!result.success) {
    const formatted = z.prettifyError(result.error)
    console.error('❌ Missing server environment variables:\n', formatted)
    throw new Error('Missing required server environment variables')
  }
  return result.data
}

function parseClientEnv() {
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GITHUB_PROXY_URL: process.env.NEXT_PUBLIC_GITHUB_PROXY_URL,
  })
  if (!result.success) {
    const formatted = z.prettifyError(result.error)
    console.error('❌ Invalid client environment variables:\n', formatted)
    throw new Error('Invalid client environment variables')
  }
  return result.data
}

export const serverEnv = parseServerEnv()
export const clientEnv = parseClientEnv()

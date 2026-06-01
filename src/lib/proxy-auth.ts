/**
 * Authentication for trusted server-side calls to the RepoLens GitHub proxy.
 *
 * The proxy authorizes browser requests via its CORS origin allowlist, but
 * server-side calls (API routes, OG image generation) send no Origin header and
 * must instead present a shared secret. The secret lives in the server-only
 * `GITHUB_PROXY_SECRET` env var — never `NEXT_PUBLIC_`, so it stays out of the
 * client bundle.
 *
 * `proxyAuthHeaders()` returns the header only when the secret is present (i.e.
 * server runtime). On the client the var is undefined, so no header is sent and
 * the request is authorized by Origin instead.
 */
export const PROXY_SECRET_HEADER = 'X-RepoLens-Server'

export function proxyAuthHeaders(): Record<string, string> {
  const secret = process.env.GITHUB_PROXY_SECRET
  return secret ? { [PROXY_SECRET_HEADER]: secret } : {}
}

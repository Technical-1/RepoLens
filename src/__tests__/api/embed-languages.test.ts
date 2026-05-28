import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/embed/languages/route'

function req(qs: string) {
  return new NextRequest(`http://localhost:3000/api/embed/languages?${qs}`)
}

describe('GET /api/embed/languages validation', () => {
  it('returns 400 when repo is missing', async () => {
    expect((await GET(req('owner=facebook'))).status).toBe(400)
  })
  it('returns 400 for traversal in owner', async () => {
    expect((await GET(req('owner=..%2F..&repo=react'))).status).toBe(400)
  })
})

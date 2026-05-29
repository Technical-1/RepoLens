import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/embed/code-stats/route'

function req(qs: string) {
  return new NextRequest(`http://localhost:3000/api/embed/code-stats?${qs}`)
}

describe('GET /api/embed/code-stats validation', () => {
  it('returns 400 when params missing', async () => {
    expect((await GET(req('owner=facebook'))).status).toBe(400)
  })
  it('returns 400 for query injection in repo', async () => {
    expect((await GET(req('owner=facebook&repo=react%3Ffoo'))).status).toBe(400)
  })
})

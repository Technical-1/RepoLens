import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/embed/stats/route'

function req(qs: string) {
  return new NextRequest(`http://localhost:3000/api/embed/stats?${qs}`)
}

describe('GET /api/embed/stats validation', () => {
  it('returns 400 when owner is missing', async () => {
    const res = await GET(req('repo=react'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for injection attempts in repo', async () => {
    const res = await GET(req('owner=facebook&repo=react%2Fstats'))
    expect(res.status).toBe(400)
  })
})

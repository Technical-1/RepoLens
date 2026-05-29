import { describe, it, expect } from 'vitest'
import { safeJsonLd, getRepoPageJsonLd } from '@/lib/structured-data'

describe('safeJsonLd', () => {
  it('escapes angle brackets so a </script> payload cannot break out', () => {
    const malicious = getRepoPageJsonLd('foo', 'bar</script><script>alert(1)</script>')
    const out = safeJsonLd(malicious)
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<script>')
    expect(out).toContain('\\u003c') // escaped "<"
  })

  it('escapes ampersands', () => {
    expect(safeJsonLd({ a: 'x & y' })).toContain('\\u0026')
  })

  it('still parses back to the original object', () => {
    const obj = getRepoPageJsonLd('facebook', 'react')
    expect(JSON.parse(safeJsonLd(obj))).toEqual(obj)
  })
})

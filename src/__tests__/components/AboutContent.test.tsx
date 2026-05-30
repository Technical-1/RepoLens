import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@/components/effects/ParticleBackground', () => ({
  default: () => null,
}))

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
  )
})

import AboutContent from '@/components/features/about/AboutContent'

describe('AboutContent', () => {
  it('renders all four section headings', () => {
    render(<AboutContent />)
    expect(screen.getByRole('heading', { name: /what is repolens/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /embeddable widgets/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^faq$/i })).toBeInTheDocument()
  })
})

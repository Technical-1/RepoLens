import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

describe('navigation links', () => {
  it('Header links to /about', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
  })

  it('Footer links to /about', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about')
  })
})

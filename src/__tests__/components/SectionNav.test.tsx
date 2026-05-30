import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SectionNav, { ABOUT_SECTIONS } from '@/components/features/about/SectionNav'

describe('SectionNav', () => {
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

  it('renders an anchor for every section', () => {
    render(<SectionNav sections={ABOUT_SECTIONS} />)
    expect(screen.getByRole('link', { name: 'What' })).toHaveAttribute('href', '#what')
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how')
    expect(screen.getByRole('link', { name: 'Widgets' })).toHaveAttribute('href', '#widgets')
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq')
  })
})

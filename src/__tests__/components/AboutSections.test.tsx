import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutIntro from '@/components/features/about/AboutIntro'
import HowItWorks from '@/components/features/about/HowItWorks'

describe('About static sections', () => {
  it('renders the intro under the #what anchor', () => {
    const { container } = render(<AboutIntro />)
    expect(container.querySelector('#what')).not.toBeNull()
    expect(screen.getByRole('heading', { name: /what is repolens/i })).toBeInTheDocument()
  })

  it('renders the how-it-works engineering choices under the #how anchor', () => {
    const { container } = render(<HowItWorks />)
    expect(container.querySelector('#how')).not.toBeNull()
    expect(screen.getByRole('heading', { name: /graphql over rest/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /privacy first/i })).toBeInTheDocument()
  })
})

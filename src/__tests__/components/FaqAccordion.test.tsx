import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FaqAccordion from '@/components/features/about/FaqAccordion'

describe('FaqAccordion', () => {
  it('opens the first item by default', () => {
    render(<FaqAccordion />)
    const first = screen.getByRole('button', { name: /private repos missing/i })
    expect(first).toHaveAttribute('aria-expanded', 'true')
  })

  it('expands a collapsed item when clicked', () => {
    render(<FaqAccordion />)
    const stored = screen.getByRole('button', { name: /is any of my data stored/i })
    expect(stored).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(stored)
    expect(stored).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/never persists your credentials/i)).toBeInTheDocument()
  })
})

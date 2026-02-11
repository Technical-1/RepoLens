import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSkeleton, { CardSkeleton, StatsSkeleton } from '@/components/ui/LoadingSkeleton'

describe('LoadingSkeleton', () => {
  it('renders loading text', () => {
    render(<LoadingSkeleton />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

describe('CardSkeleton', () => {
  it('renders without errors', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('StatsSkeleton', () => {
  it('renders 6 skeleton cards', () => {
    const { container } = render(<StatsSkeleton />)
    const cards = container.querySelectorAll('.animate-pulse')
    expect(cards.length).toBe(6)
  })
})

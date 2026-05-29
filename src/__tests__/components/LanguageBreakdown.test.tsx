import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LanguageBreakdown from '@/components/features/stats/LanguageBreakdown'
import { mockRepoAnalysis } from '../fixtures'

describe('LanguageBreakdown', () => {
  it('renders section heading', () => {
    render(<LanguageBreakdown data={mockRepoAnalysis} />)
    expect(screen.getByText('Language Breakdown')).toBeInTheDocument()
  })

  it('renders language names', () => {
    render(<LanguageBreakdown data={mockRepoAnalysis} />)
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('CSS')).toBeInTheDocument()
  })

  it('renders percentages', () => {
    render(<LanguageBreakdown data={mockRepoAnalysis} />)
    expect(screen.getByText('66.7%')).toBeInTheDocument()
    expect(screen.getByText('26.7%')).toBeInTheDocument()
  })

  it('renders total code size', () => {
    render(<LanguageBreakdown data={mockRepoAnalysis} />)
    expect(screen.getByText('Total code size')).toBeInTheDocument()
    // 7,500,000 bytes / 1024^2 = 7.2 MB (1024-based formatBytes)
    expect(screen.getByText('7.2 MB')).toBeInTheDocument()
  })

  it('shows "Show All" button when more than 4 languages', () => {
    const manyLangs = {
      ...mockRepoAnalysis,
      languagePercentages: [
        { name: 'JavaScript', bytes: 5000000, percentage: 40, color: '#f1e05a' },
        { name: 'TypeScript', bytes: 3000000, percentage: 25, color: '#3178c6' },
        { name: 'Python', bytes: 2000000, percentage: 15, color: '#3572A5' },
        { name: 'Go', bytes: 1000000, percentage: 10, color: '#00ADD8' },
        { name: 'Rust', bytes: 500000, percentage: 5, color: '#dea584' },
        { name: 'CSS', bytes: 500000, percentage: 5, color: '#563d7c' },
      ],
    }
    render(<LanguageBreakdown data={manyLangs} />)
    expect(screen.getByText(/Show All 6 Languages/)).toBeInTheDocument()
  })

  it('does not show "Show All" button when 4 or fewer languages', () => {
    render(<LanguageBreakdown data={mockRepoAnalysis} />)
    expect(screen.queryByText(/Show All/)).not.toBeInTheDocument()
  })

  it('toggles showing all languages', () => {
    const manyLangs = {
      ...mockRepoAnalysis,
      languagePercentages: [
        { name: 'JavaScript', bytes: 5000000, percentage: 40, color: '#f1e05a' },
        { name: 'TypeScript', bytes: 3000000, percentage: 25, color: '#3178c6' },
        { name: 'Python', bytes: 2000000, percentage: 15, color: '#3572A5' },
        { name: 'Go', bytes: 1000000, percentage: 10, color: '#00ADD8' },
        { name: 'Rust', bytes: 500000, percentage: 5, color: '#dea584' },
      ],
    }
    render(<LanguageBreakdown data={manyLangs} />)

    // Initially only 4 languages shown
    expect(screen.queryByText('Rust')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText(/Show All/))
    expect(screen.getByText('Rust')).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Show Less/))
    expect(screen.queryByText('Rust')).not.toBeInTheDocument()
  })
})

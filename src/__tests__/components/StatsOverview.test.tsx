import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsOverview from '@/components/features/stats/StatsOverview'
import { mockRepoAnalysis } from '../fixtures'

describe('StatsOverview', () => {
  it('renders repository name', () => {
    render(<StatsOverview data={mockRepoAnalysis} />)
    expect(screen.getByText('facebook/react')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<StatsOverview data={mockRepoAnalysis} />)
    expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument()
  })

  it('renders public badge for public repos', () => {
    render(<StatsOverview data={mockRepoAnalysis} />)
    expect(screen.getByText('Public')).toBeInTheDocument()
  })

  it('renders private badge for private repos', () => {
    const privateData = {
      ...mockRepoAnalysis,
      repo: { ...mockRepoAnalysis.repo, private: true },
    }
    render(<StatsOverview data={privateData} />)
    expect(screen.getByText('Private')).toBeInTheDocument()
  })

  it('renders all 6 stat cards', () => {
    render(<StatsOverview data={mockRepoAnalysis} />)
    expect(screen.getByText('Total Lines')).toBeInTheDocument()
    expect(screen.getByText('Lines Added')).toBeInTheDocument()
    expect(screen.getByText('Lines Removed')).toBeInTheDocument()
    expect(screen.getByText('Total Commits')).toBeInTheDocument()
    expect(screen.getByText('Stars')).toBeInTheDocument()
    expect(screen.getByText('Forks')).toBeInTheDocument()
  })

  it('formats large numbers with K/M suffixes', () => {
    render(<StatsOverview data={mockRepoAnalysis} />)
    // 220000 stars = "220.0K", 18500 commits = "18.5K"
    expect(screen.getByText('220.0K')).toBeInTheDocument()
    expect(screen.getByText('18.5K')).toBeInTheDocument()
  })

  it('renders embed button when onEmbed is provided and repo is public', () => {
    const onEmbed = vi.fn()
    render(<StatsOverview data={mockRepoAnalysis} onEmbed={onEmbed} />)
    expect(screen.getByText('Embed')).toBeInTheDocument()
  })

  it('does not render embed button for private repos', () => {
    const privateData = {
      ...mockRepoAnalysis,
      repo: { ...mockRepoAnalysis.repo, private: true },
    }
    render(<StatsOverview data={privateData} onEmbed={vi.fn()} />)
    expect(screen.queryByText('Embed')).not.toBeInTheDocument()
  })

  it('renders GitHub link', () => {
    render(<StatsOverview data={mockRepoAnalysis} />)
    const link = screen.getByText('View on GitHub')
    expect(link.closest('a')).toHaveAttribute('href', 'https://github.com/facebook/react')
  })

  it('labels line stats "All time" when not estimated', () => {
    render(<StatsOverview data={mockRepoAnalysis} />)
    expect(screen.getAllByText('All time').length).toBeGreaterThan(0)
  })

  it('labels line stats with the covered-commit count when estimated', () => {
    const estimated = {
      ...mockRepoAnalysis,
      totalLinesIsEstimated: true,
      totalLinesCommitsCovered: 2500,
    }
    render(<StatsOverview data={estimated} />)
    // 2500 -> "2.5K" via formatNumber's compact form
    expect(screen.getAllByText('Est. from 2.5K commits').length).toBeGreaterThan(0)
  })
})

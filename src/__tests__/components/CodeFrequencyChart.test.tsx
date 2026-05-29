import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CodeFrequencyChart from '@/components/features/stats/CodeFrequencyChart'
import { mockRepoAnalysis } from '../fixtures'

describe('CodeFrequencyChart', () => {
  beforeEach(() => {
    // Component polls /api/repo/stats via fetch when pending; stub it so no real
    // network happens. Tests below use pending: false, so this should not fire.
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false } as Response)))
  })

  it('renders the chart (not the unavailable message) for commit-derived data', () => {
    const data = {
      ...mockRepoAnalysis,
      codeFrequencyIsCalculated: true,
      codeFrequencyPending: false,
    }
    render(<CodeFrequencyChart data={data} />)

    // The "Based on N recent commits" badge marks commit-derived data...
    expect(screen.getByText(/Based on \d+ recent commits/)).toBeInTheDocument()
    // ...and the stuck-state fallbacks must NOT appear.
    expect(screen.queryByText(/Statistics unavailable/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Code frequency not available/)).not.toBeInTheDocument()
  })

  it('renders the chart without the badge for a real GitHub series', () => {
    const data = {
      ...mockRepoAnalysis,
      codeFrequencyIsCalculated: false,
      codeFrequencyPending: false,
    }
    render(<CodeFrequencyChart data={data} />)

    expect(screen.queryByText(/Based on \d+ recent commits/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Statistics unavailable/)).not.toBeInTheDocument()
  })

  it('shows the unavailable message only when there is genuinely no data', () => {
    const data = {
      ...mockRepoAnalysis,
      codeFrequency: [],
      codeFrequencyIsCalculated: false,
      codeFrequencyPending: false,
    }
    render(<CodeFrequencyChart data={data} />)

    expect(screen.getByText(/Statistics unavailable/)).toBeInTheDocument()
  })
})

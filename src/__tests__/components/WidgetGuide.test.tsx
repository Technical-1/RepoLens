import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import WidgetGuide from '@/components/features/about/WidgetGuide'

describe('WidgetGuide', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a live preview image for each widget', () => {
    render(<WidgetGuide />)
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(3)
    imgs.forEach((img) => {
      expect(img.getAttribute('src')).toContain('theme=dark')
    })
  })

  it('switches every preview to light when the light toggle is pressed', () => {
    render(<WidgetGuide />)
    fireEvent.click(screen.getByRole('button', { name: /^light$/i }))
    screen.getAllByRole('img').forEach((img) => {
      expect(img.getAttribute('src')).toContain('theme=light')
    })
  })

  it('hides snippet code until "Show code" is clicked, then copies markdown', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    render(<WidgetGuide />)
    const first = screen.getByText('Code Statistics').closest('div')!

    // Code (and its copy buttons) are hidden until the disclosure is opened.
    expect(
      within(first).queryByRole('button', { name: /copy markdown snippet for code statistics/i })
    ).toBeNull()

    fireEvent.click(within(first).getByRole('button', { name: /show code/i }))

    const copyBtn = within(first).getByRole('button', {
      name: /copy markdown snippet for code statistics/i,
    })
    fireEvent.click(copyBtn)

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0][0]).toContain('/api/embed/code-stats')
    await waitFor(() => expect(within(first).getByText('Copied')).toBeInTheDocument())
  })
})

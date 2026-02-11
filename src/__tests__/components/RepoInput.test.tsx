import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RepoInput from '@/components/ui/RepoInput'

describe('RepoInput', () => {
  it('renders the input field and button', () => {
    render(<RepoInput onAnalyze={vi.fn()} isLoading={false} />)
    expect(screen.getByLabelText('GitHub repository URL')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument()
  })

  it('renders example repo buttons', () => {
    render(<RepoInput onAnalyze={vi.fn()} isLoading={false} />)
    expect(screen.getByText('facebook/react')).toBeInTheDocument()
    expect(screen.getByText('vercel/next.js')).toBeInTheDocument()
  })

  it('calls onAnalyze with trimmed URL on form submit', () => {
    const onAnalyze = vi.fn()
    render(<RepoInput onAnalyze={onAnalyze} isLoading={false} />)

    const input = screen.getByLabelText('GitHub repository URL')
    fireEvent.change(input, { target: { value: '  facebook/react  ' } })
    fireEvent.submit(input.closest('form')!)

    expect(onAnalyze).toHaveBeenCalledWith('facebook/react')
  })

  it('does not call onAnalyze for empty input', () => {
    const onAnalyze = vi.fn()
    render(<RepoInput onAnalyze={onAnalyze} isLoading={false} />)

    fireEvent.submit(screen.getByLabelText('GitHub repository URL').closest('form')!)
    expect(onAnalyze).not.toHaveBeenCalled()
  })

  it('disables input and button when loading', () => {
    render(<RepoInput onAnalyze={vi.fn()} isLoading={true} />)
    expect(screen.getByLabelText('GitHub repository URL')).toBeDisabled()
    expect(screen.getByRole('button', { name: /analyzing/i })).toBeDisabled()
  })

  it('displays error message when error prop is set', () => {
    render(
      <RepoInput onAnalyze={vi.fn()} isLoading={false} error="Repository not found" />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Repository not found')
  })

  it('does not display error div when no error', () => {
    render(<RepoInput onAnalyze={vi.fn()} isLoading={false} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('fills input when clicking an example repo', () => {
    render(<RepoInput onAnalyze={vi.fn()} isLoading={false} />)

    fireEvent.click(screen.getByText('facebook/react'))

    const input = screen.getByLabelText('GitHub repository URL') as HTMLInputElement
    expect(input.value).toBe('github.com/facebook/react')
  })

  it('uses initialValue prop', () => {
    render(<RepoInput onAnalyze={vi.fn()} isLoading={false} initialValue="vercel/next.js" />)
    const input = screen.getByLabelText('GitHub repository URL') as HTMLInputElement
    expect(input.value).toBe('vercel/next.js')
  })
})

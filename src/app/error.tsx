'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Future: send to error tracking (e.g., Sentry)
    }
  }, [error])

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4">
      <div className="glass-card rounded-xl p-8 border border-red-500/30 max-w-lg w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-red-500/10">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-github-muted mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="btn-primary px-6 py-2.5 rounded-lg text-white font-medium inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  )
}

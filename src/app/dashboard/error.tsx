'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Future: send to error tracking
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
        <h2 className="text-xl font-semibold text-white mb-2">Dashboard Error</h2>
        <p className="text-github-muted mb-6">
          Failed to load the dashboard. This might be a temporary issue.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn-primary px-6 py-2.5 rounded-lg text-white font-medium inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg text-github-muted hover:text-white border border-github-border hover:border-github-border/80 transition-colors inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}

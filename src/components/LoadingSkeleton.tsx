'use client'

import { Loader2 } from 'lucide-react'

export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-github-accent" />
        <p className="text-github-muted">Loading...</p>
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-6 border border-github-border/50 animate-pulse">
      <div className="h-6 bg-github-border/30 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-github-border/30 rounded w-full" />
        <div className="h-4 bg-github-border/30 rounded w-2/3" />
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="glass-card rounded-xl p-4 border border-github-border/50 animate-pulse">
          <div className="h-8 w-8 bg-github-border/30 rounded-lg mb-3" />
          <div className="h-8 bg-github-border/30 rounded w-16 mb-2" />
          <div className="h-4 bg-github-border/30 rounded w-20" />
        </div>
      ))}
    </div>
  )
}


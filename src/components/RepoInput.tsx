'use client'

import { useState } from 'react'
import { Search, Loader2, Github, AlertCircle } from 'lucide-react'

interface RepoInputProps {
  onAnalyze: (url: string) => void
  isLoading: boolean
  error?: string | null
  initialValue?: string
}

export default function RepoInput({ onAnalyze, isLoading, error, initialValue = '' }: RepoInputProps) {
  const [url, setUrl] = useState(initialValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onAnalyze(url.trim())
    }
  }

  const exampleRepos = [
    'facebook/react',
    'vercel/next.js',
    'microsoft/vscode',
    'torvalds/linux',
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-github-muted">
            <Github className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a GitHub repo URL (e.g., github.com/owner/repo)"
            className="w-full pl-12 pr-32 py-4 bg-github-card border border-github-border rounded-xl text-github-text placeholder:text-github-muted/60 focus:border-github-accent transition-colors text-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="absolute right-2 btn-primary px-6 py-2.5 rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2 justify-center">
        <span className="text-github-muted text-sm">Try:</span>
        {exampleRepos.map((repo) => (
          <button
            key={repo}
            onClick={() => setUrl(`github.com/${repo}`)}
            className="px-3 py-1.5 text-sm bg-github-card hover:bg-github-border/50 border border-github-border rounded-lg text-github-muted hover:text-github-text transition-colors"
          >
            {repo}
          </button>
        ))}
      </div>
    </div>
  )
}

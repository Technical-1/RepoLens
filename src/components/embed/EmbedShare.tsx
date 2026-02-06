'use client'

import { useState } from 'react'
import { Code, Copy, Check, ExternalLink, X } from 'lucide-react'

interface EmbedShareProps {
  repoFullName: string
  onClose: () => void
}

type EmbedType = 'stats' | 'code-stats' | 'languages'
type Theme = 'dark' | 'light'

const EMBED_LABELS: Record<EmbedType, string> = {
  'stats': 'Repo Stats',
  'code-stats': 'Code Stats',
  'languages': 'Languages',
}

export default function EmbedShare({ repoFullName, onClose }: EmbedShareProps) {
  const [selectedType, setSelectedType] = useState<EmbedType>('stats')
  const [theme, setTheme] = useState<Theme>('dark')
  const [hideRepoName, setHideRepoName] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [owner, repo] = repoFullName.split('/')
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://repolens.io'

  const buildEmbedUrl = (type: EmbedType) => {
    const params = new URLSearchParams({
      owner,
      repo,
      theme,
    })
    if (hideRepoName) {
      params.set('hideRepoName', 'true')
    }
    return `${baseUrl}/api/embed/${type}?${params.toString()}`
  }

  const embedUrls: Record<EmbedType, string> = {
    'stats': buildEmbedUrl('stats'),
    'code-stats': buildEmbedUrl('code-stats'),
    'languages': buildEmbedUrl('languages'),
  }

  const markdownCode = `[![RepoLens ${selectedType}](${embedUrls[selectedType]})](${baseUrl}/?repo=${repoFullName})`
  const htmlCode = `<a href="${baseUrl}/?repo=${repoFullName}"><img src="${embedUrls[selectedType]}" alt="RepoLens ${selectedType}" /></a>`

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-xl border border-github-border/50 w-full max-w-2xl max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-github-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-github-accent/20">
              <Code className="w-5 h-5 text-github-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Embed in README</h2>
              <p className="text-sm text-github-muted">Add stats to your repository README</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-github-border/50 rounded-lg transition-colors text-github-muted hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-github-text mb-3">Widget Type</label>
            <div className="flex flex-wrap gap-3">
              {(['stats', 'code-stats', 'languages'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-github-accent text-white'
                      : 'bg-github-card text-github-muted hover:text-white border border-github-border'
                  }`}
                >
                  {EMBED_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-github-text mb-3">Theme</label>
            <div className="flex gap-3">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    theme === t
                      ? 'bg-github-accent text-white'
                      : 'bg-github-card text-github-muted hover:text-white border border-github-border'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Hide Repo Name Option */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hideRepoName}
                onChange={(e) => setHideRepoName(e.target.checked)}
                className="w-5 h-5 rounded border-github-border bg-github-card text-github-accent focus:ring-github-accent focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm font-medium text-github-text">Hide repository name</span>
            </label>
            <p className="text-xs text-github-muted mt-1 ml-8">Show only the stats without the repo name header</p>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-github-text mb-3">Preview</label>
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-[#0d1117]' : 'bg-white'} border border-github-border/50`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={embedUrls[selectedType]}
                alt={`${selectedType} preview`}
                className="w-full max-w-md mx-auto rounded-lg"
              />
            </div>
            <a
              href={embedUrls[selectedType]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-sm text-github-link hover:underline"
            >
              Open image in new tab
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Markdown Code */}
          <div>
            <label className="block text-sm font-medium text-github-text mb-3">Markdown (for README.md)</label>
            <div className="relative">
              <pre className="p-4 bg-github-dark rounded-lg border border-github-border/50 overflow-x-auto text-sm text-github-text">
                <code>{markdownCode}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(markdownCode, 'markdown')}
                className="absolute top-2 right-2 p-2 bg-github-card hover:bg-github-border/50 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copiedField === 'markdown' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-github-muted" />
                )}
              </button>
            </div>
          </div>

          {/* HTML Code */}
          <div>
            <label className="block text-sm font-medium text-github-text mb-3">HTML</label>
            <div className="relative">
              <pre className="p-4 bg-github-dark rounded-lg border border-github-border/50 overflow-x-auto text-sm text-github-text">
                <code>{htmlCode}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(htmlCode, 'html')}
                className="absolute top-2 right-2 p-2 bg-github-card hover:bg-github-border/50 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copiedField === 'html' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-github-muted" />
                )}
              </button>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-github-text mb-3">Direct Image URL</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={embedUrls[selectedType]}
                className="w-full p-3 pr-12 bg-github-dark rounded-lg border border-github-border/50 text-sm text-github-text"
              />
              <button
                onClick={() => copyToClipboard(embedUrls[selectedType], 'url')}
                className="absolute top-1/2 -translate-y-1/2 right-2 p-2 bg-github-card hover:bg-github-border/50 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copiedField === 'url' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-github-muted" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


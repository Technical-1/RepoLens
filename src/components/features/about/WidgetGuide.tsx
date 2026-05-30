'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  WIDGETS,
  SAMPLE_OWNER,
  SAMPLE_REPO,
  embedSrc,
  markdownSnippet,
  htmlSnippet,
  type WidgetTheme,
} from './widgets'

export default function WidgetGuide() {
  const [theme, setTheme] = useState<WidgetTheme>('dark')
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard?.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <section id="widgets" className="scroll-mt-32 py-12">
      <h2 className="text-2xl font-bold text-white mb-2">Embeddable widgets</h2>
      <p className="text-github-muted mb-6 max-w-3xl">
        Drop a live RepoLens badge into any README. Toggle the theme, then copy a snippet.
      </p>

      <div
        role="group"
        aria-label="Widget theme"
        className="inline-flex rounded-lg border border-github-border overflow-hidden mb-8"
      >
        {(['dark', 'light'] as WidgetTheme[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            aria-pressed={theme === t}
            className={`px-4 py-2 text-sm capitalize transition-colors ${
              theme === t
                ? 'bg-github-accent text-white'
                : 'bg-github-card text-github-muted hover:text-github-text'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {WIDGETS.map((w) => {
          const snippets = [
            { id: `${w.key}-md`, label: 'Markdown', value: markdownSnippet(w, SAMPLE_OWNER, SAMPLE_REPO, theme) },
            { id: `${w.key}-html`, label: 'HTML', value: htmlSnippet(w, SAMPLE_OWNER, SAMPLE_REPO, theme) },
          ]
          return (
            <div key={w.key} className="glass-card rounded-xl border border-github-border/50 p-6">
              <h3 className="text-lg font-semibold text-white">{w.label}</h3>
              <p className="text-sm text-github-muted mb-4">{w.description}</p>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={embedSrc(w.key, SAMPLE_OWNER, SAMPLE_REPO, theme)}
                width={400}
                alt={w.alt}
                className="rounded-lg mb-4 max-w-full"
              />

              <div className="space-y-3">
                {snippets.map((snip) => (
                  <div key={snip.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase tracking-wide text-github-muted">{snip.label}</span>
                      <button
                        onClick={() => copy(snip.id, snip.value)}
                        aria-label={`Copy ${snip.label} snippet for ${w.label}`}
                        className="flex items-center gap-1 text-xs text-github-link hover:text-white transition-colors"
                      >
                        {copied === snip.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === snip.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-github-darker border border-github-border p-3 text-xs text-github-text">
                      <code>{snip.value}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-sm text-github-muted mt-6">
        Params: <code>owner</code>, <code>repo</code>, <code>theme</code> (<code>dark</code> | <code>light</code>),
        and <code>hideRepoName=true</code> to hide the repo name.
      </p>
    </section>
  )
}

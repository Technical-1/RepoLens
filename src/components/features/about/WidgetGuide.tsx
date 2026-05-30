'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Check, ChevronDown } from 'lucide-react'
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
  const [openCode, setOpenCode] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard?.writeText(text)
      setCopied(id)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <section id="widgets" className="scroll-mt-32 py-12">
      <h2 className="text-2xl font-bold text-white mb-2">Embed repo badges in your README</h2>
      <p className="text-github-muted mb-8 max-w-3xl">
        Add live stats badges for any public GitHub repository to your README, docs, or site —
        they refresh on their own as the repo changes. Pick a theme, preview the badges below,
        then reveal and copy the snippet for the one you want.
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

      <div className="grid gap-6 sm:grid-cols-3">
        {WIDGETS.map((w) => {
          const isOpen = openCode === w.key
          const snippets = [
            { id: `${w.key}-md`, label: 'Markdown', value: markdownSnippet(w, SAMPLE_OWNER, SAMPLE_REPO, theme) },
            { id: `${w.key}-html`, label: 'HTML', value: htmlSnippet(w, SAMPLE_OWNER, SAMPLE_REPO, theme) },
          ]
          return (
            <div key={w.key} className="glass-card rounded-xl border border-github-border/50 p-5 flex flex-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={embedSrc(w.key, SAMPLE_OWNER, SAMPLE_REPO, theme)}
                width={400}
                alt={w.alt}
                className="w-full h-auto rounded-lg"
              />

              <h3 className="mt-4 text-base font-semibold tracking-tight text-white">{w.label}</h3>
              <p className="mt-1 text-sm text-github-muted flex-1">{w.description}</p>

              <button
                onClick={() => setOpenCode(isOpen ? null : w.key)}
                aria-expanded={isOpen}
                className="mt-4 inline-flex items-center gap-1.5 self-start text-sm text-github-link hover:text-white transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                {isOpen ? 'Hide code' : 'Show code'}
              </button>

              {isOpen && (
                <div className="mt-3 space-y-3">
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
              )}
            </div>
          )
        })}
      </div>

      <p className="text-sm text-github-muted mt-6">
        Swap in any public repository by changing the <code>owner</code> and <code>repo</code> values
        in the snippet. Other params: <code>theme</code> (<code>dark</code> | <code>light</code>) and{' '}
        <code>hideRepoName=true</code>.
      </p>
    </section>
  )
}

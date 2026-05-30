'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FaqItem {
  q: string
  a: string
}

const FAQ: FaqItem[] = [
  {
    q: 'Why are some of my private repos missing?',
    a: 'RepoLens only sees private repositories after you sign in with GitHub and grant access. Without signing in, only public repositories are available.',
  },
  {
    q: 'How accurate are the line counts?',
    a: 'Line totals are computed from commit additions and deletions across the history RepoLens fetches. Very large repositories are analyzed over their recent history, so totals are a close estimate rather than a full file-by-file count.',
  },
  {
    q: 'Is any of my data stored?',
    a: 'No. RepoLens never persists your credentials or repository data. Authentication happens directly with GitHub and stats are computed on demand.',
  },
  {
    q: 'Why does a large repo take a moment to analyze?',
    a: 'Commit history is walked through the GitHub GraphQL API and is subject to rate limits. Bigger repositories simply have more history to page through.',
  },
]

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="scroll-mt-32 py-12">
      <h2 className="text-2xl font-bold text-white mb-6">FAQ</h2>
      <div className="space-y-3">
        {FAQ.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} className="glass-card rounded-xl border border-github-border/50 overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-medium text-white">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-github-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && <p className="px-5 pb-5 text-github-muted">{item.a}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}

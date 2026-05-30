'use client'

import { useEffect, useState } from 'react'

export interface NavSection {
  id: string
  label: string
}

export const ABOUT_SECTIONS: NavSection[] = [
  { id: 'what', label: 'What' },
  { id: 'how', label: 'How it works' },
  { id: 'widgets', label: 'Widgets' },
  { id: 'faq', label: 'FAQ' },
]

export default function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActive(visible[0].target.id)
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav className="sticky top-16 z-40 -mx-4 px-4 py-3 bg-github-darker/80 backdrop-blur-lg border-b border-github-border/50">
      <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
              active === s.id ? 'bg-github-accent text-white' : 'text-github-muted hover:text-github-text'
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

import type { Metadata } from 'next'
import AboutContent from '@/components/features/about/AboutContent'

export const metadata: Metadata = {
  title: 'About & Widgets',
  description:
    'Learn what RepoLens is, how it computes repository stats, and how to embed live RepoLens widgets in your README. Includes a frequently asked questions section.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About RepoLens — How it works & embeddable widgets',
    description:
      'What RepoLens is, how it computes stats, an interactive widget guide, and FAQ.',
    url: '/about',
  },
}

export default function AboutPage() {
  return <AboutContent />
}

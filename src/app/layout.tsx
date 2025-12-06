import type { Metadata, Viewport } from 'next'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://repolens.io'

export const metadata: Metadata = {
  title: {
    default: 'RepoLens - GitHub Repository Stats Analyzer',
    template: '%s | RepoLens',
  },
  description:
    'Analyze any GitHub repository with detailed insights into lines of code, language breakdown, commit history, and contributor statistics. Free and open source.',
  keywords: [
    'github',
    'repository',
    'stats',
    'analytics',
    'lines of code',
    'commits',
    'contributors',
    'language breakdown',
    'code analysis',
    'open source',
    'developer tools',
  ],
  authors: [{ name: 'RepoLens' }],
  creator: 'RepoLens',
  publisher: 'RepoLens',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'RepoLens - GitHub Repository Stats Analyzer',
    description:
      'Analyze any GitHub repository with detailed insights into lines of code, language breakdown, commit history, and contributor statistics.',
    url: siteUrl,
    siteName: 'RepoLens',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepoLens - GitHub Repository Stats Analyzer',
    description:
      'Analyze any GitHub repository with detailed insights into lines of code, language breakdown, commit history, and contributor statistics.',
    creator: '@repolens',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  manifest: '/manifest.json',
  category: 'technology',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0d1117' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  )
}

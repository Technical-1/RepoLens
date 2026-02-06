import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { getWebApplicationJsonLd } from '@/lib/structured-data'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

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
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepoLens - GitHub Repository Stats Analyzer',
    description:
      'Analyze any GitHub repository with detailed insights into lines of code, language breakdown, commit history, and contributor statistics.',
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
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
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
  const jsonLd = getWebApplicationJsonLd()

  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import './globals.css'

export const metadata: Metadata = {
  title: 'RepoLens - GitHub Repository Stats',
  description: 'Analyze any GitHub repository: lines of code, language breakdown, commit history, and more.',
  keywords: ['github', 'repository', 'stats', 'lines of code', 'analytics', 'commits'],
  authors: [{ name: 'RepoLens' }],
  openGraph: {
    title: 'RepoLens - GitHub Repository Stats',
    description: 'Analyze any GitHub repository: lines of code, language breakdown, commit history, and more.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}

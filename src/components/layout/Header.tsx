'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Github, LogIn, LogOut, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-github-border/50 bg-github-darker/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-github-accent to-green-400 flex items-center justify-center">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">RepoLens</h1>
              <p className="text-xs text-github-muted -mt-0.5">GitHub Stats Analyzer</p>
            </div>
          </Link>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="flex items-center gap-2 text-github-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : session?.user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm text-github-text hidden sm:block">
                    {session.user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-github-card hover:bg-github-border/50 border border-github-border rounded-lg text-github-text transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('github')}
                className="flex items-center gap-2 px-4 py-2 text-sm btn-primary rounded-lg text-white font-medium"
              >
                <LogIn className="w-4 h-4" />
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

'use client'

import { Shield, ExternalLink } from 'lucide-react'

export default function PrivacyNotice() {
  return (
    <div className="glass-card rounded-xl p-6 border border-github-border/50">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-green-500/10">
          <Shield className="w-6 h-6 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-github-text mb-2">
            Your Privacy is Protected
          </h3>
          <p className="text-github-muted text-sm leading-relaxed mb-4">
            We never store your login credentials, personal information, or access tokens. 
            All authentication happens directly with GitHub&apos;s secure OAuth system. Your data 
            is only used in real-time to display repository statistics and is never saved 
            to any database.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-github-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              OAuth tokens stay in your browser session only
            </li>
            <li className="flex items-center gap-2 text-github-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              No server-side storage of credentials
            </li>
            <li className="flex items-center gap-2 text-github-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              Direct API calls to GitHub—no middleman
            </li>
            <li className="flex items-center gap-2 text-github-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              Sign out anytime to revoke access
            </li>
          </ul>
          <a
            href="https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-github-link text-sm mt-4 hover:underline"
          >
            Learn more about GitHub OAuth
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

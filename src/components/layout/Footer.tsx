'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-github-border/50 py-8 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-github-muted">
          <a
            href="https://jacobkanfer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-github-text transition-colors group"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 384 384"
              className="opacity-60 group-hover:opacity-100 transition-opacity"
              fill="currentColor"
            >
              <g transform="matrix(1.3333333,0,0,-1.3333333,0,384)">
                <g transform="scale(0.1)">
                  <path d="M 230.73,2650.1 H 2649.92 V 2487.99 H 2880 V 2880 H 0 V 1319.25 H 230.73 V 2650.1" />
                  <path d="M 2649.92,2057.71 V 949.75 L 2880,612.801 V 2397.09 l -230.08,-339.38" />
                  <path d="M 2879.97,390.34 H 2649.92 V 228.719 H 230.73 V 521.922 L 0,656.16 V 0 h 2880 v 390.34 h -0.03" />
                  <path d="m 2175.09,1502.81 c 0,0 602.57,885.59 615.54,904.98 -40.45,0 -721.68,0 -721.68,0 l -472.6,-812.43 c 0,0 0,514.94 0,812.43 -239.68,0 -713.729,0 -713.729,0 V 839.539 H 703.008 V 1239.06 H 0 V 748.961 L 478.535,470.539 H 1596.35 l 0.09,822.531 566.93,-822.531 h 716.6 L 2175.09,1502.81" />
                </g>
              </g>
            </svg>
            <span>Built by Jacob Kanfer</span>
          </a>
          <Link href="/about" className="hover:text-github-text transition-colors">
            About &amp; Widgets
          </Link>
          <p>Built with Next.js 15, React 19, and the GitHub API</p>
        </div>
      </div>
    </footer>
  )
}


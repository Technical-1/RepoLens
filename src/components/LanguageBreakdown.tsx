'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { FullRepoAnalysis } from '@/types'

interface LanguageBreakdownProps {
  data: FullRepoAnalysis
}

export default function LanguageBreakdown({ data }: LanguageBreakdownProps) {
  const [showAll, setShowAll] = useState(false)
  
  const formatBytes = (bytes: number): string => {
    if (bytes >= 1000000) return (bytes / 1000000).toFixed(1) + ' MB'
    if (bytes >= 1000) return (bytes / 1000).toFixed(1) + ' KB'
    return bytes + ' B'
  }

  const totalBytes = data.languagePercentages.reduce((sum, l) => sum + l.bytes, 0)
  const displayedLanguages = showAll 
    ? data.languagePercentages 
    : data.languagePercentages.slice(0, 10)
  const hasMore = data.languagePercentages.length > 10

  return (
    <div className="glass-card rounded-xl p-6 border border-github-border/50 fade-in">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></span>
        Language Breakdown
      </h3>

      {/* Language Bar */}
      <div className="language-bar mb-6" title="Language distribution">
        {data.languagePercentages.map((lang) => (
          <div
            key={lang.name}
            className="language-segment"
            style={{
              width: `${lang.percentage}%`,
              backgroundColor: lang.color,
              minWidth: lang.percentage > 0.5 ? '4px' : '0',
            }}
            title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Language List */}
      <div className="space-y-2">
        {displayedLanguages.map((lang) => (
          <div
            key={lang.name}
            className="flex items-center justify-between p-3 rounded-lg bg-github-dark/50 hover:bg-github-border/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: lang.color }}
              />
              <span className="text-github-text font-medium truncate">{lang.name}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-sm flex-shrink-0 ml-3">
              <span className="text-github-muted hidden sm:inline">{formatBytes(lang.bytes)}</span>
              <span className="text-github-text font-mono bg-github-card px-2 py-0.5 rounded text-xs sm:text-sm">
                {lang.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2 text-github-link hover:text-github-text flex items-center justify-center gap-2 transition-colors text-sm"
        >
          {showAll ? (
            <>
              Show Less
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Show All {data.languagePercentages.length} Languages
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-github-border/50 flex items-center justify-between text-sm">
        <span className="text-github-muted">Total code size</span>
        <span className="text-github-text font-medium">{formatBytes(totalBytes)}</span>
      </div>
    </div>
  )
}

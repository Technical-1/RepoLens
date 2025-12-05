'use client'

import type { FullRepoAnalysis } from '@/types'

interface LanguageBreakdownProps {
  data: FullRepoAnalysis
}

export default function LanguageBreakdown({ data }: LanguageBreakdownProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes >= 1000000) return (bytes / 1000000).toFixed(1) + ' MB'
    if (bytes >= 1000) return (bytes / 1000).toFixed(1) + ' KB'
    return bytes + ' B'
  }

  const totalBytes = data.languagePercentages.reduce((sum, l) => sum + l.bytes, 0)

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.languagePercentages.map((lang) => (
          <div
            key={lang.name}
            className="flex items-center justify-between p-3 rounded-lg bg-github-dark/50 hover:bg-github-border/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: lang.color }}
              />
              <span className="text-github-text font-medium">{lang.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-github-muted">{formatBytes(lang.bytes)}</span>
              <span className="text-github-text font-mono bg-github-card px-2 py-0.5 rounded">
                {lang.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-github-border/50 flex items-center justify-between text-sm">
        <span className="text-github-muted">Total code size</span>
        <span className="text-github-text font-medium">{formatBytes(totalBytes)}</span>
      </div>
    </div>
  )
}

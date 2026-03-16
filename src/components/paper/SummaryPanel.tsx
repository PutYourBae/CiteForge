import React, { useState } from 'react'
import { Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { PaperSummaries } from '../../types/ai.types'

interface SummaryPanelProps {
  summaries: PaperSummaries | undefined
  isLoading: boolean
  onGenerate?: () => void
}

const MODE_LABELS: Record<string, string> = {
  local_rules: 'TextRank (Local)',
  ollama: 'Ollama (Local AI)',
  gemini: 'Gemini Flash',
  openai: 'GPT-4o Mini',
}

export function SummaryPanel({ summaries, isLoading, onGenerate }: SummaryPanelProps) {
  const [showFull, setShowFull] = useState(false)

  if (isLoading) {
    return (
      <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs text-[#A78BFA]">
          <Loader2 size={13} className="animate-spin" />
          Generating AI summary…
        </div>
      </div>
    )
  }

  if (!summaries) {
    if (onGenerate) {
      return (
        <div className="bg-[#1A1D27] border border-[#2D3149] rounded-xl p-4">
          <button
            onClick={onGenerate}
            className="flex items-center gap-2 text-sm text-[#94A3B8]
                       hover:text-[#A78BFA] transition-colors"
          >
            <Sparkles size={14} className="text-[#7C3AED]" />
            Generate AI Summary
          </button>
        </div>
      )
    }
    return null
  }

  const modeLabel = MODE_LABELS[summaries.generatedBy ?? 'local_rules']

  return (
    <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#A78BFA] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={10} /> AI Summary
        </h3>
        <span className="text-[10px] text-[#7C3AED] bg-[#7C3AED]/10
                          px-2 py-0.5 rounded-full">
          {modeLabel}
        </span>
      </div>

      {/* Short summary */}
      {summaries.short && (
        <p className="text-sm text-[#F1F5F9]/85 leading-relaxed">
          {summaries.short}
        </p>
      )}

      {/* Key contributions */}
      {summaries.keyContributions && summaries.keyContributions.length > 0 && (
        <div>
          <p className="text-[11px] text-[#A78BFA] font-semibold mb-1.5 uppercase tracking-wider">
            Key Contributions
          </p>
          <ul className="space-y-1">
            {summaries.keyContributions.slice(0, 3).map((c, i) => (
              <li key={i} className="flex gap-2 text-xs text-[#F1F5F9]/75 leading-relaxed">
                <span className="text-[#7C3AED] shrink-0 mt-0.5">•</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full research summary (expandable) */}
      {summaries.research && summaries.research !== summaries.short && (
        <div>
          <button
            onClick={() => setShowFull(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-[#A78BFA]
                       hover:text-[#C4B5FD] transition-colors mb-2"
          >
            {showFull ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showFull ? 'Show less' : 'Full research summary'}
          </button>
          {showFull && (
            <p className="text-xs text-[#F1F5F9]/75 leading-relaxed">
              {summaries.research}
            </p>
          )}
        </div>
      )}

      {/* Method overview */}
      {showFull && summaries.methodOverview && (
        <div>
          <p className="text-[11px] text-[#A78BFA] font-semibold mb-1 uppercase tracking-wider">
            Methodology
          </p>
          <p className="text-xs text-[#F1F5F9]/75 leading-relaxed">
            {summaries.methodOverview}
          </p>
        </div>
      )}
    </div>
  )
}

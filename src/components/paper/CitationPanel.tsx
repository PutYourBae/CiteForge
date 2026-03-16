import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { CitationFormat } from '../../types/ai.types'

interface CitationPanelProps {
  citations: Record<CitationFormat, string>
}

const FORMATS: CitationFormat[] = ['apa', 'ieee', 'mla', 'chicago']
const FORMAT_LABELS: Record<CitationFormat, string> = {
  apa: 'APA 7th', ieee: 'IEEE', mla: 'MLA 9th', chicago: 'Chicago'
}

export function CitationPanel({ citations }: CitationPanelProps) {
  const [activeFormat, setActiveFormat] = useState<CitationFormat>('apa')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(citations[activeFormat])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#1A1D27] border border-[#2D3149] rounded-xl p-4">
      <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
        Citation Generator
      </h3>

      {/* Format tabs */}
      <div className="flex gap-1 mb-3">
        {FORMATS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFormat(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                        ${activeFormat === f
                          ? 'bg-[#4F8EF7] text-white'
                          : 'bg-[#21253A] text-[#94A3B8] hover:text-white'
                        }`}
          >
            {FORMAT_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Citation text */}
      <div className="bg-[#21253A] rounded-lg p-3 mb-3 min-h-[64px]">
        <p
          className="text-xs text-[#F1F5F9]/80 leading-relaxed font-mono"
          dangerouslySetInnerHTML={{
            __html: citations[activeFormat]
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
          }}
        />
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-150 active:scale-95
                    ${copied
                      ? 'bg-[#10B981]/15 text-[#10B981]'
                      : 'bg-[#21253A] text-[#94A3B8] hover:text-white hover:bg-[#2D3149]'
                    }`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>
    </div>
  )
}

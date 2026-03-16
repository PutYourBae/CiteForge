import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tags, X, Plus } from 'lucide-react'
import { useSearchStore } from '../../store/search.store'

interface KeywordBarProps {
  onKeywordChange?: () => void;
  className?: string; // allow overrides (e.g. rounded vs straight borders)
}

export function KeywordBar({ onKeywordChange, className = '' }: KeywordBarProps) {
  const { keywords, setKeywords } = useSearchStore()
  
  const [kwInput, setKwInput] = useState('')
  const [chips, setChips] = useState<string[]>([])

  // Parse keywords from store when component mounts
  useEffect(() => {
    if (keywords) {
      setChips(keywords.split(',').map(s => s.trim()).filter(Boolean))
    } else {
      setChips([])
    }
  }, [keywords])

  const updateChips = (newChips: string[]) => {
    setChips(newChips)
    setKeywords(newChips.join(', '))
    if (onKeywordChange) {
      // Delay so state updates first
      setTimeout(onKeywordChange, 0)
    }
  }

  const handleKwKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && kwInput.trim()) {
      e.preventDefault()
      if (!chips.includes(kwInput.trim())) {
        updateChips([...chips, kwInput.trim()])
      }
      setKwInput('')
    }
  }

  const removeChip = (i: number) => {
    updateChips(chips.filter((_, idx) => idx !== i))
  }

  return (
    <div className={`border border-[#2D3149] bg-[#13172A]/60 px-3 py-2.5 focus-within:border-[#4F8EF7]/50 transition-colors ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[#4F8EF7]/70 shrink-0">
          <Tags size={13} />
          <span className="text-[11px] font-medium text-[#64748B]">Keywords</span>
        </div>

        {chips.map((chip, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full
                       bg-[#4F8EF7]/10 border border-[#4F8EF7]/25
                       text-[#7DB4FF] text-[11px] font-medium"
          >
            {chip}
            <button
              onClick={() => removeChip(i)}
              className="text-[#4F8EF7]/50 hover:text-[#FF5B77] transition-colors ml-0.5"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={kwInput}
          onChange={e => setKwInput(e.target.value)}
          onKeyDown={handleKwKeyDown}
          placeholder={chips.length === 0 ? 'Add keyword and press Enter...' : 'Add more...'}
          className="flex-1 min-w-[160px] bg-transparent text-[#CBD5E1] text-[12px]
                     placeholder:text-[#364060] outline-none"
        />

        {kwInput.trim() && (
          <button
            onClick={() => {
              if (!chips.includes(kwInput.trim())) {
                updateChips([...chips, kwInput.trim()])
              }
              setKwInput('')
            }}
            className="text-[#4F8EF7] hover:text-white transition-colors shrink-0"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

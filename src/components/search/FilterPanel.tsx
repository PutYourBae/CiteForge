import React, { useState } from 'react'
import { SearchFilters } from '../../types/search.types'

interface FilterPanelProps {
  filters: SearchFilters
  onChange: (f: SearchFilters) => void
}

const CURRENT_YEAR = new Date().getFullYear()
const PUB_TYPES = ['journal', 'conference', 'thesis', 'preprint'] as const

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const update = (patch: Partial<SearchFilters>) =>
    onChange({ ...filters, ...patch })

  const toggleType = (type: (typeof PUB_TYPES)[number]) => {
    const current = filters.publicationType ?? []
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    update({ publicationType: updated.length ? updated : undefined })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-1">
      {/* Year range */}
      <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
        <span>Year:</span>
        <input
          type="number"
          min={1900}
          max={CURRENT_YEAR}
          placeholder="From"
          value={filters.yearFrom ?? ''}
          onChange={e => update({ yearFrom: e.target.value ? +e.target.value : undefined })}
          className="w-16 px-2 py-1 rounded-md bg-[#21253A] border border-[#2D3149]
                     text-white text-[11px] focus:outline-none focus:border-[#4F8EF7]/50"
        />
        <span>–</span>
        <input
          type="number"
          min={1900}
          max={CURRENT_YEAR}
          placeholder="To"
          value={filters.yearTo ?? ''}
          onChange={e => update({ yearTo: e.target.value ? +e.target.value : undefined })}
          className="w-16 px-2 py-1 rounded-md bg-[#21253A] border border-[#2D3149]
                     text-white text-[11px] focus:outline-none focus:border-[#4F8EF7]/50"
        />
      </div>

      {/* Access type */}
      <div className="flex items-center gap-1">
        {(['all', 'open_access', 'paid'] as const).map(t => (
          <button
            key={t}
            onClick={() => update({ accessType: t })}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors
                        ${(filters.accessType ?? 'all') === t
                          ? 'bg-[#4F8EF7] text-white'
                          : 'bg-[#21253A] text-[#94A3B8] hover:text-white'
                        }`}
          >
            {t === 'all' ? 'All' : t === 'open_access' ? 'Open Access' : 'Paid'}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={filters.sortBy ?? 'relevance'}
        onChange={e => update({ sortBy: e.target.value as SearchFilters['sortBy'] })}
        className="px-2 py-1 rounded-md bg-[#21253A] border border-[#2D3149]
                   text-[#94A3B8] text-[11px] focus:outline-none cursor-pointer"
      >
        <option value="relevance">Relevance</option>
        <option value="citations">Citations</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>

      {/* Publication type toggles */}
      <div className="flex items-center gap-1">
        {PUB_TYPES.map(t => {
          const active = filters.publicationType?.includes(t)
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors
                          ${active
                            ? 'border-[#4F8EF7]/60 bg-[#4F8EF7]/15 text-[#4F8EF7]'
                            : 'border-[#2D3149] text-[#94A3B8] hover:border-[#4F8EF7]/30'
                          }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

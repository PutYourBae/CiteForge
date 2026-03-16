import React, { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  autoFocus?: boolean
  placeholder?: string
  defaultValue?: string
}

export function SearchBar({ onSearch, autoFocus, placeholder, defaultValue }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue ?? '')

  const submit = () => {
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <div className="relative flex items-center">
      <Search
        size={18}
        className="absolute left-4 text-[#94A3B8] pointer-events-none z-10"
      />
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        autoFocus={autoFocus}
        placeholder={placeholder ?? 'Search papers…'}
        className="w-full pl-11 pr-24 py-4 rounded-xl bg-[#1A1D27] border border-[#2D3149]
                   text-white placeholder-[#94A3B8]/60 text-[15px]
                   focus:outline-none focus:border-[#4F8EF7]/60 focus:bg-[#21253A]
                   transition-all duration-150 shadow-lg"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-[76px] text-[#94A3B8] hover:text-white
                     transition-colors duration-150 p-1"
        >
          <X size={15} />
        </button>
      )}
      <button
        onClick={submit}
        className="absolute right-3 px-4 py-2 rounded-lg bg-[#4F8EF7] text-white
                   text-sm font-semibold hover:bg-[#3b7df6] active:scale-95
                   transition-all duration-150"
      >
        Search
      </button>
    </div>
  )
}

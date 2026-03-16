import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { SearchBar } from '../components/search/SearchBar'
import { KeywordBar } from '../components/search/KeywordBar'
import { FilterPanel } from '../components/search/FilterPanel'
import { ResultCard } from '../components/search/ResultCard'
import { useSearchStore } from '../store/search.store'
import { useUIStore } from '../store/ui.store'
import { SearchFilters } from '../types/search.types'

export function ResultsPage() {
  const { query, keywords, results, totalFound, error, setQuery, setResults, setError } =
    useSearchStore(s => s)
  const { isSearching: loading, setSearching, navigate } = useUIStore()
  const [showFilters, setShowFilters] = useState(false)
  const { filters, setFilters } = useSearchStore()

  const handleSearch = async (text: string, currentFilters = filters) => {
    setQuery(text)
    setSearching(true)
    try {
      const fullQuery = keywords ? `${text} ${keywords}`.trim() : text
      const result = await (window as any).electronAPI.search({ text: fullQuery, filters: currentFilters })
      setResults(result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSearching(false)
    }
  }

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    handleSearch(query, newFilters)
  }

  const handleKeywordChange = () => {
    if (query) handleSearch(query)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: results list */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-[#2D3149]">
        {/* Search header */}
        <div className="px-4 py-3 border-b border-[#2D3149] bg-[#1A1D27] space-y-2 shrink-0">
          <SearchBar onSearch={handleSearch} defaultValue={query} />
          
          <KeywordBar 
            className="rounded-lg shadow-sm mb-1" 
            onKeywordChange={handleKeywordChange} 
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#94A3B8]">
              {loading ? 'Searching…' : `${totalFound.toLocaleString()} results`}
            </span>
            <button
              onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-1.5 text-xs text-[#94A3B8]
                         hover:text-[#4F8EF7] transition-colors"
            >
              <Filter size={12} />
              Filters
              <ChevronDown
                size={12}
                className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
          {showFilters && <FilterPanel filters={filters} onChange={handleFilterChange} />}
        </div>

        {/* Results scroll area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-8 h-8 border-2 border-[#4F8EF7] border-t-transparent
                              rounded-full animate-spin" />
              <p className="text-[#94A3B8] text-sm">Searching 6 databases…</p>
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <X size={32} className="text-[#EF4444] mx-auto mb-2" />
                <p className="text-[#94A3B8] text-sm">{error}</p>
              </div>
            </div>
          )}
          {!loading && !error && results.length === 0 && (
            <div className="flex items-center justify-center h-full text-[#94A3B8] text-sm">
              No results found. Try a different query.
            </div>
          )}
          {!loading && results.map((paper, i) => (
            <ResultCard key={paper.id} paper={paper} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

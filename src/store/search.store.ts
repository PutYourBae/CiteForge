import { create } from 'zustand'
import { Paper } from '../types/paper.types'
import { SearchQuery, SearchResult } from '../types/search.types'

interface SearchStore {
  query: string
  keywords: string          // secondary research-keyword bar
  filters: SearchQuery['filters']
  results: Paper[]
  totalFound: number
  sourceStats: SearchResult['sourceStats']
  searchDurationMs: number
  fromCache: boolean
  error: string | null
  setQuery: (q: string) => void
  setKeywords: (k: string) => void
  setFilters: (f: SearchQuery['filters']) => void
  setResults: (result: SearchResult) => void
  setError: (e: string | null) => void
  clearResults: () => void
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  keywords: '',
  filters: { sortBy: 'relevance', maxResults: 50 },
  results: [],
  totalFound: 0,
  sourceStats: {},
  searchDurationMs: 0,
  fromCache: false,
  error: null,
  setQuery:    (q) => set({ query: q }),
  setKeywords: (k) => set({ keywords: k }),
  setFilters:  (f) => set({ filters: f }),
  setResults:  (r) => set({
    results:         r.papers,
    totalFound:      r.totalFound,
    sourceStats:     r.sourceStats,
    searchDurationMs: r.searchDurationMs,
    fromCache:       r.fromCache,
    error:           null,
  }),
  setError:    (e) => set({ error: e }),
  clearResults: ()  => set({ results: [], totalFound: 0, error: null }),
}))

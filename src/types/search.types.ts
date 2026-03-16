// src/types/search.types.ts

import { Paper, SourceId } from './paper.types'

export type PublicationTypeFilter = 'journal' | 'conference' | 'thesis' | 'preprint'
export type AccessTypeFilter = 'all' | 'open_access' | 'paid'
export type SortBy = 'relevance' | 'citations' | 'newest' | 'oldest'

export interface SearchFilters {
  yearFrom?: number
  yearTo?: number
  accessType?: AccessTypeFilter
  publicationType?: PublicationTypeFilter[]
  sortBy?: SortBy
  sources?: SourceId[]
  maxResults?: number
}

export interface SearchQuery {
  text: string
  filters: SearchFilters
}

export interface ProcessedQuery {
  text: string           // original text
  terms: string[]        // tokenized key terms
  titleVariant: string   // for title-specific search
  keywordVariant: string // boolean AND query
}

export interface SourceStat {
  found: number
  status: 'ok' | 'timeout' | 'error'
  durationMs?: number
}

export interface SearchResult {
  papers: Paper[]
  totalFound: number
  sourcesQueried: SourceId[]
  sourceStats: Partial<Record<SourceId, SourceStat>>
  fromCache: boolean
  searchDurationMs: number
}

// src/types/paper.types.ts

export type SourceId =
  | 'semantic_scholar'
  | 'openalex'
  | 'crossref'
  | 'arxiv'
  | 'pubmed'
  | 'core'
  | 'doaj'
  | 'base_search'
  | 'eric'

export type OAStatus = 'open_access' | 'paid' | 'unknown'
export type PublicationType = 'journal' | 'conference' | 'thesis' | 'preprint' | 'unknown'

export interface Author {
  name: string
  orcid?: string
  affiliations?: string[]
}

export interface Paper {
  id: string
  doi?: string
  arxivId?: string
  title: string
  authors: Author[]
  abstract?: string
  year?: number
  journal?: string
  conference?: string
  volume?: string
  issue?: string
  pages?: string
  publisher?: string
  citationCount: number
  publicationType: PublicationType
  accessStatus: OAStatus
  pdfUrl?: string
  publisherUrl: string
  sources: SourceId[]
  relevanceScore?: number
}

export interface SavedPaper extends Paper {
  tags: string[]
  notes?: string
  savedAt: string
}

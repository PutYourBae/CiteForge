// src/types/ai.types.ts

import { Paper } from './paper.types'

export type CitationFormat = 'apa' | 'ieee' | 'mla' | 'chicago'
export type AIMode = 'local_rules' | 'ollama' | 'gemini' | 'openai'

export interface PaperSummaries {
  short?: string
  research?: string
  keyContributions?: string[]
  methodOverview?: string
  isLoading: boolean
  generatedBy: AIMode
}

export interface GraphNode {
  id: string
  label: string
  year?: number
  citationCount: number
  accessStatus: string
  isCenter: boolean
  topic?: string
  x?: number
  y?: number
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
  relationshipType: 'cites' | 'cited_by' | 'similar_topic' | 'co_cited' | 'recommendation'
}

export interface ResearchGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  centerPaperId: string
}

export interface AIInsight {
  paper: Paper
  summaries: PaperSummaries
  topics: string[]
  graph: ResearchGraph
  recommendations: Paper[]
  citations: Record<CitationFormat, string>
}

export interface ExtractedPDF {
  fullText: string
  sections: {
    abstract?: string
    introduction?: string
    methodology?: string
    results?: string
    conclusion?: string
  }
  pageCount: number
  wordCount: number
  chunks: string[]
}

export interface PaperContext {
  paper: Paper
  abstract: string
  fullText?: string
  sections?: ExtractedPDF['sections']
  keyTerms: string[]
  pdfAvailable: boolean
}

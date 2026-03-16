// src/core/discovery/index.ts — Discovery Engine singleton
import { SearchQuery, SearchResult } from '../../types/search.types'
import { Paper } from '../../types/paper.types'
import { SearchOrchestrator } from './orchestrator'
import { Deduplicator } from './deduplicator'
import { RelevanceRanker } from './ranker'
import { QueryProcessor } from './query-processor'

export class PaperDiscoveryEngine {
  private orchestrator = new SearchOrchestrator()
  private deduplicator = new Deduplicator()
  private ranker = new RelevanceRanker()
  private queryProcessor = new QueryProcessor()

  async search(query: SearchQuery): Promise<SearchResult> {
    const start = Date.now()
    const processed = this.queryProcessor.process(query)
    const { papers: rawPapers, stats } = await this.orchestrator.dispatch(processed)
    const unique = this.deduplicator.run(rawPapers)
    const ranked = this.ranker.rank(unique, processed)
    const filtered = this.applyFilters(ranked, query.filters)

    return {
      papers: filtered.slice(0, query.filters?.maxResults ?? 50),
      totalFound: filtered.length,
      sourceStats: stats,
      fromCache: false,
      searchDurationMs: Date.now() - start,
    }
  }

  private applyFilters(papers: Paper[], filters: SearchQuery['filters']): Paper[] {
    return papers.filter(p => {
      if (filters?.yearFrom && (p.year ?? 0) < filters.yearFrom) return false
      if (filters?.yearTo && (p.year ?? 9999) > filters.yearTo) return false
      if (filters?.accessType === 'open_access' && p.accessStatus !== 'open_access') return false
      if (filters?.publicationType?.length &&
          !filters.publicationType.includes(p.publicationType as any)) return false
      return true
    })
  }
}

export const discoveryEngine = new PaperDiscoveryEngine()

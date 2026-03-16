import { ipcMain } from 'electron'
import { SemanticScholarAdapter } from '../../src/core/discovery/adapters/semantic-scholar.adapter'
import { OpenAlexAdapter } from '../../src/core/discovery/adapters/openalex.adapter'
import { ArxivAdapter } from '../../src/core/discovery/adapters/arxiv.adapter'
import { CrossRefAdapter } from '../../src/core/discovery/adapters/crossref.adapter'
import { PubMedAdapter } from '../../src/core/discovery/adapters/pubmed.adapter'
import { CoreAdapter } from '../../src/core/discovery/adapters/core.adapter'
import { Deduplicator } from '../../src/core/discovery/deduplicator'
import { RelevanceRanker } from '../../src/core/discovery/ranker'
import { QueryProcessor } from '../../src/core/discovery/query-processor'
import { SearchQuery } from '../../src/types/search.types'
import { getDb } from '../../database/db'

const adapters = [
  new SemanticScholarAdapter(),
  new OpenAlexAdapter(),
  new ArxivAdapter(),
  new CrossRefAdapter(),
  new PubMedAdapter(),
  new CoreAdapter(),
]
const deduplicator = new Deduplicator()
const ranker = new RelevanceRanker()
const processor = new QueryProcessor()

export function registerSearchHandlers() {
  ipcMain.handle('search:query', async (_e, query: SearchQuery) => {
    const start = Date.now()
    const processed = processor.process(query)

    // Parallel fetch with 8s timeout
    const settled = await Promise.allSettled(
      adapters.map(a =>
        Promise.race([
          a.search(processed),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error('timeout')), 8000)
          ),
        ])
      )
    )

    const stats: Record<string, any> = {}
    const allPapers: any[] = []

    settled.forEach((result, i) => {
      const sourceId = adapters[i].sourceId
      if (result.status === 'fulfilled') {
        allPapers.push(...result.value)
        stats[sourceId] = { found: result.value.length, status: 'ok' }
      } else {
        const isTimeout = (result.reason as Error)?.message === 'timeout'
        stats[sourceId] = { found: 0, status: isTimeout ? 'timeout' : 'error' }
      }
    })

    const unique = deduplicator.run(allPapers)
    const ranked = ranker.rank(unique, processed)

    // Apply filters
    const filtered = ranked.filter(p => {
      if (query.filters?.yearFrom && (p.year ?? 0) < query.filters.yearFrom) return false
      if (query.filters?.yearTo && (p.year ?? 9999) > query.filters.yearTo) return false
      if (query.filters?.accessType === 'open_access' && p.accessStatus !== 'open_access') return false
      return true
    })

    return {
      papers: filtered.slice(0, query.filters?.maxResults ?? 50),
      totalFound: filtered.length,
      sourceStats: stats,
      fromCache: false,
      searchDurationMs: Date.now() - start,
    }
  })
}

// src/core/discovery/orchestrator.ts
import { ProcessedQuery } from '../../types/search.types'
import { Paper } from '../../types/paper.types'
import { BaseAdapter } from './adapters/base.adapter'
import { SemanticScholarAdapter } from './adapters/semantic-scholar.adapter'
import { OpenAlexAdapter } from './adapters/openalex.adapter'
import { CrossRefAdapter } from './adapters/crossref.adapter'
import { ArxivAdapter } from './adapters/arxiv.adapter'
import { PubMedAdapter } from './adapters/pubmed.adapter'
import { CoreAdapter } from './adapters/core.adapter'

const TIMEOUT_MS = 8000

export class SearchOrchestrator {
  private adapters: BaseAdapter[]

  constructor(coreApiKey?: string) {
    this.adapters = [
      new SemanticScholarAdapter(),
      new OpenAlexAdapter(),
      new CrossRefAdapter(),
      new ArxivAdapter(),
      new PubMedAdapter(),
      new CoreAdapter(coreApiKey),
    ]
  }

  async dispatch(query: ProcessedQuery): Promise<{
    papers: Paper[]
    stats: Record<string, { found: number; status: string }>
  }> {
    const settled = await Promise.allSettled(
      this.adapters.map(adapter =>
        Promise.race([
          adapter.search(query),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS)
          ),
        ])
      )
    )

    const papers: Paper[] = []
    const stats: Record<string, { found: number; status: string }> = {}

    settled.forEach((result, i) => {
      const id = this.adapters[i].sourceId
      if (result.status === 'fulfilled') {
        papers.push(...result.value)
        stats[id] = { found: result.value.length, status: 'ok' }
      } else {
        const isTimeout = (result.reason as Error)?.message === 'timeout'
        stats[id] = { found: 0, status: isTimeout ? 'timeout' : 'error' }
      }
    })

    return { papers, stats }
  }
}

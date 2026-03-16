import { BaseAdapter } from './base.adapter'
import { Paper } from '../../types/paper.types'
import { ProcessedQuery } from '../../types/search.types'

// CORE API — 200M+ open-access papers, requires free API key
const BASE = 'https://api.core.ac.uk/v3'

export class CoreAdapter extends BaseAdapter {
  readonly sourceId = 'core' as const
  readonly displayName = 'CORE'
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    super(10000)
    this.apiKey = apiKey ?? null
  }

  async search(query: ProcessedQuery): Promise<Paper[]> {
    if (!this.apiKey) {
      // Without a key, try a basic anonymous request
      return this.searchAnonymous(query)
    }

    try {
      const res = await this.http.post(
        `${BASE}/search/works`,
        {
          q: query.text,
          limit: 15,
          scroll: false,
          stats: false,
          rawStatsOnly: false,
          fields: ['id','title','authors','abstract','yearPublished','doi',
                   'downloadUrl','sourceFulltextUrls','journals','publisher',
                   'citationCount','documentType'],
        },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        }
      )
      return (res.data?.results ?? []).map((w: any) => this.mapWork(w))
    } catch {
      return []
    }
  }

  private async searchAnonymous(query: ProcessedQuery): Promise<Paper[]> {
    // CORE also exposes a GET endpoint for simple queries when authenticated via key in URL
    // Fallback: return empty to not break the search
    return []
  }

  private mapWork(w: any): Paper {
    const doi = this.normalizeDoi(w.doi)
    const pdfUrl = w.downloadUrl ?? w.sourceFulltextUrls?.[0]

    return {
      id: doi ?? `core:${w.id}`,
      doi,
      title: this.cleanTitle(w.title),
      authors: (w.authors ?? []).map((a: any) => ({
        name: typeof a === 'string' ? a : a.name ?? '',
      })).filter((a: any) => a.name),
      abstract: this.truncate(w.abstract ?? ''),
      year: this.safeYear(w.yearPublished),
      journal: w.journals?.[0]?.title ?? w.publisher,
      citationCount: w.citationCount ?? 0,
      publicationType: w.documentType === 'conference-paper' ? 'conference' : 'journal',
      accessStatus: pdfUrl ? 'open_access' : doi ? 'paid' : 'unknown',
      pdfUrl: pdfUrl || undefined,
      publisherUrl: doi
        ? `https://doi.org/${doi}`
        : `https://core.ac.uk/works/${w.id}`,
      sources: ['core'],
    }
  }
}

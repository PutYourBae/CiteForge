import { BaseAdapter } from './base.adapter'
import { Paper } from '../../types/paper.types'
import { ProcessedQuery } from '../../types/search.types'

const BASE = 'https://api.semanticscholar.org/graph/v1'
const FIELDS = [
  'paperId','title','authors','year','abstract','externalIds',
  'journal','publicationTypes','citationCount','openAccessPdf',
  'publicationVenue'
].join(',')

export class SemanticScholarAdapter extends BaseAdapter {
  readonly sourceId = 'semantic_scholar' as const
  readonly displayName = 'Semantic Scholar'

  async search(query: ProcessedQuery): Promise<Paper[]> {
    const res = await this.http.get(`${BASE}/paper/search`, {
      params: { query: query.text, fields: FIELDS, limit: 20, offset: 0 },
    })
    return (res.data?.data ?? []).map((r: any) => this.mapPaper(r))
  }

  private mapPaper(r: any): Paper {
    const doi = this.normalizeDoi(r.externalIds?.DOI)
    const isOA = !!r.openAccessPdf?.url
    return {
      id: doi ?? r.paperId,
      doi,
      title: this.cleanTitle(r.title),
      authors: (r.authors ?? []).map((a: any) => ({ name: a.name })),
      abstract: this.truncate(r.abstract ?? ''),
      year: this.safeYear(r.year),
      journal: r.journal?.name ?? r.publicationVenue?.name,
      citationCount: r.citationCount ?? 0,
      publicationType: this.mapType(r.publicationTypes),
      accessStatus: isOA ? 'open_access' : doi ? 'paid' : 'unknown',
      pdfUrl: r.openAccessPdf?.url,
      publisherUrl: doi
        ? `https://doi.org/${doi}`
        : `https://www.semanticscholar.org/paper/${r.paperId}`,
      sources: ['semantic_scholar'],
    }
  }

  private mapType(types: string[] | undefined): Paper['publicationType'] {
    if (!types?.length) return 'unknown'
    if (types.includes('JournalArticle')) return 'journal'
    if (types.includes('Conference')) return 'conference'
    if (types.includes('Review')) return 'journal'
    return 'unknown'
  }
}

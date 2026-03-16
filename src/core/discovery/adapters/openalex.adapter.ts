import { BaseAdapter } from './base.adapter'
import { Paper } from '../../types/paper.types'
import { ProcessedQuery } from '../../types/search.types'

const BASE = 'https://api.openalex.org'
const SELECT = [
  'id','doi','title','authorships','publication_year',
  'abstract_inverted_index','primary_location','open_access',
  'cited_by_count','type','biblio'
].join(',')

export class OpenAlexAdapter extends BaseAdapter {
  readonly sourceId = 'openalex' as const
  readonly displayName = 'OpenAlex'

  async search(query: ProcessedQuery): Promise<Paper[]> {
    const res = await this.http.get(`${BASE}/works`, {
      params: { search: query.text, select: SELECT, per_page: 20 },
      headers: { 'User-Agent': 'CiteForge/1.0 (mailto:citeforge@example.com)' },
    })
    return (res.data?.results ?? []).map((w: any) => this.mapWork(w))
  }

  private mapWork(w: any): Paper {
    const doi = this.normalizeDoi(w.doi)
    const pdfUrl = w.open_access?.oa_url ?? w.primary_location?.pdf_url

    return {
      id: doi ?? w.id,
      doi,
      title: this.cleanTitle(w.title),
      authors: (w.authorships ?? []).map((a: any) => ({
        name: a.author?.display_name ?? 'Unknown',
        orcid: a.author?.orcid?.replace('https://orcid.org/', ''),
      })),
      abstract: this.truncate(this.reconstructAbstract(w.abstract_inverted_index)),
      year: this.safeYear(w.publication_year),
      journal: w.primary_location?.source?.display_name,
      citationCount: w.cited_by_count ?? 0,
      publicationType: this.mapType(w.type),
      accessStatus: w.open_access?.is_oa ? 'open_access' : doi ? 'paid' : 'unknown',
      pdfUrl: pdfUrl || undefined,
      publisherUrl: doi ? `https://doi.org/${doi}` : w.id,
      volume: w.biblio?.volume,
      issue: w.biblio?.issue,
      pages: w.biblio?.first_page
        ? `${w.biblio.first_page}-${w.biblio.last_page ?? ''}`.replace(/-$/, '')
        : undefined,
      sources: ['openalex'],
    }
  }

  private mapType(t: string): Paper['publicationType'] {
    const m: Record<string, Paper['publicationType']> = {
      article: 'journal',
      'proceedings-article': 'conference',
      dissertation: 'thesis',
      'posted-content': 'preprint',
    }
    return m[t] ?? 'unknown'
  }
}

import { BaseAdapter } from './base.adapter'
import { Paper } from '../../types/paper.types'
import { ProcessedQuery } from '../../types/search.types'

export class CrossRefAdapter extends BaseAdapter {
  readonly sourceId = 'crossref' as const
  readonly displayName = 'CrossRef'

  async search(query: ProcessedQuery): Promise<Paper[]> {
    const res = await this.http.get('https://api.crossref.org/works', {
      params: {
        query: query.text,
        rows: 20,
        select: 'DOI,title,author,published,container-title,is-referenced-by-count,link,abstract,type,volume,issue,page',
      },
      headers: { 'User-Agent': 'CiteForge/1.0 (mailto:citeforge@example.com)' },
    })
    return (res.data?.message?.items ?? []).map((r: any) => this.mapWork(r))
  }

  private mapWork(r: any): Paper {
    const doi = this.normalizeDoi(r.DOI)
    const year = r.published?.['date-parts']?.[0]?.[0]
    const oaLink = (r.link ?? []).find((l: any) =>
      l['content-type'] === 'application/pdf' && l['intended-application'] === 'text-mining'
    )

    return {
      id: doi ?? crypto.randomUUID(),
      doi,
      title: this.cleanTitle(r.title),
      authors: (r.author ?? []).map((a: any) => ({
        name: [a.given, a.family].filter(Boolean).join(' '),
        orcid: a.ORCID?.replace('http://orcid.org/', ''),
      })),
      abstract: this.truncate(r.abstract?.replace(/<[^>]+>/g, '') ?? ''),
      year: this.safeYear(year),
      journal: Array.isArray(r['container-title']) ? r['container-title'][0] : r['container-title'],
      citationCount: r['is-referenced-by-count'] ?? 0,
      publicationType: this.mapType(r.type),
      accessStatus: oaLink ? 'open_access' : doi ? 'paid' : 'unknown',
      pdfUrl: oaLink?.URL,
      publisherUrl: doi ? `https://doi.org/${doi}` : '',
      volume: r.volume,
      issue: r.issue,
      pages: r.page,
      sources: ['crossref'],
    }
  }

  private mapType(t: string): Paper['publicationType'] {
    if (t === 'journal-article') return 'journal'
    if (t?.includes('proceedings')) return 'conference'
    if (t === 'dissertation') return 'thesis'
    if (t === 'posted-content') return 'preprint'
    return 'unknown'
  }
}

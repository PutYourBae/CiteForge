import { BaseAdapter } from './base.adapter'
import { Paper } from '../../types/paper.types'
import { ProcessedQuery } from '../../types/search.types'

// PubMed E-utilities API (NCBI) — no key needed for basic use
const ESEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi'
const EFETCH  = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi'
const ESUMMARY = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi'

export class PubMedAdapter extends BaseAdapter {
  readonly sourceId = 'pubmed' as const
  readonly displayName = 'PubMed'

  async search(query: ProcessedQuery): Promise<Paper[]> {
    try {
      // Step 1: Get PMIDs
      const searchRes = await this.http.get(ESEARCH, {
        params: {
          db: 'pubmed',
          term: query.text,
          retmax: 15,
          retmode: 'json',
          sort: 'relevance',
        },
      })
      const ids: string[] = searchRes.data?.esearchresult?.idlist ?? []
      if (!ids.length) return []

      // Step 2: Get summaries for those IDs
      const summaryRes = await this.http.get(ESUMMARY, {
        params: {
          db: 'pubmed',
          id: ids.join(','),
          retmode: 'json',
        },
      })

      const uids: string[] = summaryRes.data?.result?.uids ?? []
      const result = summaryRes.data?.result ?? {}

      return uids.map(uid => this.mapSummary(uid, result[uid])).filter(Boolean) as Paper[]
    } catch {
      return []
    }
  }

  private mapSummary(pmid: string, r: any): Paper | null {
    if (!r || r.error) return null

    const doi = this.normalizeDoi(
      r.articleids?.find((a: any) => a.idtype === 'doi')?.value
    )
    const year = this.safeYear(r.pubdate?.split(' ')[0])
    const authors = (r.authors ?? []).map((a: any) => ({ name: a.name }))
    const journal = r.fulljournalname ?? r.source

    // Check for PMC free full text
    const hasPMC = r.articleids?.some((a: any) => a.idtype === 'pmc')
    const pmcId = r.articleids?.find((a: any) => a.idtype === 'pmc')?.value

    return {
      id: doi ?? `pmid:${pmid}`,
      doi,
      title: this.cleanTitle(r.title),
      authors,
      abstract: '',  // ESummary doesn't include abstract, EFetch would be needed
      year,
      journal,
      volume: r.volume,
      issue: r.issue,
      pages: r.pages,
      citationCount: 0,
      publicationType: 'journal',
      accessStatus: hasPMC ? 'open_access' : doi ? 'paid' : 'unknown',
      pdfUrl: pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/pdf/` : undefined,
      publisherUrl: doi
        ? `https://doi.org/${doi}`
        : `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      sources: ['pubmed'],
    }
  }
}

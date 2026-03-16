import { Paper } from '../../types/paper.types'
import { ProcessedQuery } from '../../types/search.types'

export class RelevanceRanker {
  rank(papers: Paper[], query: ProcessedQuery): Paper[] {
    const maxCitations = Math.max(...papers.map(p => p.citationCount), 1)
    const currentYear = new Date().getFullYear()
    return papers
      .map(p => ({
        ...p,
        relevanceScore: this.score(p, query, maxCitations, currentYear),
      }))
      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
  }

  private score(
    p: Paper,
    q: ProcessedQuery,
    maxCitations: number,
    currentYear: number
  ): number {
    return (
      this.keywordScore(p, q.terms)  * 0.40 +
      this.citationScore(p.citationCount, maxCitations) * 0.25 +
      this.yearScore(p.year, currentYear)  * 0.20 +
      this.abstractScore(p.abstract, q.terms) * 0.15
    )
  }

  private keywordScore(p: Paper, terms: string[]): number {
    if (!terms.length) return 50
    const titleL = p.title.toLowerCase()
    let score = 0
    for (const term of terms) {
      if (titleL.includes(term)) score += 30
      else if (p.abstract?.toLowerCase().includes(term)) score += 15
      else if (p.journal?.toLowerCase().includes(term)) score += 8
    }
    if (terms.every(t => titleL.includes(t))) score += 15 // all terms in title bonus
    return Math.min(100, score)
  }

  private citationScore(count: number, max: number): number {
    if (max === 0) return 0
    return (Math.log10(count + 1) / Math.log10(max + 1)) * 100
  }

  private yearScore(year: number | undefined, current: number): number {
    if (!year) return 35
    return Math.max(0, 100 - (current - year) * 5)
  }

  private abstractScore(abstract: string | undefined, terms: string[]): number {
    if (!abstract || !terms.length) return 0
    const low = abstract.toLowerCase()
    const matched = terms.filter(t => low.includes(t)).length
    return (matched / terms.length) * 100
  }
}

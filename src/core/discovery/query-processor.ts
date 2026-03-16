import { ProcessedQuery } from '../types/search.types'

export class QueryProcessor {
  process(query: { text: string }): ProcessedQuery {
    const text = query.text.trim().replace(/\s+/g, ' ')
    const terms = this.extractTerms(text)
    return {
      text,
      terms,
      titleVariant: `"${text}"`,
      keywordVariant: terms.join(' AND '),
    }
  }

  private extractTerms(text: string): string[] {
    const stopwords = new Set([
      'a','an','the','of','on','in','for','and','or','to','is','are',
      'was','were','be','been','being','have','has','had','do','does',
      'did','with','from','by','at','this','that','these','those',
    ])
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w))
      .slice(0, 8) // max 8 key terms
  }
}

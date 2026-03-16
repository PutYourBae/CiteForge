import { Paper, SourceId } from '../../types/paper.types'
import { ProcessedQuery } from '../../types/search.types'
import axios, { AxiosInstance } from 'axios'

export abstract class BaseAdapter {
  abstract readonly sourceId: SourceId
  abstract readonly displayName: string
  protected readonly http: AxiosInstance

  constructor(timeoutMs = 8000) {
    this.http = axios.create({
      timeout: timeoutMs,
      headers: { 'User-Agent': 'CiteForge/1.0 (academic research, non-commercial)' },
    })
  }

  abstract search(query: ProcessedQuery): Promise<Paper[]>

  protected cleanTitle(raw: string | string[] | undefined): string {
    const s = Array.isArray(raw) ? raw[0] : raw
    return (s ?? 'Untitled').trim().replace(/\s+/g, ' ')
  }

  protected safeYear(raw: any): number | undefined {
    const n = parseInt(String(raw))
    const currentYear = new Date().getFullYear()
    return n >= 1000 && n <= currentYear + 1 ? n : undefined
  }

  protected normalizeDoi(raw: string | undefined): string | undefined {
    if (!raw) return undefined
    return raw.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim().toLowerCase()
  }

  protected reconstructAbstract(
    invertedIndex: Record<string, number[]> | null | undefined
  ): string {
    if (!invertedIndex) return ''
    const arr: string[] = []
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) arr[pos] = word
    }
    return arr.filter(Boolean).join(' ')
  }

  protected truncate(text: string, maxLen = 800): string {
    return text.length > maxLen ? text.substring(0, maxLen) + '…' : text
  }
}

// src/core/ai/pdf/extractor.ts
// PDF text extraction using pdfjs-dist bundled in Electron

import { ExtractedPDF } from '../../../types/ai.types'

export class PDFExtractor {
  async extract(url: string): Promise<ExtractedPDF> {
    // Dynamically import pdfjs-dist only when needed
    const pdfjsLib = await import('pdfjs-dist')

    // Set worker path (bundled by Vite/Electron)
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''  // disabled for Node.js context

    const response = await fetch(url, {
      headers: { 'User-Agent': 'CiteForge/1.0' },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`)
    const buffer = await response.arrayBuffer()
    const data = new Uint8Array(buffer)

    const pdf = await pdfjsLib.getDocument({ data }).promise
    const totalPages = pdf.numPages

    // For large PDFs (>30 pages), only extract key sections
    const pagesToExtract = totalPages > 30
      ? this.getKeyPageIndices(totalPages)
      : Array.from({ length: totalPages }, (_, i) => i + 1)

    const pageTexts: string[] = []
    for (const pageNum of pagesToExtract) {
      try {
        const page = await pdf.getPage(pageNum)
        const content = await page.getTextContent()
        const text = content.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        pageTexts.push(text)
      } catch {
        // Skip unreadable pages
      }
    }

    const fullText = pageTexts.join('\n\n')
    const sections = this.detectSections(fullText)
    const wordCount = fullText.split(/\s+/).length
    const chunks = this.chunkText(fullText, 1500)

    return { fullText, sections, pageCount: totalPages, wordCount, chunks }
  }

  private getKeyPageIndices(total: number): number[] {
    // First 3 + last 2 pages (abstract + intro + conclusion)
    const indices = [1, 2, 3, total - 1, total].filter(n => n >= 1 && n <= total)
    return [...new Set(indices)].sort((a, b) => a - b)
  }

  private detectSections(text: string): ExtractedPDF['sections'] {
    const lower = text.toLowerCase()
    const sections: ExtractedPDF['sections'] = {}

    const markers: Record<keyof ExtractedPDF['sections'], RegExp> = {
      abstract:     /\babstract\b/i,
      introduction: /\b(1\.?\s*introduction|introduction)\b/i,
      methodology:  /\b(methodology|methods|materials and methods|approach)\b/i,
      results:      /\b(results|findings|experiments)\b/i,
      conclusion:   /\b(conclusion|conclusions|discussion)\b/i,
    }

    for (const [section, regex] of Object.entries(markers)) {
      const matchIdx = lower.search(regex)
      if (matchIdx === -1) continue

      // Extract up to 2000 chars from that section
      const sectionText = text.substring(matchIdx, matchIdx + 2000)
        .replace(/^.*?(abstract|introduction|methodology|methods|results|conclusion)/i, '')
        .trim()
      ;(sections as any)[section] = sectionText.substring(0, 1200)
    }

    return sections
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const words = text.split(/\s+/)
    const chunks: string[] = []
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '))
    }
    return chunks
  }
}

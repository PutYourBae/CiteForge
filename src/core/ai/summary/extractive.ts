// src/core/ai/summary/extractive.ts
// TextRank extractive summarizer — local, zero dependencies, instant

export class ExtractiveSummarizer {
  /**
   * Produces a summary of `sentenceCount` sentences from the text.
   * Uses TextRank: graph of sentence similarity, ranks by PageRank-style scoring.
   */
  summarize(text: string, sentenceCount = 3): string {
    if (!text || text.length < 100) return text

    const sentences = this.splitSentences(text)
    if (sentences.length <= sentenceCount) return sentences.join(' ')

    const vectors = sentences.map(s => this.tfVector(s))
    const scores = this.textRankScores(vectors, sentences.length)

    // Pick top-N sentences preserving original order
    const topIndices = scores
      .map((score, i) => ({ score, i }))
      .sort((a, b) => b.score - a.score)
      .slice(0, sentenceCount)
      .map(x => x.i)
      .sort((a, b) => a - b)

    return topIndices.map(i => sentences[i]).join(' ')
  }

  keyContributions(text: string): string[] {
    // Extract sentences with contribution indicators
    const indicators = [
      /we propose|we present|we introduce|we develop|novel|new approach|we show/i,
      /outperform|state-of-the-art|significantly|superior|improvement|better than/i,
      /framework|method|algorithm|model|system|architecture/i,
    ]
    const sentences = this.splitSentences(text)
    const contributions: string[] = []

    for (const s of sentences) {
      if (indicators.some(r => r.test(s)) && s.length > 40 && s.length < 250) {
        contributions.push(s.trim())
        if (contributions.length >= 4) break
      }
    }

    return contributions.length > 0 ? contributions : [this.summarize(text, 2)]
  }

  private splitSentences(text: string): string[] {
    return text
      .replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 500)
  }

  private tfVector(sentence: string): Map<string, number> {
    const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
    const freq = new Map<string, number>()
    for (const w of words) if (w.length > 2) freq.set(w, (freq.get(w) ?? 0) + 1)
    return freq
  }

  private cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
    let dot = 0, normA = 0, normB = 0
    for (const [w, v] of a) {
      dot += v * (b.get(w) ?? 0)
      normA += v * v
    }
    for (const v of b.values()) normB += v * v
    const denom = Math.sqrt(normA) * Math.sqrt(normB)
    return denom === 0 ? 0 : dot / denom
  }

  private textRankScores(vectors: Map<string, number>[], n: number): number[] {
    // Build similarity matrix
    const sim = Array.from({ length: n }, () => new Array(n).fill(0))
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const s = this.cosineSimilarity(vectors[i], vectors[j])
        sim[i][j] = sim[j][i] = s
      }
    }

    // Power iteration (simplified PageRank)
    let scores = new Array(n).fill(1 / n)
    const damping = 0.85
    for (let iter = 0; iter < 20; iter++) {
      const newScores = new Array(n).fill((1 - damping) / n)
      for (let i = 0; i < n; i++) {
        const rowSum = sim[i].reduce((a, b) => a + b, 0)
        if (rowSum === 0) continue
        for (let j = 0; j < n; j++) {
          if (i === j) continue
          newScores[j] += damping * (sim[i][j] / rowSum) * scores[i]
        }
      }
      scores = newScores
    }
    return scores
  }
}

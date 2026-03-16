// src/core/ai/graph/engine.ts
import { Paper } from '../../../types/paper.types'
import { ResearchGraph, GraphNode, GraphEdge } from '../../../types/ai.types'

export class GraphEngine {
  async buildGraph(centerPaper: Paper): Promise<ResearchGraph> {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const seen = new Set<string>()

    // Add center node
    nodes.push(this.paperToNode(centerPaper, true))
    seen.add(centerPaper.id)

    // Fetch references and citations from Semantic Scholar
    const [references, citations] = await Promise.all([
      this.fetchLinks(centerPaper, 'references'),
      this.fetchLinks(centerPaper, 'citations'),
    ])

    // Add reference nodes (papers this paper cites)
    for (const ref of references.slice(0, 8)) {
      if (!seen.has(ref.id)) {
        nodes.push(this.paperToNode(ref, false))
        edges.push({
          source: centerPaper.id,
          target: ref.id,
          weight: 0.9,
          relationshipType: 'cites',
        })
        seen.add(ref.id)
      }
    }

    // Add citation nodes (papers that cite this paper)
    for (const cit of citations.slice(0, 8)) {
      if (!seen.has(cit.id)) {
        nodes.push(this.paperToNode(cit, false))
        edges.push({
          source: cit.id,
          target: centerPaper.id,
          weight: 0.8,
          relationshipType: 'cited_by',
        })
        seen.add(cit.id)
      }
    }

    return { nodes, edges, centerPaperId: centerPaper.id }
  }

  private paperToNode(paper: Paper, isCenter: boolean): GraphNode {
    return {
      id: paper.id,
      label: paper.title.length > 50 ? paper.title.substring(0, 47) + '…' : paper.title,
      year: paper.year,
      citationCount: paper.citationCount,
      accessStatus: paper.accessStatus,
      isCenter,
    }
  }

  private async fetchLinks(paper: Paper, type: 'references' | 'citations'): Promise<Paper[]> {
    const id = paper.doi ? `DOI:${paper.doi}` : paper.arxivId ? `ARXIV:${paper.arxivId}` : null
    if (!id) return []

    try {
      const fields = 'title,year,citationCount,openAccessPdf,externalIds'
      const res = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(id)}/${type}?fields=${fields}&limit=10`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (!res.ok) return []
      const data = await res.json()

      const items = data?.data ?? []
      return items.map((item: any) => {
        const p = type === 'references' ? item.citedPaper : item.citingPaper
        if (!p) return null
        const doi = p.externalIds?.DOI?.toLowerCase()
        return {
          id: doi ?? p.paperId ?? `unknown-${Math.random()}`,
          doi,
          title: p.title ?? 'Untitled',
          authors: [],
          abstract: '',
          year: p.year,
          citationCount: p.citationCount ?? 0,
          publicationType: 'unknown' as const,
          accessStatus: p.openAccessPdf ? 'open_access' as const : 'unknown' as const,
          pdfUrl: p.openAccessPdf?.url,
          publisherUrl: doi ? `https://doi.org/${doi}` : '#',
          sources: ['semantic_scholar' as const],
        }
      }).filter(Boolean)
    } catch {
      return []
    }
  }
}

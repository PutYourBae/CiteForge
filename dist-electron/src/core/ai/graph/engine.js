"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphEngine = void 0;
class GraphEngine {
    async buildGraph(centerPaper) {
        const nodes = [];
        const edges = [];
        const seen = new Set();
        // Add center node
        nodes.push(this.paperToNode(centerPaper, true));
        seen.add(centerPaper.id);
        // Fetch references and citations from Semantic Scholar
        const [references, citations] = await Promise.all([
            this.fetchLinks(centerPaper, 'references'),
            this.fetchLinks(centerPaper, 'citations'),
        ]);
        // Add reference nodes (papers this paper cites)
        for (const ref of references.slice(0, 8)) {
            if (!seen.has(ref.id)) {
                nodes.push(this.paperToNode(ref, false));
                edges.push({
                    source: centerPaper.id,
                    target: ref.id,
                    weight: 0.9,
                    relationshipType: 'cites',
                });
                seen.add(ref.id);
            }
        }
        // Add citation nodes (papers that cite this paper)
        for (const cit of citations.slice(0, 8)) {
            if (!seen.has(cit.id)) {
                nodes.push(this.paperToNode(cit, false));
                edges.push({
                    source: cit.id,
                    target: centerPaper.id,
                    weight: 0.8,
                    relationshipType: 'cited_by',
                });
                seen.add(cit.id);
            }
        }
        return { nodes, edges, centerPaperId: centerPaper.id };
    }
    paperToNode(paper, isCenter) {
        return {
            id: paper.id,
            label: paper.title.length > 50 ? paper.title.substring(0, 47) + '…' : paper.title,
            year: paper.year,
            citationCount: paper.citationCount,
            accessStatus: paper.accessStatus,
            isCenter,
        };
    }
    async fetchLinks(paper, type) {
        const id = paper.doi ? `DOI:${paper.doi}` : paper.arxivId ? `ARXIV:${paper.arxivId}` : null;
        if (!id)
            return [];
        try {
            const fields = 'title,year,citationCount,openAccessPdf,externalIds';
            const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(id)}/${type}?fields=${fields}&limit=10`, { signal: AbortSignal.timeout(8000) });
            if (!res.ok)
                return [];
            const data = await res.json();
            const items = data?.data ?? [];
            return items.map((item) => {
                const p = type === 'references' ? item.citedPaper : item.citingPaper;
                if (!p)
                    return null;
                const doi = p.externalIds?.DOI?.toLowerCase();
                return {
                    id: doi ?? p.paperId ?? `unknown-${Math.random()}`,
                    doi,
                    title: p.title ?? 'Untitled',
                    authors: [],
                    abstract: '',
                    year: p.year,
                    citationCount: p.citationCount ?? 0,
                    publicationType: 'unknown',
                    accessStatus: p.openAccessPdf ? 'open_access' : 'unknown',
                    pdfUrl: p.openAccessPdf?.url,
                    publisherUrl: doi ? `https://doi.org/${doi}` : '#',
                    sources: ['semantic_scholar'],
                };
            }).filter(Boolean);
        }
        catch {
            return [];
        }
    }
}
exports.GraphEngine = GraphEngine;

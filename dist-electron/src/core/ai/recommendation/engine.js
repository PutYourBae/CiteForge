"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationEngine = void 0;
class RecommendationEngine {
    async forPaper(paper, candidates) {
        if (!candidates || candidates.length === 0) {
            // Fetch related papers from Semantic Scholar
            candidates = await this.fetchRelatedPapers(paper);
        }
        const scores = candidates
            .filter(c => c.id !== paper.id)
            .map(c => ({
            paper: c,
            score: this.scoreRelevance(paper, c),
        }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        return scores.map(x => x.paper);
    }
    scoreRelevance(source, candidate) {
        let score = 0;
        // Topic overlap (keyword jaccard)
        const srcTerms = this.extractTerms(source.title + ' ' + (source.abstract ?? ''));
        const cndTerms = this.extractTerms(candidate.title + ' ' + (candidate.abstract ?? ''));
        const intersection = new Set([...srcTerms].filter(t => cndTerms.has(t)));
        const union = new Set([...srcTerms, ...cndTerms]);
        const jaccard = union.size > 0 ? intersection.size / union.size : 0;
        score += jaccard * 50;
        // Citation count signal
        if (candidate.citationCount > 50)
            score += 10;
        if (candidate.citationCount > 500)
            score += 15;
        // Recency (prefer last 10 years)
        const currentYear = new Date().getFullYear();
        if (candidate.year && currentYear - candidate.year <= 5)
            score += 20;
        else if (candidate.year && currentYear - candidate.year <= 10)
            score += 10;
        // Same journal bonus
        if (source.journal && candidate.journal &&
            source.journal.toLowerCase() === candidate.journal.toLowerCase())
            score += 5;
        // Open access bonus
        if (candidate.accessStatus === 'open_access')
            score += 5;
        return Math.round(score);
    }
    extractTerms(text) {
        const stopwords = new Set(['a', 'an', 'the', 'of', 'on', 'in', 'for', 'and', 'or', 'to', 'is', 'are']);
        const terms = text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopwords.has(w));
        return new Set(terms);
    }
    async fetchRelatedPapers(paper) {
        if (!paper.doi && !paper.arxivId)
            return [];
        try {
            // Use Semantic Scholar API if possible (no key for basic)
            const id = paper.doi ? `DOI:${paper.doi}` : `ARXIV:${paper.arxivId}`;
            const fields = 'paperId,title,authors,year,abstract,citationCount,openAccessPdf,externalIds,publicationTypes';
            const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(id)}/recommendations?fields=${fields}&limit=15`, { signal: AbortSignal.timeout(8000) });
            if (!res.ok)
                return [];
            const data = await res.json();
            return (data?.recommendedPapers ?? []).map((r) => {
                const doi = r.externalIds?.DOI?.toLowerCase();
                return {
                    id: doi ?? r.paperId,
                    doi,
                    title: r.title ?? 'Untitled',
                    authors: (r.authors ?? []).map((a) => ({ name: a.name })),
                    abstract: r.abstract ?? '',
                    year: r.year,
                    citationCount: r.citationCount ?? 0,
                    publicationType: 'unknown',
                    accessStatus: r.openAccessPdf ? 'open_access' : doi ? 'paid' : 'unknown',
                    pdfUrl: r.openAccessPdf?.url,
                    publisherUrl: doi ? `https://doi.org/${doi}` : `https://semanticscholar.org/paper/${r.paperId}`,
                    sources: ['semantic_scholar'],
                };
            });
        }
        catch {
            return [];
        }
    }
}
exports.RecommendationEngine = RecommendationEngine;

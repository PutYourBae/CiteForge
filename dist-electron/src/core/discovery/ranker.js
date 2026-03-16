"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelevanceRanker = void 0;
class RelevanceRanker {
    rank(papers, query) {
        const maxCitations = Math.max(...papers.map(p => p.citationCount), 1);
        const currentYear = new Date().getFullYear();
        return papers
            .map(p => ({
            ...p,
            relevanceScore: this.score(p, query, maxCitations, currentYear),
        }))
            .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    }
    score(p, q, maxCitations, currentYear) {
        return (this.keywordScore(p, q.terms) * 0.40 +
            this.citationScore(p.citationCount, maxCitations) * 0.25 +
            this.yearScore(p.year, currentYear) * 0.20 +
            this.abstractScore(p.abstract, q.terms) * 0.15);
    }
    keywordScore(p, terms) {
        if (!terms.length)
            return 50;
        const titleL = p.title.toLowerCase();
        let score = 0;
        for (const term of terms) {
            if (titleL.includes(term))
                score += 30;
            else if (p.abstract?.toLowerCase().includes(term))
                score += 15;
            else if (p.journal?.toLowerCase().includes(term))
                score += 8;
        }
        if (terms.every(t => titleL.includes(t)))
            score += 15; // all terms in title bonus
        return Math.min(100, score);
    }
    citationScore(count, max) {
        if (max === 0)
            return 0;
        return (Math.log10(count + 1) / Math.log10(max + 1)) * 100;
    }
    yearScore(year, current) {
        if (!year)
            return 35;
        return Math.max(0, 100 - (current - year) * 5);
    }
    abstractScore(abstract, terms) {
        if (!abstract || !terms.length)
            return 0;
        const low = abstract.toLowerCase();
        const matched = terms.filter(t => low.includes(t)).length;
        return (matched / terms.length) * 100;
    }
}
exports.RelevanceRanker = RelevanceRanker;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextBuilder = void 0;
class ContextBuilder {
    build(paper, pdf) {
        const abstract = paper.abstract ?? '';
        const keyTerms = this.extractKeyTerms(paper.title + ' ' + abstract);
        return {
            paper,
            abstract,
            fullText: pdf?.fullText,
            sections: pdf?.sections,
            keyTerms,
            pdfAvailable: !!pdf,
        };
    }
    extractKeyTerms(text) {
        const stopwords = new Set([
            'a', 'an', 'the', 'of', 'on', 'in', 'for', 'and', 'or', 'to', 'is', 'are', 'was', 'were',
            'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'with', 'from', 'by',
            'at', 'this', 'that', 'these', 'those', 'we', 'our', 'their', 'can', 'may', 'also',
            'which', 'that', 'such', 'thus', 'while', 'using', 'used', 'use', 'show', 'shows',
        ]);
        const words = text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopwords.has(w));
        // Count term frequency
        const freq = new Map();
        for (const w of words)
            freq.set(w, (freq.get(w) ?? 0) + 1);
        // Return top 15 terms by frequency
        return Array.from(freq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([word]) => word);
    }
}
exports.ContextBuilder = ContextBuilder;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArxivAdapter = void 0;
const base_adapter_1 = require("./base.adapter");
class ArxivAdapter extends base_adapter_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.sourceId = 'arxiv';
        this.displayName = 'arXiv';
    }
    async search(query) {
        const q = query.terms.join('+');
        const res = await this.http.get('https://export.arxiv.org/api/query', {
            params: { search_query: `all:${q}`, start: 0, max_results: 20 },
            responseType: 'text',
        });
        return this.parseAtomFeed(res.data);
    }
    parseAtomFeed(xml) {
        // Simple regex-based parser to avoid Node.js-only xml2js in renderer
        const papers = [];
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;
        while ((match = entryRegex.exec(xml)) !== null) {
            try {
                const entry = match[1];
                const id = this.extractTag(entry, 'id') ?? '';
                const arxivId = id.split('/abs/').pop()?.replace(/v\d+$/, '') ?? '';
                const title = this.extractTag(entry, 'title')?.trim();
                const abstract = this.extractTag(entry, 'summary')?.trim();
                const published = this.extractTag(entry, 'published') ?? '';
                const year = this.safeYear(published.substring(0, 4));
                const doi = this.extractTag(entry, 'arxiv:doi');
                const journal = this.extractTag(entry, 'arxiv:journal_ref');
                const authorMatches = Array.from(entry.matchAll(/<author>([\s\S]*?)<\/author>/g));
                const authors = authorMatches.map(m => ({
                    name: this.extractTag(m[1], 'name') ?? '',
                })).filter(a => a.name);
                papers.push({
                    id: doi ? this.normalizeDoi(doi) : `arxiv:${arxivId}`,
                    doi: doi ? this.normalizeDoi(doi) : undefined,
                    arxivId,
                    title: this.cleanTitle(title),
                    authors,
                    abstract: this.truncate(abstract ?? ''),
                    year,
                    journal,
                    citationCount: 0,
                    publicationType: 'preprint',
                    accessStatus: 'open_access',
                    pdfUrl: `https://arxiv.org/pdf/${arxivId}`,
                    publisherUrl: `https://arxiv.org/abs/${arxivId}`,
                    sources: ['arxiv'],
                });
            }
            catch { /* skip malformed entries */ }
        }
        return papers;
    }
    extractTag(xml, tag) {
        const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(xml);
        return match?.[1]?.trim();
    }
}
exports.ArxivAdapter = ArxivAdapter;

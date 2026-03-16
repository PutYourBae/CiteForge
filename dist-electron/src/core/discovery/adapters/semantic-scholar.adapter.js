"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticScholarAdapter = void 0;
const base_adapter_1 = require("./base.adapter");
const BASE = 'https://api.semanticscholar.org/graph/v1';
const FIELDS = [
    'paperId', 'title', 'authors', 'year', 'abstract', 'externalIds',
    'journal', 'publicationTypes', 'citationCount', 'openAccessPdf',
    'publicationVenue'
].join(',');
class SemanticScholarAdapter extends base_adapter_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.sourceId = 'semantic_scholar';
        this.displayName = 'Semantic Scholar';
    }
    async search(query) {
        const res = await this.http.get(`${BASE}/paper/search`, {
            params: { query: query.text, fields: FIELDS, limit: 20, offset: 0 },
        });
        return (res.data?.data ?? []).map((r) => this.mapPaper(r));
    }
    mapPaper(r) {
        const doi = this.normalizeDoi(r.externalIds?.DOI);
        const isOA = !!r.openAccessPdf?.url;
        return {
            id: doi ?? r.paperId,
            doi,
            title: this.cleanTitle(r.title),
            authors: (r.authors ?? []).map((a) => ({ name: a.name })),
            abstract: this.truncate(r.abstract ?? ''),
            year: this.safeYear(r.year),
            journal: r.journal?.name ?? r.publicationVenue?.name,
            citationCount: r.citationCount ?? 0,
            publicationType: this.mapType(r.publicationTypes),
            accessStatus: isOA ? 'open_access' : doi ? 'paid' : 'unknown',
            pdfUrl: r.openAccessPdf?.url,
            publisherUrl: doi
                ? `https://doi.org/${doi}`
                : `https://www.semanticscholar.org/paper/${r.paperId}`,
            sources: ['semantic_scholar'],
        };
    }
    mapType(types) {
        if (!types?.length)
            return 'unknown';
        if (types.includes('JournalArticle'))
            return 'journal';
        if (types.includes('Conference'))
            return 'conference';
        if (types.includes('Review'))
            return 'journal';
        return 'unknown';
    }
}
exports.SemanticScholarAdapter = SemanticScholarAdapter;

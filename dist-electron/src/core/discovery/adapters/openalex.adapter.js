"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAlexAdapter = void 0;
const base_adapter_1 = require("./base.adapter");
const BASE = 'https://api.openalex.org';
const SELECT = [
    'id', 'doi', 'title', 'authorships', 'publication_year',
    'abstract_inverted_index', 'primary_location', 'open_access',
    'cited_by_count', 'type', 'biblio'
].join(',');
class OpenAlexAdapter extends base_adapter_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.sourceId = 'openalex';
        this.displayName = 'OpenAlex';
    }
    async search(query) {
        const res = await this.http.get(`${BASE}/works`, {
            params: { search: query.text, select: SELECT, per_page: 20 },
            headers: { 'User-Agent': 'CiteForge/1.0 (mailto:citeforge@example.com)' },
        });
        return (res.data?.results ?? []).map((w) => this.mapWork(w));
    }
    mapWork(w) {
        const doi = this.normalizeDoi(w.doi);
        const pdfUrl = w.open_access?.oa_url ?? w.primary_location?.pdf_url;
        return {
            id: doi ?? w.id,
            doi,
            title: this.cleanTitle(w.title),
            authors: (w.authorships ?? []).map((a) => ({
                name: a.author?.display_name ?? 'Unknown',
                orcid: a.author?.orcid?.replace('https://orcid.org/', ''),
            })),
            abstract: this.truncate(this.reconstructAbstract(w.abstract_inverted_index)),
            year: this.safeYear(w.publication_year),
            journal: w.primary_location?.source?.display_name,
            citationCount: w.cited_by_count ?? 0,
            publicationType: this.mapType(w.type),
            accessStatus: w.open_access?.is_oa ? 'open_access' : doi ? 'paid' : 'unknown',
            pdfUrl: pdfUrl || undefined,
            publisherUrl: doi ? `https://doi.org/${doi}` : w.id,
            volume: w.biblio?.volume,
            issue: w.biblio?.issue,
            pages: w.biblio?.first_page
                ? `${w.biblio.first_page}-${w.biblio.last_page ?? ''}`.replace(/-$/, '')
                : undefined,
            sources: ['openalex'],
        };
    }
    mapType(t) {
        const m = {
            article: 'journal',
            'proceedings-article': 'conference',
            dissertation: 'thesis',
            'posted-content': 'preprint',
        };
        return m[t] ?? 'unknown';
    }
}
exports.OpenAlexAdapter = OpenAlexAdapter;

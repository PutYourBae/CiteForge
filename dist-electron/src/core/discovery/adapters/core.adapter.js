"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreAdapter = void 0;
const base_adapter_1 = require("./base.adapter");
// CORE API — 200M+ open-access papers, requires free API key
const BASE = 'https://api.core.ac.uk/v3';
class CoreAdapter extends base_adapter_1.BaseAdapter {
    constructor(apiKey) {
        super(10000);
        this.sourceId = 'core';
        this.displayName = 'CORE';
        this.apiKey = null;
        this.apiKey = apiKey ?? null;
    }
    async search(query) {
        if (!this.apiKey) {
            // Without a key, try a basic anonymous request
            return this.searchAnonymous(query);
        }
        try {
            const res = await this.http.post(`${BASE}/search/works`, {
                q: query.text,
                limit: 15,
                scroll: false,
                stats: false,
                rawStatsOnly: false,
                fields: ['id', 'title', 'authors', 'abstract', 'yearPublished', 'doi',
                    'downloadUrl', 'sourceFulltextUrls', 'journals', 'publisher',
                    'citationCount', 'documentType'],
            }, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            return (res.data?.results ?? []).map((w) => this.mapWork(w));
        }
        catch {
            return [];
        }
    }
    async searchAnonymous(query) {
        // CORE also exposes a GET endpoint for simple queries when authenticated via key in URL
        // Fallback: return empty to not break the search
        return [];
    }
    mapWork(w) {
        const doi = this.normalizeDoi(w.doi);
        const pdfUrl = w.downloadUrl ?? w.sourceFulltextUrls?.[0];
        return {
            id: doi ?? `core:${w.id}`,
            doi,
            title: this.cleanTitle(w.title),
            authors: (w.authors ?? []).map((a) => ({
                name: typeof a === 'string' ? a : a.name ?? '',
            })).filter((a) => a.name),
            abstract: this.truncate(w.abstract ?? ''),
            year: this.safeYear(w.yearPublished),
            journal: w.journals?.[0]?.title ?? w.publisher,
            citationCount: w.citationCount ?? 0,
            publicationType: w.documentType === 'conference-paper' ? 'conference' : 'journal',
            accessStatus: pdfUrl ? 'open_access' : doi ? 'paid' : 'unknown',
            pdfUrl: pdfUrl || undefined,
            publisherUrl: doi
                ? `https://doi.org/${doi}`
                : `https://core.ac.uk/works/${w.id}`,
            sources: ['core'],
        };
    }
}
exports.CoreAdapter = CoreAdapter;

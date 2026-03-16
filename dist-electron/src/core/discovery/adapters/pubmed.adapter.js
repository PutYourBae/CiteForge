"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PubMedAdapter = void 0;
const base_adapter_1 = require("./base.adapter");
// PubMed E-utilities API (NCBI) — no key needed for basic use
const ESEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const EFETCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const ESUMMARY = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
class PubMedAdapter extends base_adapter_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.sourceId = 'pubmed';
        this.displayName = 'PubMed';
    }
    async search(query) {
        try {
            // Step 1: Get PMIDs
            const searchRes = await this.http.get(ESEARCH, {
                params: {
                    db: 'pubmed',
                    term: query.text,
                    retmax: 15,
                    retmode: 'json',
                    sort: 'relevance',
                },
            });
            const ids = searchRes.data?.esearchresult?.idlist ?? [];
            if (!ids.length)
                return [];
            // Step 2: Get summaries for those IDs
            const summaryRes = await this.http.get(ESUMMARY, {
                params: {
                    db: 'pubmed',
                    id: ids.join(','),
                    retmode: 'json',
                },
            });
            const uids = summaryRes.data?.result?.uids ?? [];
            const result = summaryRes.data?.result ?? {};
            return uids.map(uid => this.mapSummary(uid, result[uid])).filter(Boolean);
        }
        catch {
            return [];
        }
    }
    mapSummary(pmid, r) {
        if (!r || r.error)
            return null;
        const doi = this.normalizeDoi(r.articleids?.find((a) => a.idtype === 'doi')?.value);
        const year = this.safeYear(r.pubdate?.split(' ')[0]);
        const authors = (r.authors ?? []).map((a) => ({ name: a.name }));
        const journal = r.fulljournalname ?? r.source;
        // Check for PMC free full text
        const hasPMC = r.articleids?.some((a) => a.idtype === 'pmc');
        const pmcId = r.articleids?.find((a) => a.idtype === 'pmc')?.value;
        return {
            id: doi ?? `pmid:${pmid}`,
            doi,
            title: this.cleanTitle(r.title),
            authors,
            abstract: '', // ESummary doesn't include abstract, EFetch would be needed
            year,
            journal,
            volume: r.volume,
            issue: r.issue,
            pages: r.pages,
            citationCount: 0,
            publicationType: 'journal',
            accessStatus: hasPMC ? 'open_access' : doi ? 'paid' : 'unknown',
            pdfUrl: pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/pdf/` : undefined,
            publisherUrl: doi
                ? `https://doi.org/${doi}`
                : `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
            sources: ['pubmed'],
        };
    }
}
exports.PubMedAdapter = PubMedAdapter;

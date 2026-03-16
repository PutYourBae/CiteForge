"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSearchHandlers = registerSearchHandlers;
const electron_1 = require("electron");
const semantic_scholar_adapter_1 = require("../../src/core/discovery/adapters/semantic-scholar.adapter");
const openalex_adapter_1 = require("../../src/core/discovery/adapters/openalex.adapter");
const arxiv_adapter_1 = require("../../src/core/discovery/adapters/arxiv.adapter");
const crossref_adapter_1 = require("../../src/core/discovery/adapters/crossref.adapter");
const pubmed_adapter_1 = require("../../src/core/discovery/adapters/pubmed.adapter");
const core_adapter_1 = require("../../src/core/discovery/adapters/core.adapter");
const deduplicator_1 = require("../../src/core/discovery/deduplicator");
const ranker_1 = require("../../src/core/discovery/ranker");
const query_processor_1 = require("../../src/core/discovery/query-processor");
const adapters = [
    new semantic_scholar_adapter_1.SemanticScholarAdapter(),
    new openalex_adapter_1.OpenAlexAdapter(),
    new arxiv_adapter_1.ArxivAdapter(),
    new crossref_adapter_1.CrossRefAdapter(),
    new pubmed_adapter_1.PubMedAdapter(),
    new core_adapter_1.CoreAdapter(),
];
const deduplicator = new deduplicator_1.Deduplicator();
const ranker = new ranker_1.RelevanceRanker();
const processor = new query_processor_1.QueryProcessor();
function registerSearchHandlers() {
    electron_1.ipcMain.handle('search:query', async (_e, query) => {
        const start = Date.now();
        const processed = processor.process(query);
        // Parallel fetch with 8s timeout
        const settled = await Promise.allSettled(adapters.map(a => Promise.race([
            a.search(processed),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
        ])));
        const stats = {};
        const allPapers = [];
        settled.forEach((result, i) => {
            const sourceId = adapters[i].sourceId;
            if (result.status === 'fulfilled') {
                allPapers.push(...result.value);
                stats[sourceId] = { found: result.value.length, status: 'ok' };
            }
            else {
                const isTimeout = result.reason?.message === 'timeout';
                stats[sourceId] = { found: 0, status: isTimeout ? 'timeout' : 'error' };
            }
        });
        const unique = deduplicator.run(allPapers);
        const ranked = ranker.rank(unique, processed);
        // Apply filters
        const filtered = ranked.filter(p => {
            if (query.filters?.yearFrom && (p.year ?? 0) < query.filters.yearFrom)
                return false;
            if (query.filters?.yearTo && (p.year ?? 9999) > query.filters.yearTo)
                return false;
            if (query.filters?.accessType === 'open_access' && p.accessStatus !== 'open_access')
                return false;
            return true;
        });
        return {
            papers: filtered.slice(0, query.filters?.maxResults ?? 50),
            totalFound: filtered.length,
            sourceStats: stats,
            fromCache: false,
            searchDurationMs: Date.now() - start,
        };
    });
}

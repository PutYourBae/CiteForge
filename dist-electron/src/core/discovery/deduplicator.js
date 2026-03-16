"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deduplicator = void 0;
// Jaro-Winkler similarity for title matching
function jaroWinkler(s1, s2) {
    if (s1 === s2)
        return 1;
    const len1 = s1.length, len2 = s2.length;
    if (!len1 || !len2)
        return 0;
    const matchDist = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);
    const s1Matches = Array(len1).fill(false);
    const s2Matches = Array(len2).fill(false);
    let matches = 0, transpositions = 0;
    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchDist);
        const end = Math.min(i + matchDist + 1, len2);
        for (let j = start; j < end; j++) {
            if (s2Matches[j] || s1[i] !== s2[j])
                continue;
            s1Matches[i] = s2Matches[j] = true;
            matches++;
            break;
        }
    }
    if (!matches)
        return 0;
    let k = 0;
    for (let i = 0; i < len1; i++) {
        if (!s1Matches[i])
            continue;
        while (!s2Matches[k])
            k++;
        if (s1[i] !== s2[k++])
            transpositions++;
    }
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    const prefix = [...Array(Math.min(4, len1, len2))].filter((_, i) => s1[i] === s2[i]).length;
    return jaro + prefix * 0.1 * (1 - jaro);
}
const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'on', 'in', 'for', 'and', 'or', 'to', 'is']);
function normalizeTitle(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => !STOPWORDS.has(w))
        .join(' ');
}
function sourceWeight(sourceId) {
    const weights = {
        crossref: 10, semantic_scholar: 9, openalex: 8,
        arxiv: 7, pubmed: 6, core: 5, doaj: 4, base_search: 3, eric: 3,
    };
    return weights[sourceId] ?? 0;
}
function mergePapers(group) {
    const sorted = [...group].sort((a, b) => sourceWeight(b.sources[0]) - sourceWeight(a.sources[0]));
    const primary = sorted[0];
    const bestAbstract = group.reduce((best, p) => (p.abstract?.length ?? 0) > (best?.length ?? 0) ? p.abstract : best, primary.abstract);
    const maxCitations = Math.max(...group.map(p => p.citationCount));
    const oaEntry = group.find(p => p.accessStatus === 'open_access');
    return {
        ...primary,
        abstract: bestAbstract,
        citationCount: maxCitations,
        accessStatus: oaEntry ? 'open_access' : primary.accessStatus,
        pdfUrl: oaEntry?.pdfUrl ?? primary.pdfUrl,
        sources: [...new Set(group.flatMap(p => p.sources))],
    };
}
class Deduplicator {
    run(papers) {
        // Pass 1: DOI-based exact dedup
        const doiMap = new Map();
        const noDoi = [];
        for (const p of papers) {
            if (p.doi) {
                const key = p.doi.toLowerCase();
                if (!doiMap.has(key))
                    doiMap.set(key, []);
                doiMap.get(key).push(p);
            }
            else {
                noDoi.push(p);
            }
        }
        const pass1 = [
            ...Array.from(doiMap.values()).map(mergePapers),
            ...noDoi,
        ];
        // Pass 2: Fuzzy title dedup on remaining
        const merged = [];
        const used = new Set();
        for (let i = 0; i < pass1.length; i++) {
            if (used.has(i))
                continue;
            const group = [pass1[i]];
            for (let j = i + 1; j < pass1.length; j++) {
                if (used.has(j))
                    continue;
                const sim = jaroWinkler(normalizeTitle(pass1[i].title), normalizeTitle(pass1[j].title));
                if (sim >= 0.88) {
                    group.push(pass1[j]);
                    used.add(j);
                }
            }
            merged.push(group.length > 1 ? mergePapers(group) : group[0]);
            used.add(i);
        }
        return merged;
    }
}
exports.Deduplicator = Deduplicator;

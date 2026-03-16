"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicDiscovery = void 0;
const taxonomy_1 = require("./taxonomy");
class TopicDiscovery {
    detect(ctx) {
        const text = [
            ctx.paper.title,
            ctx.abstract,
            ctx.fullText?.substring(0, 3000) ?? '',
        ].join(' ').toLowerCase();
        const scores = {};
        for (const [topic, keywords] of Object.entries(taxonomy_1.TOPIC_TAXONOMY)) {
            let score = 0;
            for (const kw of keywords) {
                const regex = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    // Title matches worth 3x
                    const titleMatches = (ctx.paper.title.toLowerCase().match(regex) ?? []).length;
                    score += matches.length + titleMatches * 2;
                }
            }
            if (score > 0)
                scores[topic] = score;
        }
        // Return top topics with score > threshold
        return Object.entries(scores)
            .filter(([, score]) => score >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic]) => topic);
    }
}
exports.TopicDiscovery = TopicDiscovery;

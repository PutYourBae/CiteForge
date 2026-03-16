"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiEngine = exports.AIIntelligenceEngine = void 0;
const context_builder_1 = require("./context-builder");
const engine_1 = require("./summary/engine");
const generator_1 = require("./citation/generator");
const engine_2 = require("./graph/engine");
const discovery_1 = require("./topics/discovery");
const engine_3 = require("./recommendation/engine");
const extractor_1 = require("./pdf/extractor");
const ctxBuilder = new context_builder_1.ContextBuilder();
const pdfExtractor = new extractor_1.PDFExtractor();
const summaryEngine = new engine_1.SummaryEngine();
const citationGen = new generator_1.CitationGenerator();
const graphEngine = new engine_2.GraphEngine();
const topicDiscovery = new discovery_1.TopicDiscovery();
const recommender = new engine_3.RecommendationEngine();
class AIIntelligenceEngine {
    async enrich(paper) {
        // Extract PDF content if available (non-blocking)
        const pdfData = paper.pdfUrl && paper.accessStatus === 'open_access'
            ? await pdfExtractor.extract(paper.pdfUrl).catch(() => undefined)
            : undefined;
        const context = ctxBuilder.build(paper, pdfData);
        const citations = citationGen.generateAll(paper);
        // Run all AI tasks in parallel
        const [summaries, topics, graph, recommendations] = await Promise.all([
            summaryEngine.generate(context),
            Promise.resolve(topicDiscovery.detect(context)),
            graphEngine.buildGraph(paper),
            recommender.forPaper(paper),
        ]);
        return { paper, summaries, topics, graph, recommendations, citations };
    }
    cite(paper, format) {
        return citationGen.generate(paper, format);
    }
    citeAll(paper) {
        return citationGen.generateAll(paper);
    }
}
exports.AIIntelligenceEngine = AIIntelligenceEngine;
exports.aiEngine = new AIIntelligenceEngine();

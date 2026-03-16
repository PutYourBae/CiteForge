"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryEngine = void 0;
const extractive_1 = require("./extractive");
const router_1 = require("../llm/router");
const extractive = new extractive_1.ExtractiveSummarizer();
const llm = new router_1.LLMRouter();
class SummaryEngine {
    async generate(ctx) {
        const sourceText = ctx.fullText
            ? `${ctx.sections?.abstract ?? ctx.abstract}\n\n${ctx.sections?.introduction ?? ''}\n\n${ctx.sections?.conclusion ?? ''}`
            : ctx.abstract;
        if (!sourceText.trim()) {
            return {
                short: 'No abstract available for this paper.',
                research: undefined,
                keyContributions: [],
                methodOverview: undefined,
                isLoading: false,
                generatedBy: 'local_rules',
            };
        }
        // Always generate Tier 1 (local) first — instant
        const short = extractive.summarize(sourceText, 2);
        const keyContributions = extractive.keyContributions(sourceText);
        const methodOverview = ctx.sections?.methodology
            ? extractive.summarize(ctx.sections.methodology, 2)
            : undefined;
        // Try LLM if configured
        let research;
        let generatedBy = 'local_rules';
        try {
            const llmResult = await llm.summarize(ctx);
            if (llmResult) {
                research = llmResult.summary;
                generatedBy = llmResult.provider;
            }
        }
        catch {
            // LLM unavailable — fall back to extractive
            research = extractive.summarize(sourceText, 4);
        }
        if (!research) {
            research = extractive.summarize(sourceText, 4);
        }
        return {
            short,
            research,
            keyContributions,
            methodOverview,
            isLoading: false,
            generatedBy,
        };
    }
}
exports.SummaryEngine = SummaryEngine;

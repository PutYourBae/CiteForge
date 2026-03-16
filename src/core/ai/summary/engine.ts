// src/core/ai/summary/engine.ts
import { PaperContext, PaperSummaries } from '../../../types/ai.types'
import { ExtractiveSummarizer } from './extractive'
import { LLMRouter } from '../llm/router'

const extractive = new ExtractiveSummarizer()
const llm = new LLMRouter()

export class SummaryEngine {
  async generate(ctx: PaperContext): Promise<PaperSummaries> {
    const sourceText = ctx.fullText
      ? `${ctx.sections?.abstract ?? ctx.abstract}\n\n${ctx.sections?.introduction ?? ''}\n\n${ctx.sections?.conclusion ?? ''}`
      : ctx.abstract

    if (!sourceText.trim()) {
      return {
        short: 'No abstract available for this paper.',
        research: undefined,
        keyContributions: [],
        methodOverview: undefined,
        isLoading: false,
        generatedBy: 'local_rules',
      }
    }

    // Always generate Tier 1 (local) first — instant
    const short = extractive.summarize(sourceText, 2)
    const keyContributions = extractive.keyContributions(sourceText)
    const methodOverview = ctx.sections?.methodology
      ? extractive.summarize(ctx.sections.methodology, 2)
      : undefined

    // Try LLM if configured
    let research: string | undefined
    let generatedBy: PaperSummaries['generatedBy'] = 'local_rules'

    try {
      const llmResult = await llm.summarize(ctx)
      if (llmResult) {
        research = llmResult.summary
        generatedBy = llmResult.provider
      }
    } catch {
      // LLM unavailable — fall back to extractive
      research = extractive.summarize(sourceText, 4)
    }

    if (!research) {
      research = extractive.summarize(sourceText, 4)
    }

    return {
      short,
      research,
      keyContributions,
      methodOverview,
      isLoading: false,
      generatedBy,
    }
  }
}

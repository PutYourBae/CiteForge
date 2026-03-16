// src/core/ai/index.ts — AI Intelligence Engine singleton
import { Paper } from '../../types/paper.types'
import { AIInsight, CitationFormat } from '../../types/ai.types'
import { ContextBuilder } from './context-builder'
import { SummaryEngine } from './summary/engine'
import { CitationGenerator } from './citation/generator'
import { GraphEngine } from './graph/engine'
import { TopicDiscovery } from './topics/discovery'
import { RecommendationEngine } from './recommendation/engine'
import { PDFExtractor } from './pdf/extractor'

const ctxBuilder = new ContextBuilder()
const pdfExtractor = new PDFExtractor()
const summaryEngine = new SummaryEngine()
const citationGen = new CitationGenerator()
const graphEngine = new GraphEngine()
const topicDiscovery = new TopicDiscovery()
const recommender = new RecommendationEngine()

export class AIIntelligenceEngine {
  async enrich(paper: Paper): Promise<AIInsight> {
    // Extract PDF content if available (non-blocking)
    const pdfData = paper.pdfUrl && paper.accessStatus === 'open_access'
      ? await pdfExtractor.extract(paper.pdfUrl).catch(() => undefined)
      : undefined

    const context = ctxBuilder.build(paper, pdfData)
    const citations = citationGen.generateAll(paper)

    // Run all AI tasks in parallel
    const [summaries, topics, graph, recommendations] = await Promise.all([
      summaryEngine.generate(context),
      Promise.resolve(topicDiscovery.detect(context)),
      graphEngine.buildGraph(paper),
      recommender.forPaper(paper),
    ])

    return { paper, summaries, topics, graph, recommendations, citations }
  }

  cite(paper: Paper, format: CitationFormat): string {
    return citationGen.generate(paper, format)
  }

  citeAll(paper: Paper): Record<CitationFormat, string> {
    return citationGen.generateAll(paper)
  }
}

export const aiEngine = new AIIntelligenceEngine()

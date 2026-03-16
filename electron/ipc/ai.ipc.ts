import { ipcMain } from 'electron'
import { AIIntelligenceEngine } from '../../src/core/ai/index'
import { Paper } from '../../src/types/paper.types'
import { CitationFormat } from '../../src/types/ai.types'
import { getDb } from '../../database/db'

const aiEngine = new AIIntelligenceEngine()

export function registerAIHandlers() {
  // Full AI enrichment: summaries, topics, graph, recommendations
  ipcMain.handle('ai:enrich', async (_e, paper: Paper) => {
    try {
      const db = getDb()
      // Check cache first
      const cached = db.prepare(
        'SELECT * FROM ai_insights WHERE paper_id = ?'
      ).get(paper.id) as any

      if (cached) {
        return {
          paper,
          summaries: {
            short: cached.short_summary,
            research: cached.research_summary,
            keyContributions: JSON.parse(cached.key_contributions ?? '[]'),
            methodOverview: cached.method_overview,
            isLoading: false,
            generatedBy: cached.ai_mode ?? 'local_rules',
          },
          topics: JSON.parse(cached.topics ?? '[]'),
          graph: { nodes: [], edges: [], centerPaperId: paper.id },
          recommendations: [],
        }
      }

      // Generate fresh insight
      const insight = await aiEngine.enrich(paper)

      // Cache it
      db.prepare(`
        INSERT OR REPLACE INTO ai_insights
          (paper_id, short_summary, research_summary, key_contributions,
           method_overview, topics, ai_mode, generated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        paper.id,
        insight.summaries?.short ?? '',
        insight.summaries?.research ?? '',
        JSON.stringify(insight.summaries?.keyContributions ?? []),
        insight.summaries?.methodOverview ?? '',
        JSON.stringify(insight.topics ?? []),
        insight.summaries?.generatedBy ?? 'local_rules',
      )

      return insight
    } catch (err: any) {
      console.error('[AI IPC] enrich failed:', err.message)
      throw err
    }
  })

  // Quick citation only — no full enrichment
  ipcMain.handle('ai:cite', async (_e, paper: Paper, format: CitationFormat) => {
    return aiEngine.cite(paper, format)
  })

  // All formats at once
  ipcMain.handle('ai:citeAll', async (_e, paper: Paper) => {
    return aiEngine.citeAll(paper)
  })
}

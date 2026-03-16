"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAIHandlers = registerAIHandlers;
const electron_1 = require("electron");
const index_1 = require("../../src/core/ai/index");
const db_1 = require("../../database/db");
const aiEngine = new index_1.AIIntelligenceEngine();
function registerAIHandlers() {
    // Full AI enrichment: summaries, topics, graph, recommendations
    electron_1.ipcMain.handle('ai:enrich', async (_e, paper) => {
        try {
            const db = (0, db_1.getDb)();
            // Check cache first
            const cached = db.prepare('SELECT * FROM ai_insights WHERE paper_id = ?').get(paper.id);
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
                };
            }
            // Generate fresh insight
            const insight = await aiEngine.enrich(paper);
            // Cache it
            db.prepare(`
        INSERT OR REPLACE INTO ai_insights
          (paper_id, short_summary, research_summary, key_contributions,
           method_overview, topics, ai_mode, generated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(paper.id, insight.summaries?.short ?? '', insight.summaries?.research ?? '', JSON.stringify(insight.summaries?.keyContributions ?? []), insight.summaries?.methodOverview ?? '', JSON.stringify(insight.topics ?? []), insight.summaries?.generatedBy ?? 'local_rules');
            return insight;
        }
        catch (err) {
            console.error('[AI IPC] enrich failed:', err.message);
            throw err;
        }
    });
    // Quick citation only — no full enrichment
    electron_1.ipcMain.handle('ai:cite', async (_e, paper, format) => {
        return aiEngine.cite(paper, format);
    });
    // All formats at once
    electron_1.ipcMain.handle('ai:citeAll', async (_e, paper) => {
        return aiEngine.citeAll(paper);
    });
}

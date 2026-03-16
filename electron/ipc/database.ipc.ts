import { ipcMain } from 'electron'
import { getDb } from '../../database/db'
import { Paper } from '../../src/types/paper.types'

export function registerDatabaseHandlers() {
  // ── Save a paper to local library ───────────────────────────────
  ipcMain.handle('db:savePaper', (_e, paper: Paper) => {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO papers
        (id, doi, arxiv_id, title, abstract, year, journal, conference,
         volume, issue, pages, publisher, access_status, pdf_url,
         publisher_url, citation_count, pub_type, sources, updated_at)
      VALUES
        (@id, @doi, @arxivId, @title, @abstract, @year, @journal, @conference,
         @volume, @issue, @pages, @publisher, @accessStatus, @pdfUrl,
         @publisherUrl, @citationCount, @publicationType, @sources,
         datetime('now'))
    `)
    stmt.run({
      ...paper,
      sources: JSON.stringify(paper.sources),
    })

    // Insert into saved_papers
    db.prepare(`
      INSERT OR IGNORE INTO saved_papers (paper_id) VALUES (?)
    `).run(paper.id)

    return { success: true }
  })

  // ── Get all saved papers ─────────────────────────────────────────
  ipcMain.handle('db:getSavedPapers', () => {
    const db = getDb()
    const rows = db.prepare(`
      SELECT p.*, sp.tags, sp.notes, sp.saved_at AS savedAt
      FROM papers p
      JOIN saved_papers sp ON sp.paper_id = p.id
      ORDER BY sp.saved_at DESC
    `).all()
    return rows.map(normalizePaperRow)
  })

  // ── Delete a saved paper ─────────────────────────────────────────
  ipcMain.handle('db:deleteSavedPaper', (_e, id: string) => {
    getDb().prepare('DELETE FROM saved_papers WHERE paper_id = ?').run(id)
    return { success: true }
  })

  // ── Update notes ─────────────────────────────────────────────────
  ipcMain.handle('db:updatePaperNotes', (_e, id: string, notes: string) => {
    getDb().prepare('UPDATE saved_papers SET notes = ? WHERE paper_id = ?').run(notes, id)
    return { success: true }
  })

  // ── AI Insights ──────────────────────────────────────────────────
  ipcMain.handle('db:getAIInsight', (_e, paperId: string) => {
    const row = getDb().prepare(
      'SELECT * FROM ai_insights WHERE paper_id = ?'
    ).get(paperId) as any
    if (!row) return null
    return {
      ...row,
      keyContributions: row.key_contributions ? JSON.parse(row.key_contributions) : [],
      topics: row.topics ? JSON.parse(row.topics) : [],
    }
  })

  ipcMain.handle('db:saveAIInsight', (_e, paperId: string, insight: any) => {
    getDb().prepare(`
      INSERT OR REPLACE INTO ai_insights
        (paper_id, short_summary, research_summary, key_contributions,
         method_overview, topics, citation_apa, citation_ieee,
         citation_mla, citation_chicago, citation_bibtex, ai_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paperId,
      insight.summaries?.short,
      insight.summaries?.research,
      JSON.stringify(insight.summaries?.keyContributions ?? []),
      insight.summaries?.methodOverview,
      JSON.stringify(insight.topics ?? []),
      insight.citations?.apa,
      insight.citations?.ieee,
      insight.citations?.mla,
      insight.citations?.chicago,
      insight.citations?.bibtex,
      insight.summaries?.generatedBy ?? 'local_rules',
    )
    return { success: true }
  })

  // ── Settings ─────────────────────────────────────────────────────
  ipcMain.handle('db:getSettings', () => {
    const rows = getDb().prepare('SELECT key, value FROM settings').all() as any[]
    const settings: Record<string, any> = {}
    for (const row of rows) {
      try { settings[row.key] = JSON.parse(row.value) }
      catch { settings[row.key] = row.value }
    }
    return settings
  })

  ipcMain.handle('db:getSetting', (_e, key: string) => {
    const row = getDb().prepare(
      'SELECT value FROM settings WHERE key = ?'
    ).get(key) as any
    return row ? JSON.parse(row.value) : null
  })

  ipcMain.handle('db:saveSettings', (_e, settings: Record<string, any>) => {
    const db = getDb()
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
    )
    const saveMany = db.transaction((s: Record<string, any>) => {
      for (const [key, value] of Object.entries(s)) {
        stmt.run(key, JSON.stringify(value))
      }
    })
    saveMany(settings)
    return { success: true }
  })
}

function normalizePaperRow(row: any) {
  return {
    ...row,
    sources: row.sources ? JSON.parse(row.sources) : [],
    authors: [],  // Authors loaded separately if needed
  }
}

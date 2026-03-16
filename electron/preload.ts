import { contextBridge, ipcRenderer } from 'electron'

/**
 * CiteForge secure IPC bridge.
 * Exposes only specific, typed functions to the renderer process.
 * Never exposes ipcRenderer directly — that would be a security risk.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ── Search ──────────────────────────────────────────────────────
  search: (query: unknown) =>
    ipcRenderer.invoke('search:query', query),

  // ── Paper Library (SQLite) ───────────────────────────────────────
  savePaper: (paper: unknown) =>
    ipcRenderer.invoke('db:savePaper', paper),
  getSavedPapers: () =>
    ipcRenderer.invoke('db:getSavedPapers'),
  deleteSavedPaper: (id: string) =>
    ipcRenderer.invoke('db:deleteSavedPaper', id),
  updatePaperNotes: (id: string, notes: string) =>
    ipcRenderer.invoke('db:updatePaperNotes', id, notes),

  // ── AI Intelligence Engine ────────────────────────────────────────
  aiEnrich: (paper: unknown) =>
    ipcRenderer.invoke('ai:enrich', paper),
  aiCite: (paper: unknown, format: string) =>
    ipcRenderer.invoke('ai:cite', paper, format),
  aiCiteAll: (paper: unknown) =>
    ipcRenderer.invoke('ai:citeAll', paper),

  // ── AI Insights Cache (DB) ────────────────────────────────────────
  getAIInsight: (paperId: string) =>
    ipcRenderer.invoke('db:getAIInsight', paperId),
  saveAIInsight: (paperId: string, insight: unknown) =>
    ipcRenderer.invoke('db:saveAIInsight', paperId, insight),

  // ── Downloads ────────────────────────────────────────────────────
  downloadPaper: (paper: unknown) =>
    ipcRenderer.invoke('download:start', paper),
  cancelDownload: (downloadId: number) =>
    ipcRenderer.invoke('download:cancel', downloadId),
  getDownloads: () =>
    ipcRenderer.invoke('download:list'),
  onDownloadProgress: (cb: (data: unknown) => void) => {
    ipcRenderer.on('download:progress', (_event, data) => cb(data))
    // Return cleanup function
    return () => ipcRenderer.removeAllListeners('download:progress')
  },

  // ── Settings ─────────────────────────────────────────────────────
  getSettings: () =>
    ipcRenderer.invoke('db:getSettings'),
  saveSettings: (settings: unknown) =>
    ipcRenderer.invoke('db:saveSettings', settings),
  getSetting: (key: string) =>
    ipcRenderer.invoke('db:getSetting', key),

  // ── System ───────────────────────────────────────────────────────
  openExternal: (url: string) =>
    ipcRenderer.invoke('system:openExternal', url),
  showSaveDialog: (defaultName?: string) =>
    ipcRenderer.invoke('system:showSaveDialog', defaultName),
  showOpenDialog: () =>
    ipcRenderer.invoke('system:showOpenDialog'),
  getAppVersion: () =>
    ipcRenderer.invoke('system:getVersion'),
})

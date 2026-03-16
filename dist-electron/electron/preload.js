"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * CiteForge secure IPC bridge.
 * Exposes only specific, typed functions to the renderer process.
 * Never exposes ipcRenderer directly — that would be a security risk.
 */
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // ── Search ──────────────────────────────────────────────────────
    search: (query) => electron_1.ipcRenderer.invoke('search:query', query),
    // ── Paper Library (SQLite) ───────────────────────────────────────
    savePaper: (paper) => electron_1.ipcRenderer.invoke('db:savePaper', paper),
    getSavedPapers: () => electron_1.ipcRenderer.invoke('db:getSavedPapers'),
    deleteSavedPaper: (id) => electron_1.ipcRenderer.invoke('db:deleteSavedPaper', id),
    updatePaperNotes: (id, notes) => electron_1.ipcRenderer.invoke('db:updatePaperNotes', id, notes),
    // ── AI Intelligence Engine ────────────────────────────────────────
    aiEnrich: (paper) => electron_1.ipcRenderer.invoke('ai:enrich', paper),
    aiCite: (paper, format) => electron_1.ipcRenderer.invoke('ai:cite', paper, format),
    aiCiteAll: (paper) => electron_1.ipcRenderer.invoke('ai:citeAll', paper),
    // ── AI Insights Cache (DB) ────────────────────────────────────────
    getAIInsight: (paperId) => electron_1.ipcRenderer.invoke('db:getAIInsight', paperId),
    saveAIInsight: (paperId, insight) => electron_1.ipcRenderer.invoke('db:saveAIInsight', paperId, insight),
    // ── Downloads ────────────────────────────────────────────────────
    downloadPaper: (paper) => electron_1.ipcRenderer.invoke('download:start', paper),
    cancelDownload: (downloadId) => electron_1.ipcRenderer.invoke('download:cancel', downloadId),
    getDownloads: () => electron_1.ipcRenderer.invoke('download:list'),
    onDownloadProgress: (cb) => {
        electron_1.ipcRenderer.on('download:progress', (_event, data) => cb(data));
        // Return cleanup function
        return () => electron_1.ipcRenderer.removeAllListeners('download:progress');
    },
    // ── Settings ─────────────────────────────────────────────────────
    getSettings: () => electron_1.ipcRenderer.invoke('db:getSettings'),
    saveSettings: (settings) => electron_1.ipcRenderer.invoke('db:saveSettings', settings),
    getSetting: (key) => electron_1.ipcRenderer.invoke('db:getSetting', key),
    // ── System ───────────────────────────────────────────────────────
    openExternal: (url) => electron_1.ipcRenderer.invoke('system:openExternal', url),
    showSaveDialog: (defaultName) => electron_1.ipcRenderer.invoke('system:showSaveDialog', defaultName),
    showOpenDialog: () => electron_1.ipcRenderer.invoke('system:showOpenDialog'),
    getAppVersion: () => electron_1.ipcRenderer.invoke('system:getVersion'),
});

"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // ── Search ──────────────────────────────────────────────────────
  search: (query) => electron.ipcRenderer.invoke("search:query", query),
  // ── Paper Library (SQLite) ───────────────────────────────────────
  savePaper: (paper) => electron.ipcRenderer.invoke("db:savePaper", paper),
  getSavedPapers: () => electron.ipcRenderer.invoke("db:getSavedPapers"),
  deleteSavedPaper: (id) => electron.ipcRenderer.invoke("db:deleteSavedPaper", id),
  updatePaperNotes: (id, notes) => electron.ipcRenderer.invoke("db:updatePaperNotes", id, notes),
  // ── AI Intelligence Engine ────────────────────────────────────────
  aiEnrich: (paper) => electron.ipcRenderer.invoke("ai:enrich", paper),
  aiCite: (paper, format) => electron.ipcRenderer.invoke("ai:cite", paper, format),
  aiCiteAll: (paper) => electron.ipcRenderer.invoke("ai:citeAll", paper),
  // ── AI Insights Cache (DB) ────────────────────────────────────────
  getAIInsight: (paperId) => electron.ipcRenderer.invoke("db:getAIInsight", paperId),
  saveAIInsight: (paperId, insight) => electron.ipcRenderer.invoke("db:saveAIInsight", paperId, insight),
  // ── Downloads ────────────────────────────────────────────────────
  downloadPaper: (paper) => electron.ipcRenderer.invoke("download:start", paper),
  cancelDownload: (downloadId) => electron.ipcRenderer.invoke("download:cancel", downloadId),
  getDownloads: () => electron.ipcRenderer.invoke("download:list"),
  onDownloadProgress: (cb) => {
    electron.ipcRenderer.on("download:progress", (_event, data) => cb(data));
    return () => electron.ipcRenderer.removeAllListeners("download:progress");
  },
  // ── Settings ─────────────────────────────────────────────────────
  getSettings: () => electron.ipcRenderer.invoke("db:getSettings"),
  saveSettings: (settings) => electron.ipcRenderer.invoke("db:saveSettings", settings),
  getSetting: (key) => electron.ipcRenderer.invoke("db:getSetting", key),
  // ── System ───────────────────────────────────────────────────────
  openExternal: (url) => electron.ipcRenderer.invoke("system:openExternal", url),
  showSaveDialog: (defaultName) => electron.ipcRenderer.invoke("system:showSaveDialog", defaultName),
  showOpenDialog: () => electron.ipcRenderer.invoke("system:showOpenDialog"),
  getAppVersion: () => electron.ipcRenderer.invoke("system:getVersion")
});

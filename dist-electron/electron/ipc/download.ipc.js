"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDownloadHandlers = registerDownloadHandlers;
exports.registerSystemHandlers = registerSystemHandlers;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const db_1 = require("../../database/db");
const electron_2 = require("electron");
function registerDownloadHandlers() {
    electron_1.ipcMain.handle('download:start', async (_e, paper) => {
        const db = (0, db_1.getDb)();
        // Ask user where to save
        const win = electron_2.BrowserWindow.getAllWindows()[0];
        const safeName = paper.title
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .trim()
            .substring(0, 60)
            .replace(/\s+/g, '_');
        const result = await electron_1.dialog.showSaveDialog(win, {
            title: 'Save Paper PDF',
            defaultPath: path_1.default.join(electron_1.app.getPath('downloads'), `${safeName}.pdf`),
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        });
        if (result.canceled || !result.filePath)
            return { cancelled: true };
        // Insert download record
        const { lastInsertRowid: downloadId } = db.prepare(`
      INSERT INTO downloads (paper_id, file_path, status) VALUES (?, ?, 'downloading')
    `).run(paper.id, result.filePath);
        // Start download (non-blocking)
        downloadFile(paper.pdfUrl, result.filePath, Number(downloadId), win).catch(err => {
            db.prepare("UPDATE downloads SET status='failed', error_msg=? WHERE id=?").run(err.message, downloadId);
            win.webContents.send('download:progress', {
                downloadId, status: 'failed', error: err.message
            });
        });
        return { downloadId, filePath: result.filePath };
    });
    electron_1.ipcMain.handle('download:cancel', (_e, downloadId) => {
        (0, db_1.getDb)().prepare("UPDATE downloads SET status='cancelled' WHERE id=?").run(downloadId);
        return { success: true };
    });
    electron_1.ipcMain.handle('download:list', () => {
        return (0, db_1.getDb)().prepare('SELECT * FROM downloads ORDER BY started_at DESC LIMIT 50').all();
    });
}
function registerSystemHandlers() {
    electron_1.ipcMain.handle('system:openExternal', (_e, url) => {
        electron_1.shell.openExternal(url);
    });
    electron_1.ipcMain.handle('system:showSaveDialog', async (_e, defaultName) => {
        const win = electron_2.BrowserWindow.getAllWindows()[0];
        return electron_1.dialog.showSaveDialog(win, {
            defaultPath: path_1.default.join(electron_1.app.getPath('downloads'), defaultName ?? 'paper.pdf'),
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        });
    });
    electron_1.ipcMain.handle('system:showOpenDialog', async () => {
        const win = electron_2.BrowserWindow.getAllWindows()[0];
        return electron_1.dialog.showOpenDialog(win, {
            properties: ['openDirectory'],
        });
    });
    electron_1.ipcMain.handle('system:getVersion', () => electron_1.app.getVersion());
}
function downloadFile(url, dest, downloadId, win) {
    return new Promise((resolve, reject) => {
        const db = (0, db_1.getDb)();
        const file = fs_1.default.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https_1.default : http_1.default;
        const request = protocol.get(url, (response) => {
            // Follow redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                return downloadFile(response.headers.location, dest, downloadId, win)
                    .then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                file.close();
                fs_1.default.unlinkSync(dest);
                return reject(new Error(`Server returned ${response.statusCode}`));
            }
            const total = parseInt(response.headers['content-length'] ?? '0', 10);
            let received = 0;
            response.on('data', (chunk) => {
                received += chunk.length;
                const progress = total > 0 ? received / total : 0;
                db.prepare('UPDATE downloads SET progress=? WHERE id=?').run(progress, downloadId);
                win.webContents.send('download:progress', { downloadId, progress, status: 'downloading' });
            });
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                db.prepare("UPDATE downloads SET status='done', progress=1.0, completed_at=datetime('now') WHERE id=?")
                    .run(downloadId);
                win.webContents.send('download:progress', { downloadId, progress: 1, status: 'done', filePath: dest });
                resolve();
            });
        });
        request.on('error', (err) => {
            file.close();
            try {
                fs_1.default.unlinkSync(dest);
            }
            catch { }
            reject(err);
        });
    });
}

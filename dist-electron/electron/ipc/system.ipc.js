"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSystemHandlers = registerSystemHandlers;
// electron/ipc/system.ipc.ts — System-level IPC handlers
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
function registerSystemHandlers() {
    // Open a URL in the system's default browser
    electron_1.ipcMain.handle('system:openExternal', async (_e, url) => {
        if (!url || !url.startsWith('http'))
            return;
        await electron_1.shell.openExternal(url);
    });
    // Open a folder in the system file explorer
    electron_1.ipcMain.handle('system:openFolder', async (_e, folderPath) => {
        await electron_1.shell.openPath(folderPath);
    });
    // Show file in its containing folder
    electron_1.ipcMain.handle('system:showItemInFolder', async (_e, filePath) => {
        electron_1.shell.showItemInFolder(filePath);
    });
    // Save file dialog — let user pick destination
    electron_1.ipcMain.handle('system:saveDialog', async (_e, defaultName) => {
        const result = await electron_1.dialog.showSaveDialog({
            defaultPath: path_1.default.join(electron_1.app.getPath('downloads'), defaultName),
            filters: [
                { name: 'PDF Files', extensions: ['pdf'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });
        return result.canceled ? null : result.filePath;
    });
    // Folder picker dialog
    electron_1.ipcMain.handle('system:folderDialog', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
            title: 'Select Download Folder',
        });
        return result.canceled ? null : result.filePaths[0];
    });
    // App info
    electron_1.ipcMain.handle('system:getVersion', () => electron_1.app.getVersion());
    electron_1.ipcMain.handle('system:getPlatform', () => process.platform);
    electron_1.ipcMain.handle('system:getDownloadsPath', () => electron_1.app.getPath('downloads'));
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const db_1 = require("../database/db");
const search_ipc_1 = require("./ipc/search.ipc");
const download_ipc_1 = require("./ipc/download.ipc");
const database_ipc_1 = require("./ipc/database.ipc");
const system_ipc_1 = require("./ipc/system.ipc");
const ai_ipc_1 = require("./ipc/ai.ipc");
const menu_1 = require("./menu");
const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        backgroundColor: '#0F1117',
        icon: path_1.default.join(__dirname, '../assets/icon.ico'),
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools({ mode: 'undocked' });
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    // Open all target="_blank" links in system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    mainWindow.on('closed', () => { mainWindow = null; });
    (0, menu_1.buildMenu)(mainWindow);
}
electron_1.app.whenReady().then(async () => {
    try {
        await (0, db_1.initDatabase)();
    }
    catch (err) {
        console.error('[Main] Database init failed:', err);
    }
    (0, search_ipc_1.registerSearchHandlers)();
    (0, download_ipc_1.registerDownloadHandlers)();
    (0, database_ipc_1.registerDatabaseHandlers)();
    (0, system_ipc_1.registerSystemHandlers)();
    (0, ai_ipc_1.registerAIHandlers)();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        (0, db_1.closeDatabase)();
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => (0, db_1.closeDatabase)());

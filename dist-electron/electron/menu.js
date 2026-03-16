"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMenu = buildMenu;
// electron/menu.ts — Native app menu
const electron_1 = require("electron");
function buildMenu(mainWindow) {
    const isMac = process.platform === 'darwin';
    const template = [
        ...(isMac ? [{ role: 'appMenu' }] : []),
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Search',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => mainWindow.webContents.send('menu:new-search'),
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'GitHub Repository',
                    click: () => electron_1.shell.openExternal('https://github.com/your-username/CiteForge'),
                },
                {
                    label: 'Report Issue',
                    click: () => electron_1.shell.openExternal('https://github.com/your-username/CiteForge/issues'),
                },
                { type: 'separator' },
                { label: `CiteForge v${electron_1.app.getVersion()}`, enabled: false },
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}

// electron/ipc/system.ipc.ts — System-level IPC handlers
import { ipcMain, shell, dialog, app } from 'electron'
import path from 'path'

export function registerSystemHandlers() {
  // Open a URL in the system's default browser
  ipcMain.handle('system:openExternal', async (_e, url: string) => {
    if (!url || !url.startsWith('http')) return
    await shell.openExternal(url)
  })

  // Open a folder in the system file explorer
  ipcMain.handle('system:openFolder', async (_e, folderPath: string) => {
    await shell.openPath(folderPath)
  })

  // Show file in its containing folder
  ipcMain.handle('system:showItemInFolder', async (_e, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  // Save file dialog — let user pick destination
  ipcMain.handle('system:saveDialog', async (_e, defaultName: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: path.join(app.getPath('downloads'), defaultName),
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    return result.canceled ? null : result.filePath
  })

  // Folder picker dialog
  ipcMain.handle('system:folderDialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Download Folder',
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // App info
  ipcMain.handle('system:getVersion', () => app.getVersion())
  ipcMain.handle('system:getPlatform', () => process.platform)
  ipcMain.handle('system:getDownloadsPath', () => app.getPath('downloads'))
}

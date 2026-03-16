import { ipcMain, dialog, shell, app } from 'electron'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'
import { getDb } from '../../database/db'
import { BrowserWindow } from 'electron'

export function registerDownloadHandlers() {
  ipcMain.handle('download:start', async (_e, paper: any) => {
    const db = getDb()

    // Ask user where to save
    const win = BrowserWindow.getAllWindows()[0]
    const safeName = paper.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .substring(0, 60)
      .replace(/\s+/g, '_')

    const result = await dialog.showSaveDialog(win, {
      title: 'Save Paper PDF',
      defaultPath: path.join(app.getPath('downloads'), `${safeName}.pdf`),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    })

    if (result.canceled || !result.filePath) return { cancelled: true }

    // Insert download record
    const { lastInsertRowid: downloadId } = db.prepare(`
      INSERT INTO downloads (paper_id, file_path, status) VALUES (?, ?, 'downloading')
    `).run(paper.id, result.filePath)

    // Start download (non-blocking)
    downloadFile(
      paper.pdfUrl,
      result.filePath,
      Number(downloadId),
      win
    ).catch(err => {
      db.prepare(
        "UPDATE downloads SET status='failed', error_msg=? WHERE id=?"
      ).run(err.message, downloadId)
      win.webContents.send('download:progress', {
        downloadId, status: 'failed', error: err.message
      })
    })

    return { downloadId, filePath: result.filePath }
  })

  ipcMain.handle('download:cancel', (_e, downloadId: number) => {
    getDb().prepare(
      "UPDATE downloads SET status='cancelled' WHERE id=?"
    ).run(downloadId)
    return { success: true }
  })

  ipcMain.handle('download:list', () => {
    return getDb().prepare(
      'SELECT * FROM downloads ORDER BY started_at DESC LIMIT 50'
    ).all()
  })
}

export function registerSystemHandlers() {
  ipcMain.handle('system:openExternal', (_e, url: string) => {
    shell.openExternal(url)
  })

  ipcMain.handle('system:showSaveDialog', async (_e, defaultName?: string) => {
    const win = BrowserWindow.getAllWindows()[0]
    return dialog.showSaveDialog(win, {
      defaultPath: path.join(app.getPath('downloads'), defaultName ?? 'paper.pdf'),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    })
  })

  ipcMain.handle('system:showOpenDialog', async () => {
    const win = BrowserWindow.getAllWindows()[0]
    return dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    })
  })

  ipcMain.handle('system:getVersion', () => app.getVersion())
}

function downloadFile(
  url: string,
  dest: string,
  downloadId: number,
  win: BrowserWindow
): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDb()
    const file = fs.createWriteStream(dest)
    const protocol = url.startsWith('https') ? https : http

    const request = protocol.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        return downloadFile(response.headers.location!, dest, downloadId, win)
          .then(resolve).catch(reject)
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlinkSync(dest)
        return reject(new Error(`Server returned ${response.statusCode}`))
      }

      const total = parseInt(response.headers['content-length'] ?? '0', 10)
      let received = 0

      response.on('data', (chunk: Buffer) => {
        received += chunk.length
        const progress = total > 0 ? received / total : 0
        db.prepare('UPDATE downloads SET progress=? WHERE id=?').run(progress, downloadId)
        win.webContents.send('download:progress', { downloadId, progress, status: 'downloading' })
      })

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        db.prepare("UPDATE downloads SET status='done', progress=1.0, completed_at=datetime('now') WHERE id=?")
          .run(downloadId)
        win.webContents.send('download:progress', { downloadId, progress: 1, status: 'done', filePath: dest })
        resolve()
      })
    })

    request.on('error', (err) => {
      file.close()
      try { fs.unlinkSync(dest) } catch {}
      reject(err)
    })
  })
}

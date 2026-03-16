import { ipcMain, dialog, app } from 'electron'
import { BrowserWindow } from 'electron'
import path from 'path'
import { getDb } from '../../database/db'

export function registerDownloadHandlers() {
  ipcMain.handle('download:start', async (_e, paper: any) => {
    const db = getDb()
    const win = BrowserWindow.getAllWindows()[0]

    const safeName = (paper.title ?? 'paper')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .substring(0, 60)
      .replace(/\s+/g, '_')

    const result = await dialog.showSaveDialog(win, {
      title: 'Save Paper PDF',
      defaultPath: path.join(app.getPath('downloads'), `${safeName}.pdf`),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    })

    if (result.canceled || !result.filePath) return { cancelled: true }

    const { filePath } = result

    // Ensure paper exists in DB to satisfy foreign key constraints before creating download record
    db.prepare(`
      INSERT OR IGNORE INTO papers
        (id, title, abstract, year, pub_type, pdf_url, sources, updated_at)
      VALUES
        (@id, @title, @abstract, @year, @pub_type, @pdf_url, @sources, datetime('now'))
    `).run({
      id: paper.id ?? 'unknown',
      title: paper.title ?? 'Unknown Title',
      abstract: paper.abstract ?? '',
      year: paper.year ?? new Date().getFullYear(),
      pub_type: paper.pubType ?? 'unknown',
      pdf_url: paper.pdfUrl ?? '',
      sources: JSON.stringify(paper.sources ?? [])
    })

    const stmt = db.prepare(
      `INSERT INTO downloads (paper_id, file_path, status) VALUES (?, ?, 'downloading')`
    )
    const { lastInsertRowid: downloadId } = stmt.run(paper.id ?? 'unknown', filePath)
    const dlId = Number(downloadId)

    // Setup listener before triggering download
    const onWillDownload = (e: any, item: any, webContents: any) => {
      // Is this our download? We check the URL chain.
      const urls = item.getURLChain()
      if (urls[0] !== paper.pdfUrl) return

      // Disconnect listener once matched so we don't catch other downloads
      win.webContents.session.removeListener('will-download', onWillDownload)

      // Override the save path to what the user picked earlier
      item.setSavePath(filePath)

      item.on('updated', (event: any, state: string) => {
        if (state === 'interrupted') {
          try {
            db.prepare(`UPDATE downloads SET status='failed', error_msg=? WHERE id=?`).run('Interrupted', dlId)
            win.webContents.send('download:progress', { downloadId: dlId, status: 'failed', error: 'Network interrupted' })
          } catch {}
        } else if (state === 'progressing') {
          if (!item.isPaused()) {
            const received = item.getReceivedBytes()
            const total = item.getTotalBytes()
            const progress = total > 0 ? (received / total) : 0.5
            try {
              db.prepare('UPDATE downloads SET progress=? WHERE id=?').run(progress, dlId)
              win.webContents.send('download:progress', { downloadId: dlId, progress, status: 'downloading' })
            } catch {}
          }
        }
      })

      item.once('done', (event: any, state: string) => {
        if (state === 'completed') {
          try {
            db.prepare(`UPDATE downloads SET status='done', progress=1.0, completed_at=datetime('now') WHERE id=?`).run(dlId)
            win.webContents.send('download:progress', { downloadId: dlId, progress: 1, status: 'done', filePath })
          } catch {}
        } else {
          try {
            db.prepare(`UPDATE downloads SET status='failed', error_msg=? WHERE id=?`).run(state, dlId)
            win.webContents.send('download:progress', { downloadId: dlId, status: 'failed', error: state })
          } catch {}
        }
      })
    }

    win.webContents.session.on('will-download', onWillDownload)
    
    // Trigger Chromium download
    win.webContents.downloadURL(paper.pdfUrl)

    // Cleanup listener if download never starts (e.g. invalid URL)
    setTimeout(() => {
      win.webContents.session.removeListener('will-download', onWillDownload)
    }, 15000)

    return { downloadId: dlId, filePath }
  })

  ipcMain.handle('download:cancel', (_e, downloadId: number) => {
    // We cannot easily cancel a Chromium download from this side unless we track the item object.
    // Setting cancelled in DB at least lets the UI know.
    getDb()
      .prepare(`UPDATE downloads SET status='cancelled' WHERE id=?`)
      .run(downloadId)
    return { success: true }
  })

  ipcMain.handle('download:list', () =>
    getDb()
      .prepare('SELECT * FROM downloads ORDER BY started_at DESC LIMIT 50')
      .all()
  )
}

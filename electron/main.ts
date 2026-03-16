import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase } from '../database/db'
import { registerSearchHandlers } from './ipc/search.ipc'
import { registerDownloadHandlers } from './ipc/download.ipc'
import { registerDatabaseHandlers } from './ipc/database.ipc'
import { registerSystemHandlers } from './ipc/system.ipc'

const isDev = process.env.NODE_ENV === 'development'
let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0F1117',
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'undocked' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Open all target="_blank" links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  try {
    await initDatabase()
  } catch (err) {
    console.error('[Main] Database init failed:', err)
  }

  registerSearchHandlers()
  registerDownloadHandlers()
  registerDatabaseHandlers()
  registerSystemHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase()
    app.quit()
  }
})

app.on('before-quit', () => closeDatabase())

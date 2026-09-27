// main/main.js
// Electron main process entry point

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase, closeDb, getDb } from './db/db.js';
import { runMigrations } from './db/migrations/migrationRunner.js';
import { seedInitialData } from './db/seed.js';
import { registerAllIpcHandlers } from './ipc/index.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow() {
  logger.info('Creating main application window...');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0f172a', // Deep slate / dark background
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logger.info('Main window is now visible.');
  });

  // In development, load from Vite dev server. In production, load index.html from dist
  const devUrl = 'http://localhost:5173';
  if (process.env.NODE_ENV !== 'production' && !app.isPackaged) {
    mainWindow.loadURL(devUrl).catch(() => {
      logger.warn(`Failed to connect to dev server at ${devUrl}, waiting...`);
    });
  } else {
    mainWindow.loadFile(path.join(process.cwd(), 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logger.warn('Another instance is already running. Quitting.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    logger.info('App ready. Initializing database and services...');

    try {
      // 1. Initialize SQLite Database
      const db = initDatabase();

      // 2. Run Migrations
      const version = runMigrations(db);

      // 3. Seed if database was freshly initialized
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
      if (userCount.count === 0) {
        seedInitialData(db);
      }

      // 4. Register IPC Handlers
      registerAllIpcHandlers();

      // 5. Create Window
      createWindow();
    } catch (err) {
      logger.error('Fatal initialization error:', err);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      logger.info('All windows closed. Quitting application.');
      app.quit();
    }
  });

  app.on('before-quit', () => {
    logger.info('Application quitting. Cleaning up resources...');
    closeDb();
  });
}

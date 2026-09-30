// main/main.js
// Electron main process entry point

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { autoUpdater } from 'electron-updater';
import { env } from '../config/env.js';
import { initDatabase, closeDb, getDb } from './db/db.js';
import { runMigrations } from './db/migrations/migrationRunner.js';
import { seedInitialData } from './db/seed.js';
import { registerAllIpcHandlers } from './ipc/index.js';
import { logger } from './utils/logger.js';
import { backupService } from './services/backupService.js';
import { healthService } from './services/healthService.js';
import { shiftService } from './services/shiftService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let backupIntervalId = null;

function createWindow() {
  logger.info('Creating main application window...');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#ffffff', // Clean white commercial background
    show: false,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
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
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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

      // 5. Crash safety & startup integrity check
      const integrity = healthService.runIntegrityCheck();
      logger.info(`Startup SQLite integrity check: ${integrity.status}`);

      // 6. Detect and recover stale shifts from previous days
      const recoveredCount = shiftService.forceCloseStaleShifts();
      if (recoveredCount > 0) {
        logger.warn(`Startup recovery: automatically force-closed ${recoveredCount} stale open shift(s).`);
      }

      // 7. Schedule automated rolling 6-hour SQLite backups
      const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
      backupIntervalId = setInterval(() => {
        try {
          backupService.createBackup('scheduled_6h');
        } catch (backupErr) {
          logger.error('Scheduled backup error:', backupErr.message);
        }
      }, SIX_HOURS_MS);

      // 8. Create Window
      createWindow();

      // 9. Check for updates automatically in the background
      if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify().catch(err => {
          logger.error('Auto-updater error:', err.message);
        });
      }

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

  process.on('uncaughtException', (err) => {
    logger.error('FATAL: Uncaught Exception', { error: err.message, stack: err.stack });
    // Optional: could add an app.quit() here depending on fail-safe preferences
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('FATAL: Unhandled Promise Rejection', { reason, promise });
  });

  app.on('before-quit', () => {
    logger.info('Application quitting. Executing graceful shutdown...');
    if (backupIntervalId) {
      clearInterval(backupIntervalId);
    }
    try {
      // Automatic backup before closing
      backupService.createBackup('shutdown');
    } catch (err) {
      logger.warn('Shutdown backup skipped or failed:', err.message);
    }
    closeDb();
  });
}


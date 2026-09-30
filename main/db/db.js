// main/db/db.js
// SQLite database connection singleton with WAL mode and foreign key enforcement

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { logger } from '../utils/logger.js';

let dbInstance = null;

export function getDatabasePath() {
  const dataDir = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'pos.db');
}

export function initDatabase(customPath = null) {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || getDatabasePath();
  const parentDir = path.dirname(dbPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  logger.info(`Opening SQLite database at: ${dbPath}`);

  try {
    dbInstance = new Database(dbPath, {
      // verbose: process.env.NODE_ENV !== 'production' ? (sql) => logger.debug(`SQL: ${sql}`) : null,
    });

    // Enforce WAL mode for resilience against power failures
    const journalMode = dbInstance.pragma('journal_mode = WAL');
    logger.info(`SQLite journal_mode set to: ${journalMode[0]?.journal_mode || 'WAL'}`);

    // Enforce foreign key constraints
    dbInstance.pragma('foreign_keys = ON');

    // Optimize performance and sync behavior
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('busy_timeout = 5000');

    return dbInstance;
  } catch (error) {
    logger.error('Failed to initialize SQLite database', { error: error.message, stack: error.stack });
    throw error;
  }
}

export function getDb() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDb() {
  if (dbInstance) {
    try {
      logger.info('Closing SQLite database connection');
      dbInstance.close();
      dbInstance = null;
    } catch (error) {
      logger.error('Error closing database', { error: error.message });
    }
  }
}

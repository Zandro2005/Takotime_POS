// main/services/settingsService.js
// Business logic for reading and updating application & store configuration settings.

import { getDb } from '../db/db.js';
import { logger } from '../utils/logger.js';

export class SettingsService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
  }

  get db() {
    return this._db || getDb();
  }

  /**
   * Retrieves all key-value settings as a key-value dictionary.
   */
  getAllSettings() {
    const db = this.db;
    const rows = db.prepare('SELECT key, value FROM settings ORDER BY key ASC').all();
    const result = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  }

  /**
   * Retrieves a single setting by key.
   */
  getSetting(key, defaultValue = null) {
    const db = this.db;
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : defaultValue;
  }

  /**
   * Batch updates settings from an object map.
   */
  updateSettings(settingsMap) {
    const db = this.db;
    if (!settingsMap || typeof settingsMap !== 'object') {
      throw new Error('Settings payload must be an object');
    }

    const upsertStmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now', 'localtime'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);

    db.transaction(() => {
      for (const [key, value] of Object.entries(settingsMap)) {
        if (value !== undefined && value !== null) {
          upsertStmt.run(String(key), String(value));
        }
      }
    })();

    logger.info(`Updated settings: ${Object.keys(settingsMap).join(', ')}`);
    return this.getAllSettings();
  }
}

export const settingsService = new SettingsService();

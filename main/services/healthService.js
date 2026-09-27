// main/services/healthService.js
// System diagnostics, SQLite WAL integrity checks, hardware status, and shift recovery

import fs from 'node:fs';
import path from 'node:path';
import { getDb, getDatabasePath } from '../db/db.js';
import { logger } from '../utils/logger.js';
import { backupService } from './backupService.js';
import { shiftService } from './shiftService.js';

export class HealthService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
  }

  get db() {
    return this._db || getDb();
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  runIntegrityCheck() {
    try {
      const check = this.db.pragma('integrity_check');
      const isOk = check && check.length > 0 && check[0].integrity_check === 'ok';
      return {
        ok: isOk,
        status: isOk ? 'PASSED' : 'CORRUPTED',
        details: isOk
          ? 'Database integrity verified. 0 corrupt pages detected.'
          : `Integrity check failed: ${JSON.stringify(check)}`,
        checkedAt: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('Database integrity check error', err);
      return {
        ok: false,
        status: 'ERROR',
        details: err.message,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  getStaleShifts() {
    try {
      return this.db.prepare(`
        SELECT s.*, u.name as staff_name, u.username as staff_username,
               ROUND((strftime('%s', 'now', 'localtime') - strftime('%s', s.opened_at)) / 3600.0, 1) as hours_open
        FROM shifts s
        JOIN users u ON s.staff_id = u.id
        WHERE s.status = 'open'
          AND (date(s.opened_at) < date('now', 'localtime')
               OR (strftime('%s', 'now', 'localtime') - strftime('%s', s.opened_at)) > 57600)
        ORDER BY s.opened_at ASC
      `).all();
    } catch (err) {
      logger.error('Error fetching stale shifts', err);
      return [];
    }
  }

  forceCloseStaleShift(shiftId, notes = 'Auto force-closed during recovery') {
    try {
      const shift = this.db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId);
      if (!shift) throw new Error(`Shift #${shiftId} not found`);

      const cashCalc = shiftService.computeExpectedCash(shiftId);

      this.db.prepare(`
        UPDATE shifts
        SET status = 'force_closed',
            closed_at = datetime('now', 'localtime'),
            ending_cash = ?,
            expected_cash = ?,
            notes = ?
        WHERE id = ?
      `).run(cashCalc.expectedCash, cashCalc.expectedCash, notes, shiftId);

      logger.warn(`Shift #${shiftId} force-closed. Expected cash: ₱${cashCalc.expectedCash}`);

      return {
        success: true,
        shiftId,
        status: 'force_closed',
        expectedCash: cashCalc.expectedCash,
      };
    } catch (err) {
      logger.error(`Failed to force close shift #${shiftId}`, err);
      throw err;
    }
  }

  getSystemStatus() {
    try {
      const integrity = this.runIntegrityCheck();

      // Database file metrics
      let dbPath = 'data/pos.db';
      let dbSize = 0;
      let walSize = 0;
      try {
        dbPath = getDatabasePath();
        if (fs.existsSync(dbPath)) {
          dbSize = fs.statSync(dbPath).size;
        }
        const walPath = `${dbPath}-wal`;
        if (fs.existsSync(walPath)) {
          walSize = fs.statSync(walPath).size;
        }
      } catch (_) {}

      // Table counts
      const counts = {
        orders: (this.db.prepare('SELECT COUNT(*) as count FROM orders').get() || {}).count || 0,
        products: (this.db.prepare('SELECT COUNT(*) as count FROM products').get() || {}).count || 0,
        users: (this.db.prepare('SELECT COUNT(*) as count FROM users').get() || {}).count || 0,
        shifts: (this.db.prepare('SELECT COUNT(*) as count FROM shifts').get() || {}).count || 0,
        inventoryItems: (this.db.prepare('SELECT COUNT(*) as count FROM inventory_items').get() || {}).count || 0,
      };

      // Journal mode
      let journalMode = 'WAL';
      try {
        const jm = this.db.pragma('journal_mode');
        if (jm && jm[0]) journalMode = jm[0].journal_mode;
      } catch (_) {}

      // Backups overview
      const backups = backupService.listBackups();
      const latestBackup = backups[0] || null;

      // Stale shifts
      const staleShifts = this.getStaleShifts();

      // Current active shift
      const activeShift = this.db.prepare(`
        SELECT s.*, u.name as staff_name
        FROM shifts s
        JOIN users u ON s.staff_id = u.id
        WHERE s.status = 'open'
        ORDER BY s.opened_at DESC
        LIMIT 1
      `).get() || null;

      // Unsynced orders count
      let pendingSyncCount = 0;
      try {
        const unsynced = this.db.prepare('SELECT COUNT(*) as c FROM orders WHERE synced_at IS NULL').get();
        pendingSyncCount = unsynced.c;
      } catch (_) {}

      // Process and memory metrics
      const mem = process.memoryUsage();

      return {
        database: {
          path: dbPath,
          sizeBytes: dbSize,
          sizeFormatted: this.formatBytes(dbSize),
          walSizeBytes: walSize,
          walSizeFormatted: this.formatBytes(walSize),
          journalMode: journalMode.toUpperCase(),
          integrity,
          counts,
        },
        backups: {
          totalCount: backups.length,
          latestBackup,
          backupDir: backupService.backupDir,
        },
        shifts: {
          activeShift,
          staleShifts,
        },
        sync: {
          pendingSyncCount,
        },
        system: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            rssFormatted: this.formatBytes(mem.rss),
            heapUsedFormatted: this.formatBytes(mem.heapUsed),
            heapTotalFormatted: this.formatBytes(mem.heapTotal),
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err) {
      logger.error('Error compiling system health status', err);
      throw err;
    }
  }
}

export const healthService = new HealthService();

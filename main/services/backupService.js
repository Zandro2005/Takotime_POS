// main/services/backupService.js
// Automated and manual SQLite backup management with WAL checkpointing and integrity verification

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../db/db.js';
import { logger } from '../utils/logger.js';

export class BackupService {
  constructor(dbInstance = null, options = {}) {
    this._db = dbInstance;
    this.backupDir = options.backupDir || path.join(process.cwd(), 'backups');
    this.retentionDays = options.retentionDays || 30;
    this.ensureBackupDir();
  }

  get db() {
    return this._db || getDb();
  }

  ensureBackupDir() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
    } catch (err) {
      logger.error('Failed to create backups directory', err);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  createBackup(reason = 'manual') {
    this.ensureBackupDir();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0]; // YYYYMMDD_HHmmss

    const sanitizedReason = reason.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `pos_${timestamp}_${sanitizedReason}.db`;
    const targetPath = path.join(this.backupDir, filename);

    try {
      logger.info(`Starting SQLite backup (${reason}) -> ${filename}...`);

      // Flush write-ahead log (WAL) to ensure complete data consistency
      try {
        this.db.pragma('wal_checkpoint(TRUNCATE)');
      } catch (walErr) {
        logger.warn('WAL checkpoint notice:', walErr.message);
      }

      // VACUUM INTO produces an atomic, defragmented snapshot of the live SQLite database
      this.db.prepare('VACUUM INTO ?').run(targetPath);

      // Verify the integrity of the generated backup file
      const integrity = this.verifyBackupIntegrity(targetPath);
      if (!integrity.valid) {
        throw new Error(`Backup file created but failed integrity check: ${integrity.message}`);
      }

      const stats = fs.statSync(targetPath);
      const result = {
        success: true,
        filename,
        filePath: targetPath,
        sizeBytes: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        createdAt: new Date().toISOString(),
        reason,
        integrity: integrity.message,
      };

      logger.info(`Backup completed successfully: ${filename} (${result.sizeFormatted})`);

      // Prune old backups past retention threshold
      const pruneResult = this.pruneOldBackups(this.retentionDays);
      if (pruneResult.prunedCount > 0) {
        logger.info(`Pruned ${pruneResult.prunedCount} old backup(s) older than ${this.retentionDays} days`);
      }

      return result;
    } catch (err) {
      logger.error(`Backup creation failed (${reason})`, err);
      // Clean up corrupt or incomplete file if created
      if (fs.existsSync(targetPath)) {
        try { fs.unlinkSync(targetPath); } catch (_) {}
      }
      throw err;
    }
  }

  pruneOldBackups(retentionDays = 30) {
    this.ensureBackupDir();
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    let prunedCount = 0;

    try {
      const files = fs.readdirSync(this.backupDir);
      for (const file of files) {
        if (!file.endsWith('.db')) continue;
        const filePath = path.join(this.backupDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.mtimeMs < cutoffTime) {
            fs.unlinkSync(filePath);
            prunedCount++;
          }
        } catch (e) {
          logger.warn(`Could not check/delete old backup ${file}`, e.message);
        }
      }

      const remainingFiles = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.db'));
      return { prunedCount, remainingCount: remainingFiles.length };
    } catch (err) {
      logger.error('Error during backup pruning', err);
      return { prunedCount: 0, remainingCount: 0 };
    }
  }

  listBackups() {
    this.ensureBackupDir();
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (!file.endsWith('.db')) continue;
        const filePath = path.join(this.backupDir, file);
        try {
          const stats = fs.statSync(filePath);
          // Parse reason from filename: pos_YYYYMMDD_HHmmss_reason.db
          const parts = file.replace(/\.db$/, '').split('_');
          const reason = parts.length >= 3 ? parts.slice(2).join('_') : 'manual';

          backups.push({
            filename: file,
            filePath,
            sizeBytes: stats.size,
            sizeFormatted: this.formatBytes(stats.size),
            createdAt: stats.mtime.toISOString(),
            reason,
          });
        } catch (_) {}
      }

      // Sort newest first
      return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (err) {
      logger.error('Error listing backups', err);
      return [];
    }
  }

  verifyBackupIntegrity(backupFilePath) {
    if (!fs.existsSync(backupFilePath)) {
      return { valid: false, message: 'File does not exist' };
    }

    let tempDb = null;
    try {
      tempDb = new Database(backupFilePath, { readonly: true, fileMustExist: true });
      const check = tempDb.pragma('integrity_check');
      const isOk = check && check.length > 0 && check[0].integrity_check === 'ok';
      return {
        valid: isOk,
        message: isOk ? 'ok' : (check[0]?.integrity_check || 'integrity check failed'),
      };
    } catch (err) {
      return { valid: false, message: err.message };
    } finally {
      if (tempDb) {
        try { tempDb.close(); } catch (_) {}
      }
    }
  }
}

export const backupService = new BackupService();

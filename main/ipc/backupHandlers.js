// main/ipc/backupHandlers.js
// IPC handlers for SQLite backup creation, history listing, pruning, and integrity checks

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { backupService } from '../services/backupService.js';

export function registerBackupHandlers() {
  registerIpcHandler(IPC_CHANNELS.BACKUP_RUN_NOW, async (payload) => {
    const reason = payload?.reason || 'manual';
    return backupService.createBackup(reason);
  });

  registerIpcHandler(IPC_CHANNELS.BACKUP_LIST, async () => {
    return backupService.listBackups();
  });

  registerIpcHandler(IPC_CHANNELS.BACKUP_STATUS, async () => {
    const backups = backupService.listBackups();
    return {
      totalCount: backups.length,
      latestBackup: backups[0] || null,
      backupDir: backupService.backupDir,
      retentionDays: backupService.retentionDays,
    };
  });

  registerIpcHandler(IPC_CHANNELS.BACKUP_VERIFY, async (payload) => {
    return backupService.verifyBackupIntegrity(payload.filePath);
  });

  registerIpcHandler(IPC_CHANNELS.BACKUP_PRUNE, async (payload) => {
    const days = payload?.retentionDays || 30;
    return backupService.pruneOldBackups(days);
  });
}

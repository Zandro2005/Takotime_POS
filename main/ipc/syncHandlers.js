// main/ipc/syncHandlers.js
// IPC handlers for background cloud synchronization status, manual trigger, and audit logs.

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { syncService } from '../services/syncService.js';

export function registerSyncHandlers() {
  registerIpcHandler(IPC_CHANNELS.SYNC_STATUS, async () => {
    return syncService.getSyncStatus();
  });

  registerIpcHandler(IPC_CHANNELS.SYNC_TRIGGER, async () => {
    return syncService.runSync();
  });

  registerIpcHandler(IPC_CHANNELS.SYNC_LOG, async (payload) => {
    const limit = payload?.limit || 20;
    return syncService.getSyncLogs(limit);
  });
}

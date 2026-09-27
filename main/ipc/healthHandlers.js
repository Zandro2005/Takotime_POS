// main/ipc/healthHandlers.js
// IPC handlers for system health diagnostics, integrity checks, and log inspection

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { healthService } from '../services/healthService.js';
import { logger } from '../utils/logger.js';

export function registerHealthHandlers() {
  registerIpcHandler(IPC_CHANNELS.HEALTH_STATUS, async () => {
    return healthService.getSystemStatus();
  });

  registerIpcHandler(IPC_CHANNELS.HEALTH_CHECK, async () => {
    return healthService.getSystemStatus();
  });

  registerIpcHandler(IPC_CHANNELS.HEALTH_DB_INTEGRITY, async () => {
    return healthService.runIntegrityCheck();
  });

  registerIpcHandler(IPC_CHANNELS.HEALTH_STALE_SHIFTS, async () => {
    return healthService.getStaleShifts();
  });

  registerIpcHandler(IPC_CHANNELS.HEALTH_FORCE_CLOSE, async (payload) => {
    return healthService.forceCloseStaleShift(payload.shiftId, payload.notes);
  });

  registerIpcHandler(IPC_CHANNELS.LOGS_RECENT, async (payload) => {
    const limit = payload?.limit || 100;
    return logger.getRecentLogs(limit);
  });
}

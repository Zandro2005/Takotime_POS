// main/ipc/logHandlers.js
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { logger } from '../utils/logger.js';

export function registerLogHandlers() {
  registerIpcHandler('pos:logs:client', async (payload) => {
    const { level = 'error', message, meta } = payload;
    logger[level] ? logger[level](`[CLIENT] ${message}`, meta) : logger.error(`[CLIENT] ${message}`, meta);
    return true;
  }, null);
}

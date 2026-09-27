// main/ipc/index.js
// Central IPC registration hub

import { registerAuthHandlers } from './authHandlers.js';
import { logger } from '../utils/logger.js';

export function registerAllIpcHandlers() {
  logger.info('Registering IPC handlers...');
  registerAuthHandlers();
  logger.info('All IPC handlers successfully registered.');
}

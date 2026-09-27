// main/ipc/index.js
// Central IPC registration hub

import { registerAuthHandlers } from './authHandlers.js';
import { registerShiftHandlers } from './shiftHandlers.js';
import { registerCashHandlers } from './cashHandlers.js';
import { registerMenuHandlers } from './menuHandlers.js';
import { registerOrderHandlers } from './orderHandlers.js';
import { logger } from '../utils/logger.js';

export function registerAllIpcHandlers() {
  logger.info('Registering IPC handlers...');
  registerAuthHandlers();
  registerShiftHandlers();
  registerCashHandlers();
  registerMenuHandlers();
  registerOrderHandlers();
  logger.info('All IPC handlers successfully registered.');
}

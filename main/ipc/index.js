// main/ipc/index.js
// Central IPC registration hub

import { registerAuthHandlers } from './authHandlers.js';
import { registerShiftHandlers } from './shiftHandlers.js';
import { registerCashHandlers } from './cashHandlers.js';
import { registerMenuHandlers } from './menuHandlers.js';
import { registerMenuAdminHandlers } from './menuAdminHandlers.js';
import { registerRecipeHandlers } from './recipeHandlers.js';
import { registerOrderHandlers } from './orderHandlers.js';
import { registerInventoryHandlers } from './inventoryHandlers.js';
import { registerReportHandlers } from './reportHandlers.js';
import { registerStaffHandlers } from './staffHandlers.js';
import { registerSettingsHandlers } from './settingsHandlers.js';
import { registerDashboardHandlers } from './dashboardHandlers.js';
import { registerSyncHandlers } from './syncHandlers.js';
import { logger } from '../utils/logger.js';

export function registerAllIpcHandlers() {
  logger.info('Registering IPC handlers...');
  registerAuthHandlers();
  registerShiftHandlers();
  registerCashHandlers();
  registerMenuHandlers();
  registerMenuAdminHandlers();
  registerRecipeHandlers();
  registerOrderHandlers();
  registerInventoryHandlers();
  registerReportHandlers();
  registerStaffHandlers();
  registerSettingsHandlers();
  registerDashboardHandlers();
  registerSyncHandlers();
  logger.info('All IPC handlers successfully registered.');
}

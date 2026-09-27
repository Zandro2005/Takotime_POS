// main/ipc/settingsHandlers.js
// IPC handlers for reading and modifying store and system configuration.

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { settingsService } from '../services/settingsService.js';

export function registerSettingsHandlers() {
  registerIpcHandler(IPC_CHANNELS.SETTINGS_GET_ALL, async () => {
    return settingsService.getAllSettings();
  });

  registerIpcHandler(IPC_CHANNELS.SETTINGS_UPDATE, async (payload) => {
    const { settings } = payload || {};
    return settingsService.updateSettings(settings || payload);
  });
}

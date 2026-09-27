// main/ipc/staffHandlers.js
// IPC handlers for staff account management, roles, and credential administration.

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { staffService } from '../services/staffService.js';

export function registerStaffHandlers() {
  registerIpcHandler(IPC_CHANNELS.STAFF_LIST, async () => {
    return staffService.listStaff();
  });

  registerIpcHandler(IPC_CHANNELS.STAFF_CREATE, async (payload) => {
    return staffService.createStaff(payload);
  });

  registerIpcHandler(IPC_CHANNELS.STAFF_UPDATE, async (payload) => {
    if (!payload?.id) throw new Error('Staff id is required');
    return staffService.updateStaff(payload.id, payload);
  });

  registerIpcHandler(IPC_CHANNELS.STAFF_DEACTIVATE, async (payload) => {
    if (!payload?.id) throw new Error('Staff id is required');
    return staffService.deactivateStaff(payload.id);
  });

  registerIpcHandler(IPC_CHANNELS.STAFF_REACTIVATE, async (payload) => {
    if (!payload?.id) throw new Error('Staff id is required');
    return staffService.reactivateStaff(payload.id);
  });

  registerIpcHandler(IPC_CHANNELS.STAFF_RESET_PASSWORD, async (payload) => {
    if (!payload?.id) throw new Error('Staff id is required');
    return staffService.resetPassword(payload.id, payload.password);
  });

  registerIpcHandler(IPC_CHANNELS.STAFF_RESET_PIN, async (payload) => {
    if (!payload?.id) throw new Error('Staff id is required');
    return staffService.resetPin(payload.id, payload.pin);
  });
}

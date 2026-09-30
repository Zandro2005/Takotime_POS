// main/ipc/shiftHandlers.js
// IPC handlers for shift management

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { shiftService } from '../services/shiftService.js';

export function registerShiftHandlers() {
  // Get current open shift (store-wide active shift shared across all terminals & roles)
  registerIpcHandler(IPC_CHANNELS.SHIFTS_CURRENT, async () => {
    return shiftService.getCurrentShift();
  });

  // Open shift
  registerIpcHandler(IPC_CHANNELS.SHIFTS_OPEN, async (payload, { session }) => {
    const staffId = session?.user?.id;
    const startingCash = Number(payload.startingCash) || 0;
    const notes = payload.notes || '';
    return shiftService.openShift(staffId, startingCash, notes);
  });

  // Close shift
  registerIpcHandler(IPC_CHANNELS.SHIFTS_CLOSE, async (payload) => {
    const { shiftId, endingCash, notes } = payload;
    return shiftService.closeShift(shiftId, endingCash, notes);
  });

  // Force close stale shifts
  registerIpcHandler(IPC_CHANNELS.SHIFTS_FORCE_CLOSE, async () => {
    return shiftService.forceCloseStaleShifts();
  });
}

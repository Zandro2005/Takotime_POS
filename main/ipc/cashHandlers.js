// main/ipc/cashHandlers.js
// IPC handlers for cash movements

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { cashService } from '../services/cashService.js';
import { validateCashMovement } from '../../shared/validators.js';

export function registerCashHandlers() {
  // Record movement (cash in, cash out, cash drop)
  registerIpcHandler(IPC_CHANNELS.CASH_RECORD_MOVEMENT, async (payload, { session }) => {
    const val = validateCashMovement(payload);
    if (!val.valid) throw new Error(val.message);

    const userId = session?.user?.id;
    return cashService.recordMovement(payload.shiftId, userId, payload.type, payload.amount, payload.reason);
  });

  // List movements for a shift
  registerIpcHandler(IPC_CHANNELS.CASH_LIST_MOVEMENTS, async (payload) => {
    if (!payload.shiftId) throw new Error('shiftId is required');
    return cashService.getMovementsForShift(payload.shiftId);
  });
}

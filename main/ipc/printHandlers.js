// main/ipc/printHandlers.js
// IPC handlers for thermal printer receipt generation, cash drawer kick, and status

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { printService } from '../services/printService.js';

export function registerPrintHandlers() {
  registerIpcHandler(IPC_CHANNELS.PRINT_RECEIPT, async (payload) => {
    return printService.printReceipt(payload.orderId, payload.options);
  });

  registerIpcHandler(IPC_CHANNELS.PRINT_TEST, async () => {
    return printService.testPrint();
  });

  registerIpcHandler(IPC_CHANNELS.PRINT_DRAWER, async () => {
    return printService.openCashDrawer();
  });

  registerIpcHandler(IPC_CHANNELS.PRINT_STATUS, async () => {
    return printService.getPrinterStatus();
  });
}

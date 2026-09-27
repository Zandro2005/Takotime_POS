// main/ipc/inventoryHandlers.js
// IPC handlers for daily inventory ledger, stock adjustments, and confirmations.

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { inventoryService } from '../services/inventoryService.js';

export function registerInventoryHandlers() {
  // Get full inventory ledger for a date (defaults to today)
  registerIpcHandler(IPC_CHANNELS.INVENTORY_ITEMS, async (payload) => {
    const dateStr = payload?.date || undefined;
    return inventoryService.getItemsForDate(dateStr);
  });

  registerIpcHandler(IPC_CHANNELS.INVENTORY_LOG, async (payload) => {
    const dateStr = payload?.date || undefined;
    return inventoryService.getItemsForDate(dateStr);
  });

  // Record Stock In or adjust beginning qty
  registerIpcHandler(IPC_CHANNELS.INVENTORY_UPDATE_LOG, async (payload, { session }) => {
    if (!payload?.itemId) throw new Error('itemId is required');
    const dateStr = payload.date || undefined;
    const userId = session?.user?.id;

    if (payload.stockIn !== undefined) {
      return inventoryService.recordStockIn(payload.itemId, dateStr, Number(payload.stockIn), userId);
    }
    if (payload.beginningQty !== undefined) {
      return inventoryService.updateBeginningQty(payload.itemId, dateStr, Number(payload.beginningQty), userId);
    }
    throw new Error('Either stockIn or beginningQty must be provided');
  });

  // Confirm actual count out
  registerIpcHandler(IPC_CHANNELS.INVENTORY_CONFIRM, async (payload, { session }) => {
    if (!payload?.itemId) throw new Error('itemId is required');
    if (payload.confirmedQty === undefined || payload.confirmedQty === null) {
      throw new Error('confirmedQty is required');
    }
    const dateStr = payload.date || undefined;
    const userId = session?.user?.id;

    return inventoryService.confirmOut(payload.itemId, dateStr, Number(payload.confirmedQty), userId);
  });

  // Create or update inventory item catalog
  registerIpcHandler(IPC_CHANNELS.INVENTORY_SAVE_ITEM, async (payload) => {
    if (payload.id) {
      return inventoryService.updateInventoryItem(payload.id, payload);
    }
    return inventoryService.createInventoryItem(payload);
  });
}

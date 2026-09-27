// main/ipc/orderHandlers.js
// IPC handlers for order creation, voids, and receipts

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { orderService } from '../services/orderService.js';
import { receiptService } from '../services/receiptService.js';
import { validateOrderPayload } from '../../shared/validators.js';

export function registerOrderHandlers() {
  // Create order atomically
  registerIpcHandler(IPC_CHANNELS.ORDERS_CREATE, async (payload, { session }) => {
    const orderData = {
      ...payload,
      staffId: session?.user?.id,
    };

    const val = validateOrderPayload(orderData);
    if (!val.valid) throw new Error(val.message);

    return orderService.createOrder(orderData);
  });

  // Void order
  registerIpcHandler(IPC_CHANNELS.ORDERS_VOID, async (payload, { session }) => {
    const { orderId, reason } = payload;
    const voidedBy = session?.user?.id;
    return orderService.voidOrder(orderId, voidedBy, reason);
  });

  // Get single order with items
  registerIpcHandler(IPC_CHANNELS.ORDERS_GET, async (payload) => {
    return orderService.getOrder(payload.orderId);
  });

  // Get recent orders for current shift
  registerIpcHandler(IPC_CHANNELS.ORDERS_RECENT, async (payload) => {
    return orderService.getRecentOrders(payload.shiftId, payload.limit || 20);
  });

  // Format / print receipt
  registerIpcHandler(IPC_CHANNELS.PRINT_RECEIPT, async (payload) => {
    return receiptService.formatReceipt(payload.orderId);
  });
}

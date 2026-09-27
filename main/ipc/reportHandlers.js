// main/ipc/reportHandlers.js
// IPC handlers for daily sales, shift summary, product mix, inventory reports, and CSV exports.

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { reportService } from '../services/reportService.js';

export function registerReportHandlers() {
  // Daily Sales Summary
  registerIpcHandler(IPC_CHANNELS.REPORTS_DAILY_SALES, async (payload) => {
    return reportService.getDailySales(payload?.date);
  });

  // Shift Summary
  registerIpcHandler(IPC_CHANNELS.REPORTS_SHIFT_SUMMARY, async (payload) => {
    if (!payload?.shiftId) throw new Error('shiftId is required');
    return reportService.getShiftSummary(payload.shiftId);
  });

  // Product Mix Report
  registerIpcHandler(IPC_CHANNELS.REPORTS_PRODUCT_MIX, async (payload) => {
    return reportService.getProductMixReport(payload?.startDate, payload?.endDate);
  });

  // Inventory & Shrinkage Report
  registerIpcHandler(IPC_CHANNELS.REPORTS_INVENTORY, async (payload) => {
    return reportService.getInventoryReport(payload?.startDate, payload?.endDate);
  });

  registerIpcHandler(IPC_CHANNELS.REPORTS_WASTE, async (payload) => {
    return reportService.getInventoryReport(payload?.startDate, payload?.endDate);
  });

  // Export to CSV string
  registerIpcHandler(IPC_CHANNELS.REPORTS_EXPORT_CSV, async (payload) => {
    if (!payload?.reportType) throw new Error('reportType is required');
    return reportService.exportToCsv(payload.reportType, payload.data);
  });
}

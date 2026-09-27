// main/ipc/dashboardHandlers.js
// IPC handler for real-time overview metrics, shift status, and low-stock alerts.

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { dashboardService } from '../services/dashboardService.js';

export function registerDashboardHandlers() {
  registerIpcHandler(IPC_CHANNELS.DASHBOARD_OVERVIEW, async (payload) => {
    const { date, timeframe } = payload || {};
    return dashboardService.getOverview(date, timeframe);
  });

  registerIpcHandler(IPC_CHANNELS.DASHBOARD_TREND, async (payload) => {
    const { date, timeframe } = payload || {};
    return dashboardService.getSalesTrend(date, timeframe);
  });
}

// main/services/dashboardService.js
// Aggregates real-time store metrics, active shift status, 7-day sales trends, and low-stock alerts.

import { getDb } from '../db/db.js';

function getLocalDateString(d = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class DashboardService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
  }

  get db() {
    return this._db || getDb();
  }

  /**
   * Retrieves complete dashboard overview data.
   */
  getOverview(targetDate = getLocalDateString()) {
    const db = this.db;

    // 1. Today's Live Sales
    const salesRow = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'voided' THEN 1 END) as voided_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN subtotal ELSE 0 END), 0) as gross_sales,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN discount ELSE 0 END), 0) as total_discounts,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) as net_sales,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'gcash' THEN total ELSE 0 END), 0) as gcash_sales
      FROM orders
      WHERE DATE(created_at) = DATE(?)
    `).get(targetDate);

    // 2. Active Shift Status
    const openShift = db.prepare(`
      SELECT 
        s.id,
        s.staff_id,
        s.opened_at,
        s.starting_cash,
        u.name as staff_name,
        u.role as staff_role
      FROM shifts s
      JOIN users u ON u.id = s.staff_id
      WHERE s.status = 'open'
      ORDER BY s.opened_at DESC
      LIMIT 1
    `).get();

    let activeShiftData = null;
    if (openShift) {
      const shiftCashOrders = db.prepare(`
        SELECT COALESCE(SUM(total), 0) as total_cash
        FROM orders
        WHERE shift_id = ? AND status = 'completed' AND payment_method = 'cash'
      `).get(openShift.id).total_cash;

      const movements = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END), 0) as cash_in,
          COALESCE(SUM(CASE WHEN type = 'cash_out' THEN amount ELSE 0 END), 0) as cash_out
        FROM cash_movements
        WHERE shift_id = ?
      `).get(openShift.id);

      const shiftOrderCount = db.prepare(`
        SELECT COUNT(id) as count
        FROM orders
        WHERE shift_id = ? AND status = 'completed'
      `).get(openShift.id).count;

      const expectedDrawerCash = openShift.starting_cash + shiftCashOrders + movements.cash_in - movements.cash_out;

      activeShiftData = {
        shiftId: openShift.id,
        staffName: openShift.staff_name,
        staffRole: openShift.staff_role,
        openedAt: openShift.opened_at,
        startingCash: openShift.starting_cash,
        cashSales: shiftCashOrders,
        cashIn: movements.cash_in,
        cashOut: movements.cash_out,
        expectedDrawerCash,
        orderCount: shiftOrderCount,
      };
    }

    // 3. Low Stock Alerts
    const lowStockAlerts = [];
    const activeItems = db.prepare(`
      SELECT id, name, unit, min_stock 
      FROM inventory_items 
      WHERE active = 1 AND min_stock > 0
      ORDER BY name ASC
    `).all();

    const getLatestItemLog = db.prepare(`
      SELECT beginning_qty, stock_in, suggested_out, confirmed_out, ending_qty
      FROM inventory_logs
      WHERE item_id = ? AND log_date <= ?
      ORDER BY log_date DESC
      LIMIT 1
    `);

    for (const item of activeItems) {
      const log = getLatestItemLog.get(item.id, targetDate);
      let currentStock = 0;
      if (log) {
        if (log.ending_qty !== null && log.ending_qty !== undefined) {
          currentStock = log.ending_qty;
        } else {
          const outQty = log.confirmed_out !== null && log.confirmed_out !== undefined ? log.confirmed_out : log.suggested_out;
          currentStock = (log.beginning_qty || 0) + (log.stock_in || 0) - (outQty || 0);
        }
      }

      if (currentStock <= item.min_stock) {
        lowStockAlerts.push({
          itemId: item.id,
          name: item.name,
          unit: item.unit,
          currentStock: Math.round(currentStock * 100) / 100,
          minStock: item.min_stock,
          severity: currentStock <= 0 ? 'critical' : 'warning',
        });
      }
    }

    // 4. Past 7-Day Trend
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);

      const dayStats = db.prepare(`
        SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as order_count,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) as revenue
        FROM orders
        WHERE DATE(created_at) = DATE(?)
      `).get(dateStr);

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

      salesTrend.push({
        date: dateStr,
        label: dayName,
        revenue: dayStats.revenue,
        orderCount: dayStats.order_count,
      });
    }

    // 5. Top 5 Products Sold Today
    const topProducts = db.prepare(`
      SELECT 
        p.name as product_name,
        pv.label as variant_label,
        SUM(oi.qty) as units_sold,
        SUM(oi.subtotal) as total_revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN product_variants pv ON pv.id = oi.variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE DATE(o.created_at) = DATE(?) AND o.status = 'completed'
      GROUP BY pv.id
      ORDER BY units_sold DESC
      LIMIT 5
    `).all(targetDate);

    return {
      date: targetDate,
      today: {
        completedOrders: salesRow.completed_orders,
        voidedOrders: salesRow.voided_orders,
        grossSales: salesRow.gross_sales,
        discounts: salesRow.total_discounts,
        netSales: salesRow.net_sales,
        cashSales: salesRow.cash_sales,
        gcashSales: salesRow.gcash_sales,
      },
      activeShift: activeShiftData,
      lowStockAlerts,
      salesTrend,
      topProducts,
    };
  }
}

export const dashboardService = new DashboardService();

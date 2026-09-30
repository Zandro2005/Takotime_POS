// main/services/reportService.js
// Business logic for store reports, shift summaries, product mix, and CSV export.

import { getDb } from '../db/db.js';

function getLocalDateString(d = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class ReportService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
  }

  get db() {
    return this._db || getDb();
  }

  /**
   * Daily Sales Report for a specific date (or today).
   */
  getDailySales(dateStr = getLocalDateString()) {
    const db = this.db;

    // 1. Totals
    const totals = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_completed_orders,
        COUNT(CASE WHEN status = 'voided' THEN 1 END) as total_voided_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN subtotal ELSE 0 END), 0) as total_gross,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN discount ELSE 0 END), 0) as total_discounts,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) as total_net,
        COALESCE(SUM(CASE WHEN status = 'voided' THEN subtotal ELSE 0 END), 0) as total_voided_amount,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_total,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method != 'cash' THEN total ELSE 0 END), 0) as gcash_total
      FROM orders
      WHERE DATE(created_at) = DATE(?)
    `).get(dateStr);

    // 2. Top-selling items on this date
    const topItems = db.prepare(`
      SELECT
        p.name as product_name,
        pv.label as variant_label,
        c.name as category_name,
        SUM(oi.qty) as units_sold,
        SUM(oi.subtotal) as total_revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN product_variants pv ON pv.id = oi.variant_id
      JOIN products p ON p.id = pv.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE DATE(o.created_at) = DATE(?) AND o.status = 'completed'
      GROUP BY pv.id
      ORDER BY units_sold DESC
    `).all(dateStr);

    // 3. Hourly order distribution
    const hourly = db.prepare(`
      SELECT
        strftime('%H:00', created_at) as hour,
        COUNT(id) as order_count,
        SUM(total) as revenue
      FROM orders
      WHERE DATE(created_at) = DATE(?) AND status = 'completed'
      GROUP BY hour
      ORDER BY hour ASC
    `).all(dateStr);

    // 4. Shifts active or closed on this date
    const shifts = db.prepare(`
      SELECT
        s.id,
        s.status,
        s.opened_at,
        s.closed_at,
        s.starting_cash,
        s.ending_cash,
        s.expected_cash,
        u.name as staff_name
      FROM shifts s
      JOIN users u ON u.id = s.staff_id
      WHERE DATE(s.opened_at) = DATE(?)
      ORDER BY s.id ASC
    `).all(dateStr);

    return {
      date: dateStr,
      summary: {
        completedOrders: totals.total_completed_orders,
        voidedOrders: totals.total_voided_orders,
        grossSales: totals.total_gross,
        discounts: totals.total_discounts,
        netSales: totals.total_net,
        voidedAmount: totals.total_voided_amount,
        cashSales: totals.cash_total,
        gcashSales: totals.gcash_total,
      },
      topItems,
      hourly,
      shifts,
    };
  }

  /**
   * Comprehensive summary for a specific shift. Defaults to latest/active shift if omitted.
   */
  getShiftSummary(shiftId = null) {
    const db = this.db;

    let targetShiftId = shiftId;
    if (!targetShiftId) {
      const latest = db.prepare(`SELECT id FROM shifts ORDER BY (status = 'open') DESC, id DESC LIMIT 1`).get();
      if (!latest) {
        return null;
      }
      targetShiftId = latest.id;
    }

    const shift = db.prepare(`
      SELECT
        s.*,
        u.name as staff_name,
        u.role as staff_role
      FROM shifts s
      JOIN users u ON u.id = s.staff_id
      WHERE s.id = ?
    `).get(targetShiftId);

    if (!shift) {
      throw new Error(`Shift #${targetShiftId} not found`);
    }

    // Orders for this shift
    const orderStats = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'voided' THEN 1 END) as voided_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN subtotal ELSE 0 END), 0) as gross_sales,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN discount ELSE 0 END), 0) as total_discounts,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) as net_sales,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method != 'cash' THEN total ELSE 0 END), 0) as gcash_sales,
        COALESCE(SUM(CASE WHEN status = 'voided' THEN total ELSE 0 END), 0) as voided_amount
      FROM orders
      WHERE shift_id = ?
    `).get(shiftId);

    // Cash movements for this shift
    const cashMovements = db.prepare(`
      SELECT
        cm.*,
        u.name as created_by_name
      FROM cash_movements cm
      JOIN users u ON u.id = cm.created_by
      WHERE cm.shift_id = ?
      ORDER BY cm.created_at ASC
    `).all(shiftId);

    const cashIn = cashMovements
      .filter(m => m.type === 'cash_in')
      .reduce((sum, m) => sum + m.amount, 0);

    const cashOut = cashMovements
      .filter(m => m.type === 'cash_out')
      .reduce((sum, m) => sum + m.amount, 0);

    const cashDrop = cashMovements
      .filter(m => m.type === 'cash_drop')
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedCash = shift.starting_cash + orderStats.cash_sales + cashIn - cashOut - cashDrop;
    const endingCash = shift.ending_cash;
    const discrepancy = endingCash !== null && endingCash !== undefined ? endingCash - expectedCash : null;

    return {
      shift: {
        id: shift.id,
        status: shift.status,
        staffName: shift.staff_name,
        staffRole: shift.staff_role,
        openedAt: shift.opened_at,
        closedAt: shift.closed_at,
        startingCash: shift.starting_cash,
        endingCash: shift.ending_cash,
        expectedCash: shift.expected_cash || expectedCash,
        discrepancy,
        notes: shift.notes,
      },
      sales: {
        completedOrders: orderStats.completed_orders,
        voidedOrders: orderStats.voided_orders,
        grossSales: orderStats.gross_sales,
        discounts: orderStats.total_discounts,
        netSales: orderStats.net_sales,
        cashSales: orderStats.cash_sales,
        gcashSales: orderStats.gcash_sales,
        voidedAmount: orderStats.voided_amount,
      },
      cashAccounting: {
        startingCash: shift.starting_cash,
        cashSales: orderStats.cash_sales,
        cashIn,
        cashOut,
        cashDrop,
        expectedDrawerCash: expectedCash,
        countedDrawerCash: endingCash,
        discrepancy,
      },
      movements: cashMovements,
    };
  }

  /**
   * Product Mix report across a date range.
   */
  getProductMixReport(startDate = getLocalDateString(), endDate = getLocalDateString()) {
    const db = this.db;

    const items = db.prepare(`
      SELECT
        c.name as category_name,
        p.name as product_name,
        pv.label as variant_label,
        pv.price as unit_price,
        SUM(oi.qty) as units_sold,
        SUM(oi.subtotal) as total_revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN product_variants pv ON pv.id = oi.variant_id
      JOIN products p ON p.id = pv.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE DATE(o.created_at) >= DATE(?) AND DATE(o.created_at) <= DATE(?) AND o.status = 'completed'
      GROUP BY pv.id
      ORDER BY total_revenue DESC
    `).all(startDate, endDate);

    const totalRevenue = items.reduce((sum, item) => sum + item.total_revenue, 0);
    const totalUnits = items.reduce((sum, item) => sum + item.units_sold, 0);

    const enriched = items.map(item => ({
      ...item,
      percentOfRevenue: totalRevenue > 0 ? (item.total_revenue / totalRevenue) * 100 : 0,
      percentOfUnits: totalUnits > 0 ? (item.units_sold / totalUnits) * 100 : 0,
    }));

    return {
      startDate,
      endDate,
      totalRevenue,
      totalUnits,
      items: enriched,
    };
  }

  /**
   * Inventory summary report across a date range with aggregate shrinkage.
   */
  getInventoryReport(startDate = getLocalDateString(), endDate = getLocalDateString()) {
    const db = this.db;

    const rows = db.prepare(`
      SELECT
        i.id as item_id,
        i.name as item_name,
        i.unit,
        COALESCE(SUM(l.stock_in), 0) as total_stock_in,
        COALESCE(SUM(l.suggested_out), 0) as total_suggested_out,
        COALESCE(SUM(l.confirmed_out), 0) as total_confirmed_out,
        COALESCE(SUM(l.waste_qty), 0) as total_waste_qty
      FROM inventory_items i
      LEFT JOIN inventory_logs l ON l.item_id = i.id AND DATE(l.log_date) >= DATE(?) AND DATE(l.log_date) <= DATE(?)
      WHERE i.active = 1
      GROUP BY i.id
      ORDER BY i.id ASC
    `).all(startDate, endDate);

    return {
      startDate,
      endDate,
      items: rows,
    };
  }

  /**
   * Converts report datasets to RFC-4180 CSV strings.
   */
  exportToCsv(reportType, data) {
    if (!data) return '';

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let headers = [];
    let rows = [];

    if (reportType === 'daily_sales') {
      headers = ['Product', 'Variant', 'Category', 'Units Sold', 'Revenue (PHP)'];
      rows = (data.topItems || []).map(it => [
        escapeCsv(it.product_name),
        escapeCsv(it.variant_label),
        escapeCsv(it.category_name),
        escapeCsv(it.units_sold),
        escapeCsv(it.total_revenue.toFixed(2)),
      ]);
    } else if (reportType === 'product_mix') {
      headers = ['Category', 'Product', 'Variant', 'Unit Price', 'Units Sold', 'Total Revenue', '% Revenue', '% Units'];
      rows = (data.items || []).map(it => [
        escapeCsv(it.category_name),
        escapeCsv(it.product_name),
        escapeCsv(it.variant_label),
        escapeCsv(it.unit_price.toFixed(2)),
        escapeCsv(it.units_sold),
        escapeCsv(it.total_revenue.toFixed(2)),
        escapeCsv(it.percentOfRevenue.toFixed(1) + '%'),
        escapeCsv(it.percentOfUnits.toFixed(1) + '%'),
      ]);
    } else if (reportType === 'inventory') {
      headers = ['Item ID', 'Item Name', 'Unit', 'Total Stock In', 'Suggested Out', 'Confirmed Out', 'Net Waste / Shrinkage'];
      rows = (data.items || []).map(it => [
        escapeCsv(it.item_id),
        escapeCsv(it.item_name),
        escapeCsv(it.unit),
        escapeCsv(it.total_stock_in),
        escapeCsv(it.total_suggested_out.toFixed(2)),
        escapeCsv(it.total_confirmed_out.toFixed(2)),
        escapeCsv(it.total_waste_qty.toFixed(2)),
      ]);
    } else if (reportType === 'shift_summary') {
      headers = ['Metric', 'Value'];
      rows = [
        ['Shift ID', escapeCsv(data.shift?.id)],
        ['Staff Name', escapeCsv(data.shift?.staffName)],
        ['Opened At', escapeCsv(data.shift?.openedAt)],
        ['Closed At', escapeCsv(data.shift?.closedAt || 'In Progress')],
        ['Starting Cash', escapeCsv(data.cashAccounting?.startingCash?.toFixed(2))],
        ['Cash Sales', escapeCsv(data.cashAccounting?.cashSales?.toFixed(2))],
        ['Cash In', escapeCsv(data.cashAccounting?.cashIn?.toFixed(2))],
        ['Cash Out', escapeCsv(data.cashAccounting?.cashOut?.toFixed(2))],
        ['Expected Drawer Cash', escapeCsv(data.cashAccounting?.expectedDrawerCash?.toFixed(2))],
        ['Counted Drawer Cash', escapeCsv(data.cashAccounting?.countedDrawerCash !== null ? data.cashAccounting?.countedDrawerCash?.toFixed(2) : 'Not Closed')],
        ['Cash Discrepancy', escapeCsv(data.cashAccounting?.discrepancy !== null ? data.cashAccounting?.discrepancy?.toFixed(2) : 'N/A')],
        ['Total Net Sales', escapeCsv(data.sales?.netSales?.toFixed(2))],
        ['GCash Sales', escapeCsv(data.sales?.gcashSales?.toFixed(2))],
        ['Completed Orders', escapeCsv(data.sales?.completedOrders)],
        ['Voided Orders', escapeCsv(data.sales?.voidedOrders)],
      ];
    }

    const csvLines = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ];

    return csvLines.join('\r\n');
  }

  /**
   * Materializes shift sales summary into daily_sales_summary table.
   */
  materializeDailySalesSummary(shiftId, summaryDate = getLocalDateString()) {
    const db = this.db;

    const stats = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_orders,
        COUNT(CASE WHEN status = 'voided' THEN 1 END) as total_voided,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN subtotal ELSE 0 END), 0) as total_gross,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN discount ELSE 0 END), 0) as total_discounts,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) as total_net,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_total,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method != 'cash' THEN total ELSE 0 END), 0) as gcash_total
      FROM orders
      WHERE shift_id = ?
    `).get(shiftId);

    const stmt = db.prepare(`
      INSERT INTO daily_sales_summary (
        shift_id, summary_date, total_orders, total_gross, total_discounts, total_net,
        total_voided, cash_total, gcash_total, computed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `);

    const info = stmt.run(
      shiftId,
      summaryDate,
      stats.total_orders,
      stats.total_gross,
      stats.total_discounts,
      stats.total_net,
      stats.total_voided,
      stats.cash_total,
      stats.gcash_total
    );

    return info.lastInsertRowid;
  }
}

export const reportService = new ReportService();

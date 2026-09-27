// main/services/inventoryService.js
// Business logic for daily inventory ledger, stock in, suggested out, confirmed counts, and shrinkage tracking.

import { getDb } from '../db/db.js';

/**
 * Returns YYYY-MM-DD formatted string in local time.
 */
function getLocalDateString(d = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class InventoryService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
  }

  get db() {
    return this._db || getDb();
  }

  /**
   * Initializes the inventory log for all active items on a specific date.
   * Carries forward previous day's ending_qty as today's beginning_qty.
   */
  initializeDayLog(dateStr = getLocalDateString()) {
    const db = this.db;

    return db.transaction(() => {
      const activeItems = db.prepare(`
        SELECT id, name, unit, min_stock
        FROM inventory_items
        WHERE active = 1
        ORDER BY id ASC
      `).all();

      const checkExisting = db.prepare(`
        SELECT id FROM inventory_logs WHERE item_id = ? AND log_date = ?
      `);

      const getPreviousEnding = db.prepare(`
        SELECT ending_qty, beginning_qty, stock_in, confirmed_out, suggested_out
        FROM inventory_logs
        WHERE item_id = ? AND log_date < ?
        ORDER BY log_date DESC
        LIMIT 1
      `);

      const insertLog = db.prepare(`
        INSERT INTO inventory_logs (
          item_id, log_date, beginning_qty, stock_in, suggested_out, confirmed_out, ending_qty
        ) VALUES (?, ?, ?, 0, 0, NULL, NULL)
      `);

      for (const item of activeItems) {
        const existing = checkExisting.get(item.id, dateStr);
        if (!existing) {
          // Carry forward
          const prev = getPreviousEnding.get(item.id, dateStr);
          let initialBeginning = 0;
          if (prev) {
            if (prev.ending_qty !== null && prev.ending_qty !== undefined) {
              initialBeginning = prev.ending_qty;
            } else if (prev.confirmed_out !== null && prev.confirmed_out !== undefined) {
              initialBeginning = prev.beginning_qty + prev.stock_in - prev.confirmed_out;
            } else {
              initialBeginning = Math.max(0, prev.beginning_qty + prev.stock_in - prev.suggested_out);
            }
          }

          insertLog.run(item.id, dateStr, initialBeginning);
        }
      }

      return true;
    })();
  }

  /**
   * Recomputes suggested_out for all items on a given date based on:
   * SUM(order_items.qty * recipes.qty_per_unit) for completed orders.
   */
  computeSuggestedOut(dateStr = getLocalDateString()) {
    const db = this.db;

    const query = db.prepare(`
      SELECT
        r.inventory_item_id as item_id,
        COALESCE(SUM(oi.qty * r.qty_per_unit), 0) as suggested_out
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN recipes r ON r.product_variant_id = oi.variant_id
      WHERE DATE(o.created_at) = DATE(?) AND o.status = 'completed'
      GROUP BY r.inventory_item_id
    `);

    const results = query.all(dateStr);
    const resultMap = new Map(results.map(r => [r.item_id, r.suggested_out]));

    const updateSuggested = db.prepare(`
      UPDATE inventory_logs
      SET suggested_out = ?,
          updated_at = datetime('now', 'localtime')
      WHERE item_id = ? AND log_date = ?
    `);

    // Fetch all logs for date
    const dateLogs = db.prepare(`SELECT item_id FROM inventory_logs WHERE log_date = ?`).all(dateStr);

    db.transaction(() => {
      for (const row of dateLogs) {
        const suggested = resultMap.get(row.item_id) || 0;
        updateSuggested.run(suggested, row.item_id, dateStr);
      }
    })();

    return resultMap;
  }

  /**
   * Gets inventory ledger items for a date, initializing and updating suggested out.
   */
  getItemsForDate(dateStr = getLocalDateString()) {
    const db = this.db;

    // 1. Ensure log rows exist for all items
    this.initializeDayLog(dateStr);

    // 2. Recompute suggested_out from orders
    this.computeSuggestedOut(dateStr);

    // 3. Return full ledger list
    const stmt = db.prepare(`
      SELECT
        l.id as log_id,
        i.id as item_id,
        i.name as item_name,
        i.unit,
        i.min_stock,
        l.log_date,
        l.beginning_qty,
        l.stock_in,
        l.suggested_out,
        l.confirmed_out,
        l.ending_qty,
        l.waste_qty,
        l.prepared_by,
        prep.name as prepared_by_name,
        l.checked_by,
        chk.name as checked_by_name,
        l.updated_at
      FROM inventory_logs l
      JOIN inventory_items i ON i.id = l.item_id
      LEFT JOIN users prep ON prep.id = l.prepared_by
      LEFT JOIN users chk ON chk.id = l.checked_by
      WHERE l.log_date = ? AND i.active = 1
      ORDER BY i.id ASC
    `);

    return stmt.all(dateStr).map(row => ({
      logId: row.log_id,
      itemId: row.item_id,
      name: row.item_name,
      unit: row.unit,
      minStock: row.min_stock,
      logDate: row.log_date,
      beginningQty: row.beginning_qty,
      stockIn: row.stock_in,
      suggestedOut: row.suggested_out,
      confirmedOut: row.confirmed_out,
      endingQty: row.ending_qty !== null ? row.ending_qty : (row.beginning_qty + row.stock_in - row.suggested_out),
      isConfirmed: row.confirmed_out !== null,
      wasteQty: row.waste_qty,
      preparedBy: row.prepared_by,
      preparedByName: row.prepared_by_name,
      checkedBy: row.checked_by,
      checkedByName: row.checked_by_name,
      isLowStock: (row.ending_qty !== null ? row.ending_qty : (row.beginning_qty + row.stock_in - row.suggested_out)) <= row.min_stock,
    }));
  }

  /**
   * Records stock in (delivery / restock) for an item on a date.
   */
  recordStockIn(itemId, dateStr = getLocalDateString(), qty, userId = null) {
    if (typeof qty !== 'number' || isNaN(qty) || qty <= 0) {
      throw new Error('Stock in quantity must be a positive number');
    }

    const db = this.db;
    this.initializeDayLog(dateStr);

    return db.transaction(() => {
      const current = db.prepare(`
        SELECT beginning_qty, stock_in, confirmed_out
        FROM inventory_logs
        WHERE item_id = ? AND log_date = ?
      `).get(itemId, dateStr);

      if (!current) {
        throw new Error(`Inventory log not found for item ${itemId} on ${dateStr}`);
      }

      const newStockIn = current.stock_in + qty;
      let newEnding = null;
      if (current.confirmed_out !== null) {
        newEnding = current.beginning_qty + newStockIn - current.confirmed_out;
      }

      db.prepare(`
        UPDATE inventory_logs
        SET stock_in = ?,
            ending_qty = ?,
            prepared_by = COALESCE(?, prepared_by),
            updated_at = datetime('now', 'localtime')
        WHERE item_id = ? AND log_date = ?
      `).run(newStockIn, newEnding, userId, itemId, dateStr);

      return {
        itemId,
        logDate: dateStr,
        stockIn: newStockIn,
        endingQty: newEnding,
      };
    })();
  }

  /**
   * Confirms actual count out at end-of-day / closing count.
   * Computes ending_qty and generates waste_qty shrinkage signal.
   */
  confirmOut(itemId, dateStr = getLocalDateString(), confirmedQty, checkedByUserId = null) {
    if (typeof confirmedQty !== 'number' || isNaN(confirmedQty) || confirmedQty < 0) {
      throw new Error('Confirmed out quantity must be zero or a positive number');
    }

    const db = this.db;
    this.initializeDayLog(dateStr);
    this.computeSuggestedOut(dateStr);

    return db.transaction(() => {
      const current = db.prepare(`
        SELECT beginning_qty, stock_in, suggested_out
        FROM inventory_logs
        WHERE item_id = ? AND log_date = ?
      `).get(itemId, dateStr);

      if (!current) {
        throw new Error(`Inventory log not found for item ${itemId} on ${dateStr}`);
      }

      const endingQty = current.beginning_qty + current.stock_in - confirmedQty;

      db.prepare(`
        UPDATE inventory_logs
        SET confirmed_out = ?,
            ending_qty = ?,
            checked_by = ?,
            updated_at = datetime('now', 'localtime')
        WHERE item_id = ? AND log_date = ?
      `).run(confirmedQty, endingQty, checkedByUserId, itemId, dateStr);

      const updated = db.prepare(`
        SELECT item_id, log_date, beginning_qty, stock_in, suggested_out, confirmed_out, ending_qty, waste_qty
        FROM inventory_logs
        WHERE item_id = ? AND log_date = ?
      `).get(itemId, dateStr);

      return updated;
    })();
  }

  /**
   * Allows adjusting beginning quantity for the day (e.g. morning count correction).
   */
  updateBeginningQty(itemId, dateStr = getLocalDateString(), newBeginningQty, userId = null) {
    if (typeof newBeginningQty !== 'number' || isNaN(newBeginningQty) || newBeginningQty < 0) {
      throw new Error('Beginning quantity must be zero or positive');
    }

    const db = this.db;
    this.initializeDayLog(dateStr);

    return db.transaction(() => {
      const current = db.prepare(`
        SELECT stock_in, confirmed_out
        FROM inventory_logs
        WHERE item_id = ? AND log_date = ?
      `).get(itemId, dateStr);

      let newEnding = null;
      if (current.confirmed_out !== null) {
        newEnding = newBeginningQty + current.stock_in - current.confirmed_out;
      }

      db.prepare(`
        UPDATE inventory_logs
        SET beginning_qty = ?,
            ending_qty = ?,
            prepared_by = COALESCE(?, prepared_by),
            updated_at = datetime('now', 'localtime')
        WHERE item_id = ? AND log_date = ?
      `).run(newBeginningQty, newEnding, userId, itemId, dateStr);

      return true;
    })();
  }

  /**
   * Adds a new inventory item.
   */
  createInventoryItem({ name, unit, minStock = 0 }) {
    if (!name || !unit) {
      throw new Error('Item name and unit are required');
    }

    const db = this.db;
    const stmt = db.prepare(`
      INSERT INTO inventory_items (name, unit, min_stock, active)
      VALUES (?, ?, ?, 1)
    `);
    const info = stmt.run(name.trim(), unit.trim(), Number(minStock) || 0);
    return {
      id: info.lastInsertRowid,
      name: name.trim(),
      unit: unit.trim(),
      minStock: Number(minStock) || 0,
      active: 1,
    };
  }

  /**
   * Updates an existing inventory item.
   */
  updateInventoryItem(id, { name, unit, minStock, active }) {
    const db = this.db;
    const current = db.prepare(`SELECT * FROM inventory_items WHERE id = ?`).get(id);
    if (!current) {
      throw new Error(`Inventory item #${id} not found`);
    }

    const newName = name !== undefined ? name.trim() : current.name;
    const newUnit = unit !== undefined ? unit.trim() : current.unit;
    const newMinStock = minStock !== undefined ? Number(minStock) : current.min_stock;
    const newActive = active !== undefined ? (active ? 1 : 0) : current.active;

    db.prepare(`
      UPDATE inventory_items
      SET name = ?, unit = ?, min_stock = ?, active = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(newName, newUnit, newMinStock, newActive, id);

    return {
      id,
      name: newName,
      unit: newUnit,
      minStock: newMinStock,
      active: newActive,
    };
  }
}

export const inventoryService = new InventoryService();

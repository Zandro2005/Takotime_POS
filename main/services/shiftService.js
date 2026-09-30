// main/services/shiftService.js
// Shift lifecycle and queue number management

import { getDb } from '../db/db.js';
import { logger } from '../utils/logger.js';
import { SHIFT_STATUS, PAYMENT_METHODS } from '../../shared/constants.js';
import { backupService } from './backupService.js';

export class ShiftService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
  }

  get db() {
    return this._db || getDb();
  }

  /**
   * Automatically consolidates any duplicate open shifts into a single primary store shift.
   * This guarantees that if multiple staff or terminals opened shifts concurrently, all orders,
   * queue counters, and cash drawer movements are unified under the active store shift.
   */
  reconcileOpenShifts() {
    const db = this.db;
    try {
      const openShifts = db.prepare(`
        SELECT * FROM shifts WHERE status = 'open' ORDER BY id ASC
      `).all();

      if (!openShifts || openShifts.length <= 1) return;

      // Select primary shift: the established shift with the most orders or starting cash
      const orderCounts = new Map();
      for (const s of openShifts) {
        const cnt = db.prepare('SELECT COUNT(*) as c FROM orders WHERE shift_id = ?').get(s.id).c;
        orderCounts.set(s.id, cnt);
      }

      openShifts.sort((a, b) => {
        const cntA = orderCounts.get(a.id) || 0;
        const cntB = orderCounts.get(b.id) || 0;
        if (cntB !== cntA) return cntB - cntA; // Most orders first
        if ((b.starting_cash || 0) !== (a.starting_cash || 0)) return (b.starting_cash || 0) - (a.starting_cash || 0);
        return a.id - b.id; // Earliest opened first
      });

      const primaryShift = openShifts[0];

      for (const shift of openShifts) {
        if (shift.id === primaryShift.id) continue;

        // Move any orphan orders from this duplicate shift to the primary store shift
        const orphanOrders = db.prepare(`SELECT id, queue_no FROM orders WHERE shift_id = ? ORDER BY id ASC`).all(shift.id);
        for (const ord of orphanOrders) {
          primaryShift.last_queue_no += 1;
          db.prepare(`
            UPDATE orders
            SET shift_id = ?, queue_no = ?
            WHERE id = ?
          `).run(primaryShift.id, primaryShift.last_queue_no, ord.id);
        }

        // Move any cash movements
        db.prepare(`UPDATE cash_movements SET shift_id = ? WHERE shift_id = ?`).run(primaryShift.id, shift.id);

        // Close the duplicate shift cleanly
        db.prepare(`
          UPDATE shifts
          SET status = 'closed',
              closed_at = datetime('now', 'localtime'),
              notes = COALESCE(notes || ' ', '') || ' [Auto-consolidated into Store Shift #' || ? || ']'
          WHERE id = ?
        `).run(primaryShift.id, shift.id);

        logger.info(`Consolidated duplicate open shift #${shift.id} into primary shift #${primaryShift.id}`);
      }

      // Update primary shift last_queue_no in database
      db.prepare(`UPDATE shifts SET last_queue_no = ? WHERE id = ?`).run(primaryShift.last_queue_no, primaryShift.id);
    } catch (err) {
      logger.warn('Failed to reconcile open shifts:', err.message);
    }
  }

  getCurrentShift(staffId = null) {
    const db = this.db;
    this.reconcileOpenShifts();

    // Store shift: All terminals and operators share the store's active shift
    return db.prepare(`
      SELECT s.*, u.name as staff_name, u.username as staff_username
      FROM shifts s
      JOIN users u ON s.staff_id = u.id
      WHERE s.status = 'open'
      ORDER BY s.opened_at DESC
      LIMIT 1
    `).get() || null;
  }

  openShift(staffId, startingCash = 0, notes = '') {
    const db = this.db;
    this.reconcileOpenShifts();

    // Check if there is already an open shift in the store
    const existing = this.getCurrentShift();
    if (existing) {
      logger.warn(`Shift #${existing.id} is already open for store. Returning existing shift.`);
      return existing;
    }

    const info = db.prepare(`
      INSERT INTO shifts (staff_id, status, opened_at, starting_cash, last_queue_no, notes)
      VALUES (?, 'open', datetime('now', 'localtime'), ?, 0, ?)
    `).run(staffId, Number(startingCash) || 0, notes || null);

    logger.info(`Opened new shift #${info.lastInsertRowid} for staff ID ${staffId} with starting cash ₱${startingCash}`);

    return db.prepare(`
      SELECT s.*, u.name as staff_name, u.username as staff_username
      FROM shifts s
      JOIN users u ON s.staff_id = u.id
      WHERE s.id = ?
    `).get(info.lastInsertRowid);
  }

  computeExpectedCash(shiftId) {
    const db = this.db;
    const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId);
    if (!shift) throw new Error(`Shift #${shiftId} not found`);

    // Sum of completed cash sales
    const salesRow = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as cash_sales
      FROM orders
      WHERE shift_id = ? AND status = 'completed' AND payment_method = 'cash'
    `).get(shiftId);

    // Sum of completed cashless / paper QR sales (GCash, Maya, MariBank, etc.)
    const cashlessRow = db.prepare(`
      SELECT
        COALESCE(SUM(total), 0) as cashless_sales,
        COALESCE(SUM(change_due), 0) as cashless_change_given
      FROM orders
      WHERE shift_id = ? AND status = 'completed' AND payment_method != 'cash'
    `).get(shiftId);

    // Sum of cash movements (cash_in adds, cash_out / cash_drop subtracts)
    const movements = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END), 0) as total_cash_in,
        COALESCE(SUM(CASE WHEN type IN ('cash_out', 'cash_drop') THEN amount ELSE 0 END), 0) as total_cash_out
      FROM cash_movements
      WHERE shift_id = ?
    `).get(shiftId);

    const startingCash = shift.starting_cash || 0;
    const cashSales = salesRow.cash_sales || 0;
    const cashlessSales = cashlessRow.cashless_sales || 0;
    const cashlessChangeGiven = cashlessRow.cashless_change_given || 0;
    const totalCashIn = movements.total_cash_in || 0;
    const totalCashOut = movements.total_cash_out || 0;

    // Expected cash in drawer = starting float + cash sales - any cash change given for cashless overpayments + cash in - cash out
    const expectedCash = startingCash + cashSales - cashlessChangeGiven + totalCashIn - totalCashOut;

    return {
      shiftId,
      startingCash,
      cashSales,
      cashlessSales,
      cashlessChangeGiven,
      gcashSales: cashlessSales,
      totalCashIn,
      totalCashOut,
      expectedCash,
    };
  }

  closeShift(shiftId, endingCash, notes = '') {
    const db = this.db;
    const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId);
    if (!shift) throw new Error(`Shift #${shiftId} not found`);
    if (shift.status !== 'open') throw new Error(`Shift #${shiftId} is already ${shift.status}`);

    const cashCalc = this.computeExpectedCash(shiftId);
    const parsedEndingCash = Number(endingCash) || 0;

    db.prepare(`
      UPDATE shifts
      SET status = 'closed',
          closed_at = datetime('now', 'localtime'),
          ending_cash = ?,
          expected_cash = ?,
          notes = CASE WHEN ? != '' THEN ? ELSE notes END
      WHERE id = ?
    `).run(parsedEndingCash, cashCalc.expectedCash, notes, notes, shiftId);

    logger.info(`Closed shift #${shiftId}. Expected cash: ₱${cashCalc.expectedCash}, Counted ending cash: ₱${parsedEndingCash}`);

    // Automated rolling backup upon shift close
    try {
      backupService.createBackup('shift_close');
    } catch (bErr) {
      logger.warn('Automated shift_close backup warning:', bErr.message);
    }

    return {
      ...db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId),
      breakdown: cashCalc,
      discrepancy: parsedEndingCash - cashCalc.expectedCash,
    };
  }

  getNextQueueNo(shiftId) {
    const db = this.db;
    // Atomic queue number increment
    const update = db.prepare(`
      UPDATE shifts
      SET last_queue_no = last_queue_no + 1
      WHERE id = ?
    `).run(shiftId);

    if (update.changes === 0) {
      throw new Error(`Shift #${shiftId} not found to increment queue number`);
    }

    const row = db.prepare('SELECT last_queue_no FROM shifts WHERE id = ?').get(shiftId);
    return row.last_queue_no;
  }

  forceCloseStaleShifts() {
    const db = this.db;
    const staleShifts = db.prepare(`
      SELECT id FROM shifts
      WHERE status = 'open' AND date(opened_at) < date('now', 'localtime')
    `).all();

    for (const s of staleShifts) {
      logger.warn(`Force-closing stale shift #${s.id} from previous day`);
      const cashCalc = this.computeExpectedCash(s.id);
      db.prepare(`
        UPDATE shifts
        SET status = 'force_closed',
            closed_at = datetime('now', 'localtime'),
            expected_cash = ?,
            notes = 'System auto force-closed on startup recovery'
        WHERE id = ?
      `).run(cashCalc.expectedCash, s.id);
    }
    return staleShifts.length;
  }
}

export const shiftService = new ShiftService();

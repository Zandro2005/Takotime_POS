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

  getCurrentShift(staffId = null) {
    const db = this.db;
    if (staffId) {
      return db.prepare(`
        SELECT s.*, u.name as staff_name, u.username as staff_username
        FROM shifts s
        JOIN users u ON s.staff_id = u.id
        WHERE s.staff_id = ? AND s.status = 'open'
        ORDER BY s.opened_at DESC
        LIMIT 1
      `).get(staffId) || null;
    }

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

    // Check if there is already an open shift for this staff or store
    const existing = this.getCurrentShift(staffId);
    if (existing) {
      logger.warn(`Staff ${staffId} attempted to open shift, but shift #${existing.id} is already open.`);
      return existing;
    }

    const info = db.prepare(`
      INSERT INTO shifts (staff_id, status, opened_at, starting_cash, last_queue_no, notes)
      VALUES (?, 'open', datetime('now', 'localtime'), ?, 0, ?)
    `).run(staffId, Number(startingCash) || 0, notes || null);

    logger.info(`Opened new shift #${info.lastInsertRowid} for staff ID ${staffId} with starting cash ₱${startingCash}`);

    return db.prepare('SELECT * FROM shifts WHERE id = ?').get(info.lastInsertRowid);
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
    const totalCashIn = movements.total_cash_in || 0;
    const totalCashOut = movements.total_cash_out || 0;

    const expectedCash = startingCash + cashSales + totalCashIn - totalCashOut;

    return {
      shiftId,
      startingCash,
      cashSales,
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

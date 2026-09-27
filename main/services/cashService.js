// main/services/cashService.js
// Cash drawer tracking (cash in, cash out / petty cash, cash drop)

import { getDb } from '../db/db.js';
import { logger } from '../utils/logger.js';
import { CASH_MOVEMENT_TYPES } from '../../shared/constants.js';

export class CashService {
  recordMovement(shiftId, userId, type, amount, reason = '') {
    const db = getDb();

    if (!Object.values(CASH_MOVEMENT_TYPES).includes(type)) {
      throw new Error(`Invalid cash movement type: ${type}`);
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Cash amount must be greater than zero');
    }

    const info = db.prepare(`
      INSERT INTO cash_movements (shift_id, type, amount, reason, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(shiftId, type, numericAmount, reason || null, userId);

    logger.info(`Recorded cash movement #${info.lastInsertRowid} (${type}: ₱${numericAmount}) for shift #${shiftId}`);

    return db.prepare(`
      SELECT cm.*, u.name as created_by_name
      FROM cash_movements cm
      JOIN users u ON cm.created_by = u.id
      WHERE cm.id = ?
    `).get(info.lastInsertRowid);
  }

  getMovementsForShift(shiftId) {
    const db = getDb();
    return db.prepare(`
      SELECT cm.*, u.name as created_by_name
      FROM cash_movements cm
      JOIN users u ON cm.created_by = u.id
      WHERE cm.shift_id = ?
      ORDER BY cm.created_at DESC
    `).all(shiftId);
  }
}

export const cashService = new CashService();

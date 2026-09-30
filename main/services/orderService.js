// main/services/orderService.js
// Order processing engine with atomic transactions, price verification, and audit logging

import { getDb } from '../db/db.js';
import { logger } from '../utils/logger.js';
import { ShiftService, shiftService } from './shiftService.js';
import { ORDER_STATUS, PAYMENT_METHODS, ORDER_TYPES, DISCOUNT_TYPES } from '../../shared/constants.js';

export class OrderService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
  }

  get db() {
    return this._db || getDb();
  }

  createOrder(payload) {
    const db = this.db;
    const {
      shiftId,
      staffId,
      orderType = ORDER_TYPES.DINE_IN,
      paymentMethod = PAYMENT_METHODS.CASH,
      gcashRefNo = null,
      amountTendered = null,
      discountType = null,
      discountReason = null,
      items = [],
    } = payload;

    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Verify shift is open
    const shift = db.prepare('SELECT id, status FROM shifts WHERE id = ?').get(shiftId);
    if (!shift || shift.status !== 'open') {
      throw new Error(`Shift #${shiftId} is not open for new orders`);
    }

    // Run order creation atomically
    const createTransaction = db.transaction(() => {
      // 1. Get next queue number for this shift
      const queueNo = new ShiftService(db).getNextQueueNo(shiftId);

      // 2. Fetch prices from database and calculate subtotals (never trust client amounts directly)
      let calculatedSubtotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const variant = db.prepare(`
          SELECT pv.id, pv.product_id, pv.label, pv.price, p.name as product_name
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          WHERE pv.id = ? AND pv.active = 1
        `).get(item.variantId);

        if (!variant) {
          throw new Error(`Product variant #${item.variantId} not found or inactive`);
        }

        const qty = Math.max(1, parseInt(item.qty, 10) || 1);
        let modifierDeltaSum = 0;
        const verifiedModifiers = [];

        if (Array.isArray(item.modifierIds) && item.modifierIds.length > 0) {
          for (const modId of item.modifierIds) {
            const mod = db.prepare('SELECT id, name, price_delta FROM modifiers WHERE id = ? AND active = 1').get(modId);
            if (mod) {
              modifierDeltaSum += mod.price_delta;
              verifiedModifiers.push(mod);
            }
          }
        }

        const itemUnitPrice = variant.price;
        const itemLineTotal = (itemUnitPrice + modifierDeltaSum) * qty;
        calculatedSubtotal += itemLineTotal;

        verifiedItems.push({
          variantId: variant.id,
          productName: variant.product_name,
          variantLabel: variant.label,
          qty,
          unitPrice: itemUnitPrice,
          subtotal: itemLineTotal,
          modifiers: verifiedModifiers,
        });
      }

      // 3. Compute discount
      let calculatedDiscount = 0;
      if (discountType === DISCOUNT_TYPES.SENIOR || discountType === DISCOUNT_TYPES.PWD) {
        // Standard 20% discount
        calculatedDiscount = Math.round(calculatedSubtotal * 0.20 * 100) / 100;
      } else if (payload.discountAmount) {
        calculatedDiscount = Math.min(calculatedSubtotal, Number(payload.discountAmount) || 0);
      }

      const total = Math.max(0, calculatedSubtotal - calculatedDiscount);

      // 4. Validate payment
      let changeDue = 0;
      let finalAmountTendered = amountTendered;
      let finalGcashRefNo = null;

      if (paymentMethod === PAYMENT_METHODS.CASH) {
        finalAmountTendered = Number(amountTendered);
        if (isNaN(finalAmountTendered) || finalAmountTendered < total) {
          throw new Error(`Amount tendered (₱${finalAmountTendered}) is less than order total (₱${total})`);
        }
        changeDue = finalAmountTendered - total;
      } else if (paymentMethod === PAYMENT_METHODS.CASHLESS || paymentMethod === PAYMENT_METHODS.GCASH) {
        finalAmountTendered = (amountTendered !== undefined && amountTendered !== null) ? Number(amountTendered) : total;
        if (isNaN(finalAmountTendered) || finalAmountTendered < total) {
          throw new Error(`Amount transferred (₱${finalAmountTendered}) is less than order total (₱${total})`);
        }
        changeDue = finalAmountTendered - total;
        // Reference number or last 4 digits (optional for general cashless / QR counter flow)
        finalGcashRefNo = gcashRefNo?.trim() || null;
      }

      // 5. Insert into orders table
      const insertOrder = db.prepare(`
        INSERT INTO orders (
          shift_id, staff_id, order_type, queue_no,
          subtotal, discount, discount_type, discount_reason,
          total, payment_method, gcash_ref_no, amount_tendered, change_due,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now', 'localtime'))
      `);

      const orderInfo = insertOrder.run(
        shiftId,
        staffId,
        orderType,
        queueNo,
        calculatedSubtotal,
        calculatedDiscount,
        discountType || null,
        discountReason || null,
        total,
        paymentMethod,
        finalGcashRefNo,
        finalAmountTendered,
        changeDue
      );

      const orderId = orderInfo.lastInsertRowid;

      // 6. Insert order items & modifiers
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, variant_id, qty, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertItemMod = db.prepare(`
        INSERT INTO order_item_modifiers (order_item_id, modifier_id, price_delta)
        VALUES (?, ?, ?)
      `);

      for (const vi of verifiedItems) {
        const itemInfo = insertItem.run(orderId, vi.variantId, vi.qty, vi.unitPrice, vi.subtotal);
        const orderItemId = itemInfo.lastInsertRowid;

        for (const mod of vi.modifiers) {
          insertItemMod.run(orderItemId, mod.id, mod.price_delta);
        }
      }

      logger.info(`Order #${orderId} created (Queue #${queueNo}, Total ₱${total}, Method: ${paymentMethod})`);

      return {
        id: orderId,
        queueNo,
        orderType,
        subtotal: calculatedSubtotal,
        discount: calculatedDiscount,
        discountType,
        total,
        paymentMethod,
        gcashRefNo: finalGcashRefNo,
        amountTendered: finalAmountTendered,
        changeDue,
        items: verifiedItems,
      };
    });

    return createTransaction();
  }

  voidOrder(orderId, voidedByUserId, reason = '') {
    const db = this.db;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) throw new Error(`Order #${orderId} not found`);
    if (order.status === ORDER_STATUS.VOIDED) throw new Error(`Order #${orderId} is already voided`);

    if (!reason?.trim()) {
      throw new Error('A reason is required to void an order');
    }

    db.prepare(`
      UPDATE orders
      SET status = 'voided',
          voided_at = datetime('now', 'localtime'),
          void_reason = ?,
          voided_by = ?
      WHERE id = ?
    `).run(reason.trim(), voidedByUserId, orderId);

    logger.warn(`Order #${orderId} was VOIDED by User #${voidedByUserId}. Reason: ${reason}`);

    return { success: true, orderId, voidedAt: new Date().toISOString() };
  }

  getOrder(orderId) {
    const db = this.db;
    const order = db.prepare(`
      SELECT o.*, u.name as staff_name, s.opened_at as shift_opened_at
      FROM orders o
      JOIN users u ON o.staff_id = u.id
      JOIN shifts s ON o.shift_id = s.id
      WHERE o.id = ?
    `).get(orderId);

    if (!order) return null;

    const items = db.prepare(`
      SELECT oi.*, pv.label as variant_label, p.name as product_name
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId);

    for (const it of items) {
      it.modifiers = db.prepare(`
        SELECT oim.*, m.name
        FROM order_item_modifiers oim
        JOIN modifiers m ON oim.modifier_id = m.id
        WHERE oim.order_item_id = ?
      `).all(it.id);
    }

    return {
      ...order,
      items,
    };
  }

  getRecentOrders(shiftId, limit = 20) {
    const db = this.db;
    const orders = db.prepare(`
      SELECT o.*, u.name as staff_name
      FROM orders o
      JOIN users u ON o.staff_id = u.id
      WHERE o.shift_id = ?
      ORDER BY o.created_at DESC
      LIMIT ?
    `).all(shiftId, limit);

    return orders.map(ord => this.getOrder(ord.id));
  }
}

export const orderService = new OrderService();

// tests/unit/crossRoleShift.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ShiftService } from '../../main/services/shiftService.js';
import { OrderService } from '../../main/services/orderService.js';
import { ReportService } from '../../main/services/reportService.js';
import { initDatabase, closeDb } from '../../main/db/db.js';
import { runMigrations } from '../../main/db/migrations/migrationRunner.js';
import { seedInitialData } from '../../main/db/seed.js';

test('Cross-Role Store Shift & Sequential Queue Sharing', async (t) => {
  const testDbPath = path.join(process.cwd(), 'data', 'test-cross-role.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const db = initDatabase(testDbPath);
  runMigrations(db);
  seedInitialData(db);

  const shiftService = new ShiftService(db);
  const orderService = new OrderService(db);
  const reportService = new ReportService(db);

  // Seeded users:
  // Admin: id 1
  // Lead Staff / Supervisor: id 2
  // Cashier: id 3
  const cashierId = 3;
  const leadStaffId = 2;
  const adminId = 1;

  let storeShift = null;

  await t.test('1. Cashier opens store shift with ₱1,000 float', () => {
    storeShift = shiftService.openShift(cashierId, 1000, 'Morning stall opening');
    assert.ok(storeShift.id);
    assert.equal(storeShift.status, 'open');
    assert.equal(storeShift.last_queue_no, 0);
  });

  await t.test('2. Cashier rings up Orders #1, #2, #3', () => {
    const o1 = orderService.createOrder({
      shiftId: storeShift.id,
      staffId: cashierId,
      items: [{ variantId: 1, qty: 1 }],
      amountTendered: 50,
    });
    assert.equal(o1.queueNo, 1);
    assert.equal(o1.id, 1);

    const o2 = orderService.createOrder({
      shiftId: storeShift.id,
      staffId: cashierId,
      items: [{ variantId: 1, qty: 2 }],
      amountTendered: 100,
    });
    assert.equal(o2.queueNo, 2);

    const o3 = orderService.createOrder({
      shiftId: storeShift.id,
      staffId: cashierId,
      items: [{ variantId: 2, qty: 1 }],
      amountTendered: 100,
    });
    assert.equal(o3.queueNo, 3);
  });

  await t.test('3. Lead Staff switches into POS: getCurrentShift returns active store shift', () => {
    const currentForLead = shiftService.getCurrentShift(leadStaffId);
    assert.ok(currentForLead);
    assert.equal(currentForLead.id, storeShift.id);
    assert.equal(currentForLead.last_queue_no, 3);
  });

  await t.test('4. Lead Staff attempts openShift: returns existing store shift without duplicate', () => {
    const attemptedShift = shiftService.openShift(leadStaffId, 500, 'Duplicate try');
    assert.equal(attemptedShift.id, storeShift.id);

    // Verify only 1 open shift exists
    const openCount = db.prepare(`SELECT COUNT(*) as c FROM shifts WHERE status = 'open'`).get().c;
    assert.equal(openCount, 1);
  });

  await t.test('5. Lead Staff takes an order: queue number increments to #4 (does not reset to 1)', () => {
    const o4 = orderService.createOrder({
      shiftId: storeShift.id,
      staffId: leadStaffId,
      items: [{ variantId: 4, qty: 1 }], // 4pcs Crab & Cheese
      amountTendered: 50,
    });
    assert.equal(o4.queueNo, 4, 'Order from lead staff must be Queue #4, not #1');
    assert.equal(orderService.getOrder(o4.id).staff_id, leadStaffId);
  });

  await t.test('6. Admin takes an order: queue number increments to #5', () => {
    const currentForAdmin = shiftService.getCurrentShift(adminId);
    assert.equal(currentForAdmin.id, storeShift.id);

    const o5 = orderService.createOrder({
      shiftId: storeShift.id,
      staffId: adminId,
      items: [{ variantId: 7, qty: 1 }], // 4pcs Pork Siomai
      amountTendered: 40,
    });
    assert.equal(o5.queueNo, 5, 'Order from admin must be Queue #5');
  });

  await t.test('7. Cashier takes next order: queue number increments to #6', () => {
    const o6 = orderService.createOrder({
      shiftId: storeShift.id,
      staffId: cashierId,
      items: [{ variantId: 11, qty: 1 }], // Green Tea
      amountTendered: 35,
    });
    assert.equal(o6.queueNo, 6);
  });

  await t.test('8. Recent Orders modal shows all 6 orders across all staff members in latest-first order', () => {
    const recent = orderService.getRecentOrders(storeShift.id, 20);
    assert.equal(recent.length, 6);

    // Sorted descending by created_at, id (Order 6 first down to Order 1)
    assert.equal(recent[0].queue_no, 6);
    assert.equal(recent[0].staff_id, cashierId);

    assert.equal(recent[1].queue_no, 5);
    assert.equal(recent[1].staff_id, adminId);

    assert.equal(recent[2].queue_no, 4);
    assert.equal(recent[2].staff_id, leadStaffId);

    assert.equal(recent[3].queue_no, 3);
    assert.equal(recent[4].queue_no, 2);
    assert.equal(recent[5].queue_no, 1);
  });

  await t.test('9. Shift summary accurately reflects all orders taken by all roles', () => {
    const summary = reportService.getShiftSummary(storeShift.id);
    assert.ok(summary);
    assert.equal(summary.sales.completedOrders, 6);
    assert.equal(summary.shift.id, storeShift.id);
  });

  await t.test('10. reconcileOpenShifts cleanly merges any split/orphaned shifts into primary', () => {
    // Intentionally create a split shift to test recovery
    const rogue = db.prepare(`
      INSERT INTO shifts (staff_id, status, opened_at, starting_cash, last_queue_no)
      VALUES (2, 'open', datetime('now', 'localtime'), 0, 1)
    `).run();
    const rogueId = rogue.lastInsertRowid;

    // Attach a rogue order
    db.prepare(`
      INSERT INTO orders (shift_id, staff_id, order_type, payment_method, queue_no, subtotal, total, status, created_at)
      VALUES (?, 2, 'dine_in', 'cash', 1, 50, 50, 'completed', datetime('now', 'localtime'))
    `).run(rogueId);

    // Call reconcileOpenShifts
    shiftService.reconcileOpenShifts();

    // Verify rogue shift is closed
    const rogueShift = db.prepare(`SELECT * FROM shifts WHERE id = ?`).get(rogueId);
    assert.equal(rogueShift.status, 'closed');

    // Verify primary shift absorbed the order and incremented queue number
    const primary = shiftService.getCurrentShift();
    assert.equal(primary.id, storeShift.id);
    assert.equal(primary.last_queue_no, 7);
  });

  t.after(() => {
    closeDb();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });
});

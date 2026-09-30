// tests/unit/orderFlow.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { initDatabase, closeDb } from '../../main/db/db.js';
import { runMigrations } from '../../main/db/migrations/migrationRunner.js';
import { seedInitialData } from '../../main/db/seed.js';
import { shiftService } from '../../main/services/shiftService.js';
import { menuService } from '../../main/services/menuService.js';
import { orderService } from '../../main/services/orderService.js';
import { cashService } from '../../main/services/cashService.js';
import { receiptService } from '../../main/services/receiptService.js';
import { authService } from '../../main/services/authService.js';
import { ORDER_TYPES, PAYMENT_METHODS, DISCOUNT_TYPES, CASH_MOVEMENT_TYPES, ORDER_STATUS } from '../../shared/constants.js';

test('Phase 2 Full Order Flow, Shifts, and Cash Reconciliation', async (t) => {
  const testDbPath = path.join(process.cwd(), 'data', 'test-orders.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const db = initDatabase(testDbPath);
  runMigrations(db);
  seedInitialData(db);

  // Authenticate cashier to get staffId
  const staffSession = authService.loginWithPin('1111');
  const staffId = staffSession.user.id;
  let activeShift = null;

  await t.test('1. Open shift with starting cash ₱1,000', () => {
    activeShift = shiftService.openShift(staffId, 1000, 'Morning shift opening');
    assert.ok(activeShift.id);
    assert.equal(activeShift.status, 'open');
    assert.equal(activeShift.starting_cash, 1000);
    assert.equal(activeShift.last_queue_no, 0);
  });

  await t.test('2. Menu catalog query retrieves categories, products, and modifiers', () => {
    const catalog = menuService.getFullCatalog();
    assert.equal(catalog.length >= 3, true);

    const takoyakiCat = catalog.find(c => c.name === 'Takoyaki');
    assert.ok(takoyakiCat);
    assert.ok(takoyakiCat.products.length > 0);

    const firstProduct = takoyakiCat.products[0];
    assert.ok(firstProduct.variants.length >= 3); // 4pcs, 8pcs, 12pcs
    assert.ok(firstProduct.modifiers.length > 0);
  });

  let firstOrder = null;
  await t.test('3. Create cash order: 1x 8pcs Octopus Takoyaki + Extra Bonito Flakes', () => {
    // Variant 2 is 8pcs Octopus (₱85.00), Modifier 3 is Extra Bonito (+₱10.00) => Total ₱95.00
    firstOrder = orderService.createOrder({
      shiftId: activeShift.id,
      staffId,
      orderType: ORDER_TYPES.DINE_IN,
      paymentMethod: PAYMENT_METHODS.CASH,
      amountTendered: 100, // Customer gives ₱100
      items: [
        {
          variantId: 2,
          qty: 1,
          modifierIds: [3],
        },
      ],
    });

    assert.equal(firstOrder.queueNo, 1);
    assert.equal(firstOrder.subtotal, 95);
    assert.equal(firstOrder.total, 95);
    assert.equal(firstOrder.amountTendered, 100);
    assert.equal(firstOrder.changeDue, 5); // ₱5 change
  });

  await t.test('4. Create second order with Senior/PWD 20% discount', () => {
    // Variant 8 is 8pcs Pork Siomai (₱75.00) with 20% discount (₱15.00) => Total ₱60.00
    const secondOrder = orderService.createOrder({
      shiftId: activeShift.id,
      staffId,
      orderType: ORDER_TYPES.TAKEOUT,
      paymentMethod: PAYMENT_METHODS.CASH,
      amountTendered: 100,
      discountType: DISCOUNT_TYPES.SENIOR,
      discountReason: 'OSCA ID #123456',
      items: [
        {
          variantId: 8,
          qty: 1,
        },
      ],
    });

    assert.equal(secondOrder.queueNo, 2);
    assert.equal(secondOrder.subtotal, 75);
    assert.equal(secondOrder.discount, 15);
    assert.equal(secondOrder.total, 60);
    assert.equal(secondOrder.changeDue, 40);
  });

  await t.test('5. Create GCash order with reference number and optional ref no', () => {
    // Drink variant 11 (Green Tea 16oz: ₱35.00) with full ref number
    const gcashOrder = orderService.createOrder({
      shiftId: activeShift.id,
      staffId,
      orderType: ORDER_TYPES.TAKEOUT,
      paymentMethod: PAYMENT_METHODS.GCASH,
      gcashRefNo: 'GCASH-99887766',
      items: [
        {
          variantId: 11,
          qty: 1,
        },
      ],
    });

    assert.equal(gcashOrder.queueNo, 3);
    assert.equal(gcashOrder.total, 35);
    assert.equal(gcashOrder.paymentMethod, PAYMENT_METHODS.GCASH);
    assert.equal(gcashOrder.gcashRefNo, 'GCASH-99887766');

    // 5b. Create GCash order with only last 4 digits (quick verification)
    const quickGcashOrder = orderService.createOrder({
      shiftId: activeShift.id,
      staffId,
      orderType: ORDER_TYPES.DINE_IN,
      paymentMethod: PAYMENT_METHODS.GCASH,
      gcashRefNo: '4821',
      items: [
        {
          variantId: 11,
          qty: 1,
        },
      ],
    });
    assert.equal(quickGcashOrder.gcashRefNo, '4821');

    // 5c. Create GCash order without ref number (rush hour paper QR)
    const blankGcashOrder = orderService.createOrder({
      shiftId: activeShift.id,
      staffId,
      orderType: ORDER_TYPES.TAKEOUT,
      paymentMethod: PAYMENT_METHODS.GCASH,
      items: [
        {
          variantId: 11,
          qty: 1,
        },
      ],
    });
    assert.equal(blankGcashOrder.paymentMethod, PAYMENT_METHODS.GCASH);
    assert.equal(blankGcashOrder.gcashRefNo, null);

    // 5d. Create general Cashless order (e.g. Maya, MariBank, SeaBank QRPH)
    const cashlessOrder = orderService.createOrder({
      shiftId: activeShift.id,
      staffId,
      orderType: ORDER_TYPES.DINE_IN,
      paymentMethod: PAYMENT_METHODS.CASHLESS,
      gcashRefNo: 'MAYA-998877',
      items: [
        {
          variantId: 11,
          qty: 1,
        },
      ],
    });
    assert.equal(cashlessOrder.paymentMethod, PAYMENT_METHODS.CASHLESS);
    assert.equal(cashlessOrder.gcashRefNo, 'MAYA-998877');

    // 5e. Create cashless order with cash change (transfers ₱50 for ₱35 order, ₱15 change)
    const changeCashlessOrder = orderService.createOrder({
      shiftId: activeShift.id,
      staffId,
      orderType: ORDER_TYPES.TAKEOUT,
      paymentMethod: PAYMENT_METHODS.CASHLESS,
      amountTendered: 50,
      gcashRefNo: 'MARI-1234',
      items: [
        {
          variantId: 11,
          qty: 1,
        },
      ],
    });
    assert.equal(changeCashlessOrder.total, 35);
    assert.equal(changeCashlessOrder.amountTendered, 50);
    assert.equal(changeCashlessOrder.changeDue, 15);
  });

  await t.test('6. Receipt formatted correctly with queue number and monospace layout', () => {
    const receipt = receiptService.formatReceipt(firstOrder.id);
    assert.ok(receipt.formattedText.includes('QUEUE #: 001'));
    assert.ok(receipt.formattedText.includes('Classic Octopus Takoyaki'));
    assert.ok(receipt.formattedText.includes('Extra Bonito Flakes'));
    assert.ok(receipt.formattedText.includes('Change Due:'));

    // Test cashless receipt with change due
    const cashlessChangeReceipt = receiptService.formatReceipt(7);
    assert.ok(cashlessChangeReceipt.formattedText.includes('CASHLESS (QR)'));
    assert.ok(cashlessChangeReceipt.formattedText.includes('Transferred:'));
    assert.ok(cashlessChangeReceipt.formattedText.includes('Change Due:'));
    assert.ok(cashlessChangeReceipt.formattedText.includes('15.00'));
  });

  await t.test('7. Cash drawer movement: petty cash out ₱150 for ice', () => {
    const movement = cashService.recordMovement(
      activeShift.id,
      staffId,
      CASH_MOVEMENT_TYPES.CASH_OUT,
      150,
      'Bought 3 bags of tube ice'
    );
    assert.ok(movement.id);
    assert.equal(movement.amount, 150);
  });

  await t.test('8. Expected cash computation reconciles properly with Cashless breakdown', () => {
    // Starting cash: ₱1,000
    // Order 1 (cash): +₱95
    // Order 2 (cash): +₱60
    // Orders 3-6 (cashless exact): 4x ₱35
    // Order 7 (cashless with change): ₱35 total, customer transferred ₱50, handed ₱15 cash change
    // Cash movement out: -₱150
    // Expected Cash in Drawer = 1000 + 95 + 60 - 15 (cashless change) - 150 = ₱990.00
    const calc = shiftService.computeExpectedCash(activeShift.id);
    assert.equal(calc.startingCash, 1000);
    assert.equal(calc.cashSales, 155);
    assert.equal(calc.cashlessSales, 175); // 5x ₱35 cashless orders
    assert.equal(calc.cashlessChangeGiven, 15); // ₱15 handed out as change
    assert.equal(calc.totalCashOut, 150);
    assert.equal(calc.expectedCash, 990);
  });

  await t.test('9. Void order with audit reason', () => {
    // Void first order
    const voidRes = orderService.voidOrder(firstOrder.id, staffId, 'Customer cancelled order');
    assert.equal(voidRes.success, true);

    const voided = orderService.getOrder(firstOrder.id);
    assert.equal(voided.status, ORDER_STATUS.VOIDED);
    assert.equal(voided.void_reason, 'Customer cancelled order');
    assert.equal(voided.voided_by, staffId);
  });

  await t.test('10. Close shift with cash reconciliation', () => {
    // Cash sales now: ₱60 (since order 1 was voided)
    // Expected cash: 1000 + 60 - 15 (cashless change) - 150 = ₱895.00
    // Staff counts ₱895 in cash drawer
    const closed = shiftService.closeShift(activeShift.id, 895, 'Shift closed smoothly');
    assert.equal(closed.status, 'closed');
    assert.equal(closed.ending_cash, 895);
    assert.equal(closed.expected_cash, 895);
    assert.equal(closed.discrepancy, 0); // ₱0 discrepancy!
  });

  closeDb();
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch {}
  }
});

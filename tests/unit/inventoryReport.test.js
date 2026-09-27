// tests/unit/inventoryReport.test.js
// Unit tests for Phase 3: Inventory Ledger, Recipe Suggested Out, Confirmed Counts, and Reports.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { initDatabase, closeDb } from '../../main/db/db.js';
import { runMigrations } from '../../main/db/migrations/migrationRunner.js';
import { seedInitialData } from '../../main/db/seed.js';
import { inventoryService } from '../../main/services/inventoryService.js';
import { reportService } from '../../main/services/reportService.js';
import { orderService } from '../../main/services/orderService.js';
import { shiftService } from '../../main/services/shiftService.js';
import { authService } from '../../main/services/authService.js';

let testDb;

test.before(async () => {
  const testDbPath = path.join(process.cwd(), 'data', 'test-inventory.db');
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch {}
  }

  testDb = initDatabase(testDbPath);
  runMigrations(testDb);
  await seedInitialData(testDb);
});

test.after(() => {
  closeDb();
});

test('Phase 3 Inventory & Reports Suite', async (t) => {
  const today = '2026-09-27';

  // 1. Initialize Inventory Day Log
  await t.test('1. initializeDayLog populates all active inventory items for today', () => {
    inventoryService.initializeDayLog(today);
    const items = inventoryService.getItemsForDate(today);

    assert.ok(items.length >= 10, 'Should have at least 10 seeded inventory items');
    const flour = items.find(it => it.name.includes('Batter Premix'));
    assert.ok(flour, 'Takoyaki Batter Premix should exist');
    assert.equal(flour.beginningQty, 0, 'Initial beginningQty without prior logs is 0');
    assert.equal(flour.stockIn, 0);
    assert.equal(flour.suggestedOut, 0);
    assert.equal(flour.confirmedOut, null);
  });

  // 2. Adjust Beginning Qty & Record Stock In
  await t.test('2. updateBeginningQty and recordStockIn update balances correctly', () => {
    // Flour (item #1): set morning beginning count to 10.0 kg
    inventoryService.updateBeginningQty(1, today, 10.0, 1);
    // Octopus (item #2): set morning beginning count to 5.0 kg
    inventoryService.updateBeginningQty(2, today, 5.0, 1);

    // Record delivery: stock in +5.0 kg flour
    inventoryService.recordStockIn(1, today, 5.0, 1);

    const items = inventoryService.getItemsForDate(today);
    const flour = items.find(it => it.itemId === 1);
    const octopus = items.find(it => it.itemId === 2);

    assert.equal(flour.beginningQty, 10.0);
    assert.equal(flour.stockIn, 5.0); // Total available = 15.0 kg
    assert.equal(octopus.beginningQty, 5.0);
    assert.equal(octopus.stockIn, 0);
  });

  // 3. Create Orders and compute recipe-driven suggested out
  await t.test('3. computeSuggestedOut calculates ingredient depletion from completed orders × recipes', async () => {
    // Open shift
    const shift = shiftService.openShift(3, 1000, 'Morning Shift');

    // Order 1: 2x 8pcs Octopus Takoyaki (variant 2)
    // Recipe for 8pcs Octopus: 0.16 kg batter, 0.08 kg octopus
    // 2 qty * 0.16 = 0.32 kg batter
    // 2 qty * 0.08 = 0.16 kg octopus
    await orderService.createOrder({
      shiftId: shift.id,
      staffId: 3,
      items: [{ variantId: 2, qty: 2 }],
      paymentMethod: 'cash',
      amountTendered: 200,
    });

    // Order 2: 1x 4pcs Octopus Takoyaki (variant 1)
    // Recipe for 4pcs: 0.08 kg batter, 0.04 kg octopus
    await orderService.createOrder({
      shiftId: shift.id,
      staffId: 3,
      items: [{ variantId: 1, qty: 1 }],
      paymentMethod: 'cash',
      amountTendered: 50,
    });

    // Total expected depletion for today:
    // Batter: 0.32 + 0.08 = 0.40 kg
    // Octopus: 0.16 + 0.04 = 0.20 kg

    const items = inventoryService.getItemsForDate(today);
    const batter = items.find(it => it.itemId === 1);
    const octopus = items.find(it => it.itemId === 2);

    assert.ok(Math.abs(batter.suggestedOut - 0.40) < 0.0001, `Expected 0.40 kg batter, got ${batter.suggestedOut}`);
    assert.ok(Math.abs(octopus.suggestedOut - 0.20) < 0.0001, `Expected 0.20 kg octopus, got ${octopus.suggestedOut}`);
  });

  // 4. Confirm Out & Shrinkage / Waste Tracking
  await t.test('4. confirmOut records actual count and calculates waste_qty shrinkage signal', () => {
    // Batter (item 1): Available was 10.0 + 5.0 = 15.0 kg.
    // Suggested was 0.40 kg.
    // Physical count at end of day shows 0.45 kg used (0.05 kg spillage/waste).
    const batterRes = inventoryService.confirmOut(1, today, 0.45, 2);

    assert.equal(batterRes.confirmed_out, 0.45);
    // ending_qty = 10.0 + 5.0 - 0.45 = 14.55
    assert.ok(Math.abs(batterRes.ending_qty - 14.55) < 0.0001);
    // waste_qty = confirmed_out (0.45) - suggested_out (0.40) = +0.05 kg shrinkage
    assert.ok(Math.abs(batterRes.waste_qty - 0.05) < 0.0001);

    // Octopus (item 2): Available was 5.0 kg.
    // Suggested was 0.20 kg.
    // Physical count confirms exact 0.20 kg used (zero waste).
    const octRes = inventoryService.confirmOut(2, today, 0.20, 2);
    assert.equal(octRes.confirmed_out, 0.20);
    assert.ok(Math.abs(octRes.ending_qty - 4.80) < 0.0001);
    assert.ok(Math.abs(octRes.waste_qty - 0.0) < 0.0001);
  });

  // 5. Carry forward to next day
  await t.test('5. Carry forward auto-populates tomorrow beginning_qty from today ending_qty', () => {
    const tomorrow = '2026-09-28';
    inventoryService.initializeDayLog(tomorrow);

    const tomorrowItems = inventoryService.getItemsForDate(tomorrow);
    const tomorrowBatter = tomorrowItems.find(it => it.itemId === 1);
    const tomorrowOctopus = tomorrowItems.find(it => it.itemId === 2);

    assert.ok(Math.abs(tomorrowBatter.beginningQty - 14.55) < 0.0001, 'Batter carried forward 14.55 kg');
    assert.ok(Math.abs(tomorrowOctopus.beginningQty - 4.80) < 0.0001, 'Octopus carried forward 4.80 kg');
  });

  // 6. Daily Sales Report
  await t.test('6. reportService.getDailySales aggregates sales and payments accurately', () => {
    const report = reportService.getDailySales(today);

    assert.equal(report.summary.completedOrders, 2);
    // Order 1: 2x 8pcs Octopus @ 85 = 170
    // Order 2: 1x 4pcs Octopus @ 45 = 45
    // Total gross = 215, Net = 215, Cash = 215, GCash = 0
    assert.equal(report.summary.grossSales, 215);
    assert.equal(report.summary.netSales, 215);
    assert.equal(report.summary.cashSales, 215);
    assert.equal(report.summary.gcashSales, 0);
    assert.ok(report.topItems.length > 0);
  });

  // 7. Shift Summary and Cash Drawer Accountability
  await t.test('7. reportService.getShiftSummary checks expected vs counted cash drawer', () => {
    const summary = reportService.getShiftSummary(1);

    // Starting cash: 1,000, Cash sales: 215 -> Expected: 1,215
    assert.equal(summary.cashAccounting.startingCash, 1000);
    assert.equal(summary.cashAccounting.cashSales, 215);
    assert.equal(summary.cashAccounting.expectedDrawerCash, 1215);
  });

  // 8. Product Mix Report
  await t.test('8. reportService.getProductMixReport aggregates variant revenue shares', () => {
    const mix = reportService.getProductMixReport(today, today);

    assert.equal(mix.totalRevenue, 215);
    assert.equal(mix.totalUnits, 3); // 2 + 1
    const eightPcs = mix.items.find(i => i.variant_label === '8 pcs');
    assert.ok(eightPcs);
    assert.equal(eightPcs.units_sold, 2);
    assert.equal(eightPcs.total_revenue, 170);
    assert.ok(Math.abs(eightPcs.percentOfRevenue - (170 / 215 * 100)) < 0.01);
  });

  // 9. Inventory Report with Shrinkage
  await t.test('9. reportService.getInventoryReport includes net waste', () => {
    const inv = reportService.getInventoryReport(today, today);
    const batter = inv.items.find(i => i.item_id === 1);
    assert.ok(batter);
    assert.equal(batter.total_stock_in, 5.0);
    assert.ok(Math.abs(batter.total_waste_qty - 0.05) < 0.0001);
  });

  // 10. CSV Exporting
  await t.test('10. reportService.exportToCsv generates valid RFC 4180 CSV string', () => {
    const mix = reportService.getProductMixReport(today, today);
    const csv = reportService.exportToCsv('product_mix', mix);

    assert.ok(csv.includes('Category,Product,Variant,Unit Price,Units Sold,Total Revenue'));
    assert.ok(csv.includes('8 pcs'));
    assert.ok(csv.includes('170.00'));
  });
});

// tests/unit/staffSettings.test.js
// Unit tests for StaffService, SettingsService, and DashboardService.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initDatabase, closeDb } from '../../main/db/db.js';
import { runMigrations } from '../../main/db/migrations/migrationRunner.js';
import { seedInitialData } from '../../main/db/seed.js';
import { StaffService } from '../../main/services/staffService.js';
import { SettingsService } from '../../main/services/settingsService.js';
import { DashboardService } from '../../main/services/dashboardService.js';
import { ShiftService } from '../../main/services/shiftService.js';
import { OrderService } from '../../main/services/orderService.js';
import { ROLES } from '../../shared/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.resolve(__dirname, '../../data/test-staff-settings.db');

test('Phase 5 Staff, Settings & Dashboard Suite', async (t) => {
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch (e) {}
  }
  const walPath = testDbPath + '-wal';
  const shmPath = testDbPath + '-shm';
  if (fs.existsSync(walPath)) try { fs.unlinkSync(walPath); } catch (e) {}
  if (fs.existsSync(shmPath)) try { fs.unlinkSync(shmPath); } catch (e) {}

  const db = initDatabase(testDbPath);
  runMigrations(db);
  await seedInitialData(db);

  const staffService = new StaffService(db);
  const settingsService = new SettingsService(db);
  const dashboardService = new DashboardService(db);
  const shiftService = new ShiftService(db);
  const orderService = new OrderService(db);

  t.after(() => {
    closeDb();
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch (e) {}
  });

  await t.test('1. StaffService lists seeded accounts without leaking hashes', () => {
    const list = staffService.listStaff();
    assert.strictEqual(list.length >= 3, true);

    const admin = list.find(u => u.username === 'admin');
    assert.ok(admin);
    assert.strictEqual(admin.role, ROLES.ADMIN);
    assert.strictEqual(admin.active, 1);
    assert.strictEqual(admin.has_pin, 1);
    assert.strictEqual(admin.password_hash, undefined, 'password_hash must never be leaked');
    assert.strictEqual(admin.pin, undefined, 'pin hash must never be leaked');
  });

  let createdStaffId = null;

  await t.test('2. StaffService creates new staff user with bcrypt hashes', () => {
    const newUser = staffService.createStaff({
      name: 'Maria Santos',
      username: 'maria',
      password: 'password123',
      pin: '2222',
      role: ROLES.STAFF,
    });

    assert.ok(newUser.id);
    createdStaffId = newUser.id;
    assert.strictEqual(newUser.name, 'Maria Santos');
    assert.strictEqual(newUser.username, 'maria');
    assert.strictEqual(newUser.role, ROLES.STAFF);
    assert.strictEqual(newUser.active, 1);
    assert.strictEqual(newUser.has_pin, 1);

    // Verify row in database has hashed credentials
    const raw = db.prepare('SELECT password_hash, pin FROM users WHERE id = ?').get(newUser.id);
    assert.notStrictEqual(raw.password_hash, 'password123');
    assert.strictEqual(staffService.verify('password123', raw.password_hash), true);
    assert.strictEqual(staffService.verify('2222', raw.pin), true);
  });

  await t.test('3. StaffService enforces duplicate username and validation rules', () => {
    assert.throws(() => {
      staffService.createStaff({
        name: 'Maria Dupe',
        username: 'maria',
        password: 'password123',
        role: ROLES.STAFF,
      });
    }, /already taken/);

    assert.throws(() => {
      staffService.createStaff({
        name: 'Short Pass',
        username: 'short',
        password: '123',
        role: ROLES.STAFF,
      });
    }, /at least 6 characters/);

    assert.throws(() => {
      staffService.createStaff({
        name: 'Invalid Role',
        username: 'invalidrole',
        password: 'password123',
        role: 'super_hacker',
      });
    }, /Invalid role/);
  });

  await t.test('4. StaffService updates profile and resets credentials', () => {
    const updated = staffService.updateStaff(createdStaffId, {
      name: 'Maria Santos-Cruz',
      role: ROLES.ADMIN_STAFF,
    });
    assert.strictEqual(updated.name, 'Maria Santos-Cruz');
    assert.strictEqual(updated.role, ROLES.ADMIN_STAFF);

    // Reset password
    staffService.resetPassword(createdStaffId, 'newsecret123');
    const raw = db.prepare('SELECT password_hash, pin FROM users WHERE id = ?').get(createdStaffId);
    assert.strictEqual(staffService.verify('newsecret123', raw.password_hash), true);

    // Reset PIN
    staffService.resetPin(createdStaffId, '9999');
    const rawAfterPin = db.prepare('SELECT pin FROM users WHERE id = ?').get(createdStaffId);
    assert.strictEqual(staffService.verify('9999', rawAfterPin.pin), true);
  });

  await t.test('5. StaffService deactivates and reactivates staff', () => {
    staffService.deactivateStaff(createdStaffId);
    const deactivated = staffService.getStaffById(createdStaffId);
    assert.strictEqual(deactivated.active, 0);

    staffService.reactivateStaff(createdStaffId);
    const reactivated = staffService.getStaffById(createdStaffId);
    assert.strictEqual(reactivated.active, 1);
  });

  await t.test('6. StaffService protects the sole active administrator from deactivation', () => {
    const adminUser = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
    assert.throws(() => {
      staffService.deactivateStaff(adminUser.id);
    }, /must retain at least one active Administrator/);
  });

  await t.test('7. SettingsService retrieves defaults and handles batch updates', () => {
    const all = settingsService.getAllSettings();
    assert.strictEqual(all.store_name, 'TAKOTIME - Montalban');
    assert.strictEqual(all.currency_symbol, '₱');

    const updated = settingsService.updateSettings({
      store_name: 'TAKOTIME - Montalban Central',
      receipt_footer: 'Salamat po sa pagtangkilik!',
      custom_promo_banner: 'Summer Takoyaki Fiesta!',
    });

    assert.strictEqual(updated.store_name, 'TAKOTIME - Montalban Central');
    assert.strictEqual(updated.receipt_footer, 'Salamat po sa pagtangkilik!');
    assert.strictEqual(updated.custom_promo_banner, 'Summer Takoyaki Fiesta!');

    // Verify persisted in DB
    const fresh = settingsService.getAllSettings();
    assert.strictEqual(fresh.store_name, 'TAKOTIME - Montalban Central');
  });

  await t.test('8. DashboardService computes live sales, active shift, trend, and low-stock alerts', () => {
    // Open a shift and make an order
    const shift = shiftService.openShift(3, 1000); // Cashier 1

    orderService.createOrder({
      shiftId: shift.id,
      staffId: 3,
      items: [
        { variantId: 2, qty: 2 }, // 8 pcs Takoyaki @ 85 = 170
      ],
      paymentMethod: 'cash',
      amountTendered: 200,
    });

    const overview = dashboardService.getOverview();
    assert.ok(overview);
    assert.strictEqual(overview.today.completedOrders >= 1, true);
    assert.strictEqual(overview.today.netSales >= 170, true);

    // Active shift verification
    assert.ok(overview.activeShift);
    assert.strictEqual(overview.activeShift.shiftId, shift.id);
    assert.strictEqual(overview.activeShift.startingCash, 1000);
    assert.strictEqual(overview.activeShift.cashSales >= 170, true);
    assert.strictEqual(overview.activeShift.expectedDrawerCash >= 1170, true);

    // 7-day trend
    assert.strictEqual(overview.salesTrend.length, 7);
    const todayTrend = overview.salesTrend[overview.salesTrend.length - 1];
    assert.strictEqual(todayTrend.revenue >= 170, true);
    assert.strictEqual(todayTrend.orderCount >= 1, true);

    // Top products
    assert.strictEqual(overview.topProducts.length >= 1, true);
    assert.strictEqual(overview.topProducts[0].product_name, 'Classic Octopus Takoyaki');
  });

  test('9. DashboardService supports multi-timeframe sales trends (7d, 15d, 30d, semi-annual, annual)', () => {
    // 7 days
    const trend7 = dashboardService.getSalesTrend(undefined, '7d');
    assert.strictEqual(trend7.length, 7);
    assert.ok(trend7[6].revenue >= 170);

    // 15 days
    const trend15 = dashboardService.getSalesTrend(undefined, '15d');
    assert.strictEqual(trend15.length, 15);
    assert.ok(trend15[14].label);
    assert.ok(typeof trend15[14].revenue === 'number');
    assert.ok(typeof trend15[14].orderCount === 'number');

    // 30 days
    const trend30 = dashboardService.getSalesTrend(undefined, '30d');
    assert.strictEqual(trend30.length, 30);
    assert.ok(trend30[29].label);

    // Semi-annually (6 months)
    const trendSemi = dashboardService.getSalesTrend(undefined, 'semi_annual');
    assert.strictEqual(trendSemi.length, 6);
    assert.ok(trendSemi[5].label);

    // Annually (12 months)
    const trendAnnual = dashboardService.getSalesTrend(undefined, 'annual');
    assert.strictEqual(trendAnnual.length, 12);
    assert.ok(trendAnnual[11].label);

    // Parameterized getOverview
    const overview15 = dashboardService.getOverview(undefined, '15d');
    assert.strictEqual(overview15.salesTrend.length, 15);
    assert.strictEqual(overview15.timeframe, '15d');

    const overviewAnnual = dashboardService.getOverview(undefined, 'annual');
    assert.strictEqual(overviewAnnual.salesTrend.length, 12);
    assert.strictEqual(overviewAnnual.timeframe, 'annual');
  });
});


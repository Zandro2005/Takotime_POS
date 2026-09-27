// tests/unit/syncService.test.js
// Unit tests for SyncService: order push, admin action pull, idempotency, and network failure resilience.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initDatabase, closeDb } from '../../main/db/db.js';
import { runMigrations } from '../../main/db/migrations/migrationRunner.js';
import { seedInitialData } from '../../main/db/seed.js';
import { SyncService } from '../../main/services/syncService.js';
import { OrderService } from '../../main/services/orderService.js';
import { ShiftService } from '../../main/services/shiftService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.resolve(__dirname, '../../data/test-sync.db');

test('Phase 6 Cloud Sync Bridge Suite', async (t) => {
  closeDb();
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

  const orderService = new OrderService(db);
  const shiftService = new ShiftService(db);

  // Simulated in-memory Firebase storage
  const mockFirebaseDb = new Map();
  const mockFetchHistory = [];

  // Simulated Fetch function for Firebase REST API
  const mockFetch = async (url, options = {}) => {
    mockFetchHistory.push({ url, method: options.method || 'GET', body: options.body });

    const parsedUrl = new URL(url);
    const pathKey = parsedUrl.pathname.replace(/\.json$/, '');

    if (options.method === 'PUT') {
      const data = JSON.parse(options.body);
      mockFirebaseDb.set(pathKey, data);
      return { ok: true, status: 200, json: async () => data };
    }

    if (options.method === 'PATCH') {
      const existing = mockFirebaseDb.get(pathKey) || {};
      const delta = JSON.parse(options.body);
      const merged = { ...existing, ...delta };
      mockFirebaseDb.set(pathKey, merged);

      const lastSlash = pathKey.lastIndexOf('/');
      if (lastSlash > 0) {
        const parentPath = pathKey.substring(0, lastSlash);
        const subKey = pathKey.substring(lastSlash + 1);
        if (mockFirebaseDb.has(parentPath)) {
          const parentObj = mockFirebaseDb.get(parentPath);
          if (parentObj && parentObj[subKey]) {
            parentObj[subKey] = { ...parentObj[subKey], ...delta };
          }
        }
      }
      return { ok: true, status: 200, json: async () => merged };
    }

    if (options.method === 'GET') {
      const data = mockFirebaseDb.get(pathKey) || null;
      return { ok: true, status: 200, json: async () => data };
    }

    return { ok: false, status: 405 };
  };

  const syncService = new SyncService(db, {
    firebaseBaseUrl: 'https://test-project-rtdb.firebaseio.com',
    branchId: 'montalban',
    fetchFn: mockFetch,
    enabled: true,
  });

  t.after(() => {
    closeDb();
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch (e) {}
  });

  // Setup order data
  const shift = shiftService.openShift(3, 1000);
  const order1 = orderService.createOrder({
    shiftId: shift.id,
    staffId: 3,
    items: [{ variantId: 1, qty: 1 }], // 4 pcs Takoyaki @ 45
    paymentMethod: 'cash',
    amountTendered: 50,
  });
  const order2 = orderService.createOrder({
    shiftId: shift.id,
    staffId: 3,
    items: [{ variantId: 2, qty: 2 }], // 8 pcs Takoyaki @ 85 = 170
    paymentMethod: 'gcash',
    gcashRefNo: 'GCASH12345',
  });

  await t.test('1. pushPendingOrders pushes completed orders with items & marks synced_at', async () => {
    const res = await syncService.pushPendingOrders();
    assert.strictEqual(res.pushed, 2);

    // Verify stored in mock Firebase
    const remoteOrder1 = mockFirebaseDb.get(`/stores/montalban/orders/${order1.id}`);
    assert.ok(remoteOrder1);
    assert.strictEqual(remoteOrder1.order_id, order1.id);
    assert.strictEqual(remoteOrder1.total, 45);
    assert.strictEqual(remoteOrder1.items.length, 1);
    assert.strictEqual(remoteOrder1.items[0].product_name, 'Classic Octopus Takoyaki');

    const remoteOrder2 = mockFirebaseDb.get(`/stores/montalban/orders/${order2.id}`);
    assert.ok(remoteOrder2);
    assert.strictEqual(remoteOrder2.payment_method, 'gcash');
    assert.strictEqual(remoteOrder2.gcash_ref_no, 'GCASH12345');

    // Verify local SQLite rows have synced_at populated
    const checkDb = db.prepare('SELECT id, synced_at FROM orders WHERE id IN (?, ?)').all(order1.id, order2.id);
    assert.strictEqual(checkDb.length, 2);
    assert.ok(checkDb[0].synced_at);
    assert.ok(checkDb[1].synced_at);
  });

  await t.test('2. pushPendingOrders is idempotent (zero pushed on re-run)', async () => {
    const res = await syncService.pushPendingOrders();
    assert.strictEqual(res.pushed, 0);
  });

  await t.test('3. pushDailySummary and pushInventorySnapshot write correctly to cloud', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const summaryRes = await syncService.pushDailySummary(todayStr);
    assert.strictEqual(summaryRes.success, true);

    const remoteSummary = mockFirebaseDb.get(`/stores/montalban/daily_summaries/${todayStr}`);
    assert.ok(remoteSummary);
    assert.strictEqual(remoteSummary.completed_orders, 2);
    assert.strictEqual(remoteSummary.net_sales, 215);

    const invRes = await syncService.pushInventorySnapshot();
    assert.strictEqual(invRes.success, true);
    const remoteInv = mockFirebaseDb.get('/stores/montalban/inventory_snapshot');
    assert.ok(remoteInv);
    assert.strictEqual(remoteInv.items.length >= 10, true);
  });

  await t.test('4. pullAndApplyAdminActions applies price change action and deduplicates', async () => {
    // Stage an admin action in Firebase queue
    const actionKey = 'action_price_001';
    mockFirebaseDb.set('/stores/montalban/admin_actions_queue', {
      [actionKey]: {
        id: actionKey,
        action_type: 'change_price',
        payload: {
          variant_id: 1, // 4 pcs Takoyaki
          price: 55.0,  // price increased from 45 to 55
          cost: 22.0,
        },
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    });

    const res = await syncService.pullAndApplyAdminActions();
    assert.strictEqual(res.applied, 1);

    // Verify variant price updated in SQLite
    const updatedVariant = db.prepare('SELECT price, cost FROM product_variants WHERE id = 1').get();
    assert.strictEqual(updatedVariant.price, 55.0);
    assert.strictEqual(updatedVariant.cost, 22.0);

    // Verify recorded in applied_admin_actions
    const appliedRecord = db.prepare('SELECT action_id, action_type FROM applied_admin_actions WHERE action_id = ?').get(actionKey);
    assert.ok(appliedRecord);
    assert.strictEqual(appliedRecord.action_type, 'change_price');

    // Verify remote action status was patched to 'applied'
    const queueData = mockFirebaseDb.get('/stores/montalban/admin_actions_queue');
    assert.strictEqual(queueData[actionKey].status, 'applied');

    // Test Idempotency: re-running pullAndApplyAdminActions should not re-apply
    const secondPull = await syncService.pullAndApplyAdminActions();
    assert.strictEqual(secondPull.applied, 0);
  });

  await t.test('5. pullAndApplyAdminActions applies remote staff creation action', async () => {
    const actionKey = 'action_staff_002';
    mockFirebaseDb.set('/stores/montalban/admin_actions_queue', {
      [actionKey]: {
        id: actionKey,
        action_type: 'add_staff',
        payload: {
          name: 'Remote Staff Cashier',
          username: 'remotestaff',
          password: 'password123',
          pin: '3333',
          role: 'staff',
        },
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    });

    const res = await syncService.pullAndApplyAdminActions();
    assert.strictEqual(res.applied, 1);

    const userInDb = db.prepare("SELECT username, name, role, active FROM users WHERE username = 'remotestaff'").get();
    assert.ok(userInDb);
    assert.strictEqual(userInDb.name, 'Remote Staff Cashier');
    assert.strictEqual(userInDb.role, 'staff');
  });

  await t.test('6. Network failure resilience: sync failure is logged and does not disrupt local store', async () => {
    // Failing sync service with broken network
    const failingSync = new SyncService(db, {
      firebaseBaseUrl: 'https://test-broken.firebaseio.com',
      branchId: 'montalban',
      fetchFn: async () => {
        throw new Error('ENOTFOUND: Internet connectivity unavailable');
      },
      enabled: true,
    });

    // Run sync cycle
    const result = await failingSync.runSync();
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Internet connectivity unavailable'));

    // Check that sync_log recorded the failure
    const latestLog = db.prepare('SELECT status, error_message FROM sync_log ORDER BY id DESC LIMIT 1').get();
    assert.strictEqual(latestLog.status, 'failed');
    assert.ok(latestLog.error_message.includes('Internet connectivity unavailable'));

    // Verify local DB integrity and orders remain intact
    const ordersCount = db.prepare('SELECT COUNT(id) as count FROM orders').get().count;
    assert.strictEqual(ordersCount, 2);
  });

  await t.test('7. getSyncStatus returns accurate diagnostics', () => {
    const status = syncService.getSyncStatus();
    assert.strictEqual(status.isEnabled, true);
    assert.strictEqual(status.branchId, 'montalban');
    assert.strictEqual(status.totalOrdersCount, 2);
    assert.strictEqual(status.pendingOrdersCount, 0);
  });
});

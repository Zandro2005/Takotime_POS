// tests/unit/backupHealth.test.js
// Unit tests for BackupService, HealthService, and Thermal PrintService

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initDatabase, closeDb } from '../../main/db/db.js';
import { runMigrations } from '../../main/db/migrations/migrationRunner.js';
import { seedInitialData } from '../../main/db/seed.js';
import { BackupService } from '../../main/services/backupService.js';
import { HealthService } from '../../main/services/healthService.js';
import { PrintService, ESC_POS } from '../../main/services/printService.js';
import { OrderService } from '../../main/services/orderService.js';
import { ShiftService } from '../../main/services/shiftService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.resolve(__dirname, '../../data/test-hardening.db');
const testBackupsDir = path.resolve(__dirname, '../../data/test-backups');
const testSpoolerDir = path.resolve(__dirname, '../../data/test-spooler');

test('Phase 7 Production Hardening Suite', async (t) => {
  // Clean up previous test artifacts
  closeDb();
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch (_) {}
  }
  const walPath = testDbPath + '-wal';
  const shmPath = testDbPath + '-shm';
  if (fs.existsSync(walPath)) try { fs.unlinkSync(walPath); } catch (_) {}
  if (fs.existsSync(shmPath)) try { fs.unlinkSync(shmPath); } catch (_) {}

  if (fs.existsSync(testBackupsDir)) {
    try { fs.rmSync(testBackupsDir, { recursive: true, force: true }); } catch (_) {}
  }
  if (fs.existsSync(testSpoolerDir)) {
    try { fs.rmSync(testSpoolerDir, { recursive: true, force: true }); } catch (_) {}
  }

  // 1. Initialize SQLite database & seed
  const db = initDatabase(testDbPath);
  runMigrations(db);
  await seedInitialData(db);

  const backupService = new BackupService(db, { backupDir: testBackupsDir, retentionDays: 30 });
  const healthService = new HealthService(db);
  const printService = new PrintService(db, { spoolerDir: testSpoolerDir });
  const orderService = new OrderService(db);
  const shiftService = new ShiftService(db);

  await t.test('1. BackupService creates valid atomic SQLite backup with VACUUM INTO and WAL flush', () => {
    const backupResult = backupService.createBackup('test_manual');

    assert.equal(backupResult.success, true);
    assert.match(backupResult.filename, /^pos_\d{8}_\d{6}_test_manual\.db$/);
    assert.equal(fs.existsSync(backupResult.filePath), true);
    assert.ok(backupResult.sizeBytes > 0);
    assert.equal(backupResult.integrity, 'ok');

    // Verify backup file can be opened and queried independently
    const check = backupService.verifyBackupIntegrity(backupResult.filePath);
    assert.equal(check.valid, true);
    assert.equal(check.message, 'ok');
  });

  await t.test('2. BackupService lists backups in descending order and provides size formatting', () => {
    // Create another backup
    backupService.createBackup('test_shift_close');

    const list = backupService.listBackups();
    assert.ok(list.length >= 2);
    assert.equal(typeof list[0].filename, 'string');
    assert.equal(typeof list[0].sizeFormatted, 'string');
    assert.ok(new Date(list[0].createdAt).getTime() >= new Date(list[1].createdAt).getTime());
  });

  await t.test('3. BackupService prunes backups older than specified retention days', () => {
    // Create a mock old backup file with timestamp 35 days ago
    const oldFileName = 'pos_20260101_000000_old.db';
    const oldFilePath = path.join(testBackupsDir, oldFileName);
    fs.writeFileSync(oldFilePath, 'mock sqlite header content');

    const thirtyFiveDaysAgo = Date.now() - (35 * 24 * 60 * 60 * 1000);
    fs.utimesSync(oldFilePath, new Date(thirtyFiveDaysAgo), new Date(thirtyFiveDaysAgo));

    assert.equal(fs.existsSync(oldFilePath), true);

    const pruneResult = backupService.pruneOldBackups(30);
    assert.equal(pruneResult.prunedCount, 1);
    assert.equal(fs.existsSync(oldFilePath), false);
  });

  await t.test('4. HealthService runs PRAGMA integrity_check and reports 0 corrupt pages', () => {
    const integrity = healthService.runIntegrityCheck();

    assert.equal(integrity.ok, true);
    assert.equal(integrity.status, 'PASSED');
    assert.match(integrity.details, /0 corrupt pages/);
  });

  await t.test('5. HealthService reports comprehensive system status and table counts', () => {
    const status = healthService.getSystemStatus();

    assert.equal(status.database.journalMode, 'WAL');
    assert.equal(status.database.integrity.status, 'PASSED');
    assert.ok(status.database.counts.users >= 3);
    assert.ok(status.database.counts.products >= 3);
    assert.ok(status.system.uptimeSeconds >= 0);
  });

  await t.test('6. HealthService detects and recovers stale shifts', () => {
    // Open a shift with date set to 2 days ago
    const shiftInfo = db.prepare(`
      INSERT INTO shifts (staff_id, status, opened_at, starting_cash, last_queue_no)
      VALUES (3, 'open', datetime('now', '-48 hours'), 500.0, 0)
    `).run();
    const staleShiftId = shiftInfo.lastInsertRowid;

    const staleList = healthService.getStaleShifts();
    const found = staleList.find(s => s.id === staleShiftId);
    assert.ok(found, 'Stale shift should be detected');
    assert.ok(found.hours_open >= 47);

    // Force close stale shift
    const closeResult = healthService.forceCloseStaleShift(staleShiftId, 'Test recovery force close');
    assert.equal(closeResult.success, true);
    assert.equal(closeResult.status, 'force_closed');

    const updated = db.prepare('SELECT status FROM shifts WHERE id = ?').get(staleShiftId);
    assert.equal(updated.status, 'force_closed');
  });

  await t.test('7. PrintService generates valid ESC/POS command buffer with queue number and cut paper', () => {
    // Create an active shift and an order
    const shift = shiftService.openShift(3, 1000, 'Test print shift');
    const orderResult = orderService.createOrder({
      shiftId: shift.id,
      staffId: 3,
      items: [
        { variantId: 1, qty: 2, modifiers: [] }, // 2x 4pcs takoyaki
      ],
      paymentMethod: 'cash',
      amountTendered: 150.0,
    });

    assert.ok(orderResult.id > 0);
    const orderId = orderResult.id;

    // Generate ESC/POS buffer
    const { buffer, formattedText } = printService.generateEscPosBuffer(orderId);

    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 50);

    // Verify ESC/POS init bytes (ESC @ -> 0x1b, 0x40)
    assert.equal(buffer[0], 0x1b);
    assert.equal(buffer[1], 0x40);

    // Verify drawer kick bytes included for cash order
    const hasDrawerKick = buffer.includes(ESC_POS.DRAWER_KICK);
    assert.equal(hasDrawerKick, true);

    // Verify paper cut bytes included
    const hasPaperCut = buffer.includes(ESC_POS.CUT_PAPER);
    assert.equal(hasPaperCut, true);

    // Verify receipt text has store title and queue number
    assert.match(formattedText, /TAKOTIME/);
    assert.match(formattedText, /QUEUE #:/);
  });

  await t.test('8. PrintService prints to spooler safely without blocking order workflow', () => {
    const printResult = printService.printReceipt(1);

    assert.equal(printResult.success, true);
    assert.equal(printResult.simulated, true);
    assert.ok(fs.existsSync(printResult.spoolFile));

    const testTicket = printService.testPrint();
    assert.equal(testTicket.success, true);

    const drawer = printService.openCashDrawer();
    assert.equal(drawer.success, true);
  });

  // Cleanup test environment
  closeDb();
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch (_) {}
  }
  if (fs.existsSync(walPath)) try { fs.unlinkSync(walPath); } catch (_) {}
  if (fs.existsSync(shmPath)) try { fs.unlinkSync(shmPath); } catch (_) {}
  if (fs.existsSync(testBackupsDir)) {
    try { fs.rmSync(testBackupsDir, { recursive: true, force: true }); } catch (_) {}
  }
  if (fs.existsSync(testSpoolerDir)) {
    try { fs.rmSync(testSpoolerDir, { recursive: true, force: true }); } catch (_) {}
  }
});

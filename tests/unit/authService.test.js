// tests/unit/authService.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { initDatabase, closeDb } from '../../main/db/db.js';
import { runMigrations } from '../../main/db/migrations/migrationRunner.js';
import { seedInitialData } from '../../main/db/seed.js';
import { authService } from '../../main/services/authService.js';
import { ROLES } from '../../shared/constants.js';

test('Database init, migration, seed, and auth tests', async (t) => {
  const testDbPath = path.join(process.cwd(), 'data', 'test-pos.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const db = initDatabase(testDbPath);

  await t.test('Migration runner initializes schema', () => {
    const version = runMigrations(db);
    assert.equal(version >= 1, true);

    const userVersion = db.pragma('user_version', { simple: true });
    assert.equal(userVersion, 1);
  });

  await t.test('Seed data populates users, categories, products and recipes', () => {
    seedInitialData(db);

    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    assert.equal(users.count >= 3, true);

    const categories = db.prepare('SELECT COUNT(*) as count FROM categories').get();
    assert.equal(categories.count, 3);

    const products = db.prepare('SELECT COUNT(*) as count FROM products').get();
    assert.equal(products.count >= 7, true);

    const variants = db.prepare('SELECT COUNT(*) as count FROM product_variants').get();
    assert.equal(variants.count >= 13, true);
  });

  await t.test('AuthService login with password works', () => {
    const session = authService.login('admin', 'admin123');
    assert.ok(session.sessionId);
    assert.equal(session.user.username, 'admin');
    assert.equal(session.user.role, ROLES.ADMIN);
  });

  await t.test('AuthService login with PIN works for staff', () => {
    const session = authService.loginWithPin('1111');
    assert.ok(session.sessionId);
    assert.equal(session.user.username, 'cashier');
    assert.equal(session.user.role, ROLES.STAFF);
  });

  await t.test('AuthService invalid credentials throws', () => {
    assert.throws(() => {
      authService.login('admin', 'wrongpassword');
    }, /Invalid username or password/);

    assert.throws(() => {
      authService.loginWithPin('9999');
    }, /Invalid PIN/);
  });

  await t.test('Session retrieval and timeout tracking', () => {
    const session = authService.login('admin', 'admin123');
    const retrieved = authService.getSession(session.sessionId);
    assert.ok(retrieved);
    assert.equal(retrieved.user.username, 'admin');

    authService.logout(session.sessionId);
    const afterLogout = authService.getSession(session.sessionId);
    assert.equal(afterLogout, null);
  });

  closeDb();
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch {}
  }
});

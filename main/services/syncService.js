// main/services/syncService.js
// Cloud synchronization bridge connecting local SQLite with Firebase Realtime Database.
// Designed with zero-downtime offline-first architecture: store never depends on cloud to function.

import { getDb } from '../db/db.js';
import { logger } from '../utils/logger.js';
import { StaffService } from './staffService.js';
import { SettingsService } from './settingsService.js';
import { MenuService } from './menuService.js';

export class SyncService {
  constructor(dbInstance = null, options = {}) {
    this._db = dbInstance;
    this.options = options;
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.staffService = new StaffService(this.db);
    this.settingsService = new SettingsService(this.db);
    this.menuService = new MenuService(this.db);
  }

  get db() {
    return this._db || getDb();
  }

  /**
   * Resolves Firebase configuration from parameters or database settings.
   */
  getConfig() {
    const db = this.db;
    const settings = this.settingsService.getAllSettings();

    const baseUrl = this.options.firebaseBaseUrl || settings.firebase_db_url || 'https://takotime-pos-default-rtdb.asia-southeast1.firebasedatabase.app';
    const branchId = this.options.branchId || settings.branch_id || 'montalban';
    const authToken = this.options.authToken || settings.firebase_auth_token || null;
    const isEnabled = this.options.enabled !== undefined ? this.options.enabled : (settings.cloud_sync_enabled !== '0');

    let terminalId = settings.terminal_id;
    if (!terminalId) {
      const crypto = require('node:crypto');
      terminalId = crypto.randomUUID();
      try {
        this.settingsService.updateSettings({ terminal_id: terminalId });
      } catch (e) {
        // Safe fallback
      }
    }

    // Clean trailing slash
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    return {
      baseUrl: cleanUrl,
      branchId,
      terminalId,
      authToken,
      isEnabled,
    };
  }

  /**
   * Constructs authenticated Firebase REST URL.
   */
  buildUrl(path) {
    const { baseUrl, branchId, authToken } = this.getConfig();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let url = `${baseUrl}/stores/${branchId}${cleanPath}.json`;
    if (authToken) {
      url += `?auth=${encodeURIComponent(authToken)}`;
    }
    return url;
  }

  /**
   * Pushes all completed orders that have not yet been synced to Firebase RTDB.
   * Uses idempotent PUT requests so re-pushing does not duplicate records.
   */
  async pushPendingOrders(limit = 100) {
    const db = this.db;
    const { isEnabled, terminalId } = this.getConfig();
    if (!isEnabled) {
      return { pushed: 0, skipped: true, reason: 'Sync disabled' };
    }

    // 1. Fetch un-synced completed orders
    const pendingOrders = db.prepare(`
      SELECT 
        o.*,
        u.name as staff_name,
        u.username as staff_username
      FROM orders o
      JOIN users u ON u.id = o.staff_id
      WHERE o.synced_at IS NULL AND o.status = 'completed'
      ORDER BY o.created_at ASC
      LIMIT ?
    `).all(limit);

    if (pendingOrders.length === 0) {
      return { pushed: 0, pending: 0 };
    }

    let pushedCount = 0;
    const markSyncedStmt = db.prepare(`
      UPDATE orders 
      SET synced_at = datetime('now', 'localtime') 
      WHERE id = ?
    `);

    for (const order of pendingOrders) {
      // Gather order items
      const items = db.prepare(`
        SELECT 
          oi.id,
          oi.variant_id,
          oi.qty,
          oi.unit_price,
          oi.subtotal,
          pv.label as variant_label,
          p.name as product_name,
          c.name as category_name
        FROM order_items oi
        JOIN product_variants pv ON pv.id = oi.variant_id
        JOIN products p ON p.id = pv.product_id
        JOIN categories c ON c.id = p.category_id
        WHERE oi.order_id = ?
      `).all(order.id);

      // Gather item modifiers
      for (const item of items) {
        item.modifiers = db.prepare(`
          SELECT 
            m.name,
            oim.price_delta
          FROM order_item_modifiers oim
          JOIN modifiers m ON m.id = oim.modifier_id
          WHERE oim.order_item_id = ?
        `).all(item.id);
      }

      const payload = {
        order_id: order.id,
        shift_id: order.shift_id,
        staff: {
          id: order.staff_id,
          name: order.staff_name,
          username: order.staff_username,
        },
        queue_no: order.queue_no,
        order_type: order.order_type,
        subtotal: order.subtotal,
        discount: order.discount,
        discount_type: order.discount_type,
        total: order.total,
        payment_method: order.payment_method,
        gcash_ref_no: order.gcash_ref_no,
        status: order.status,
        created_at: order.created_at,
        pushed_at: new Date().toISOString(),
        items,
      };

      const url = this.buildUrl(`/terminals/${terminalId}/orders/${order.id}`);
      const res = await this.fetchFn(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Firebase push failed for Order #${order.id}: HTTP ${res.status}`);
      }

      markSyncedStmt.run(order.id);
      pushedCount++;
    }

    logger.info(`Synced ${pushedCount} pending orders to cloud`);
    return { pushed: pushedCount, remaining: pendingOrders.length - pushedCount };
  }

  /**
   * Pushes daily sales metrics summary for the store.
   */
  async pushDailySummary(dateStr = new Date().toLocaleDateString('en-CA')) {
    const db = this.db;
    const { isEnabled, terminalId } = this.getConfig();
    if (!isEnabled) return { success: false, reason: 'Sync disabled' };

    const totals = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'voided' THEN 1 END) as voided_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN subtotal ELSE 0 END), 0) as gross_sales,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN discount ELSE 0 END), 0) as discounts,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) as net_sales,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method != 'cash' THEN total ELSE 0 END), 0) as gcash_sales
      FROM orders
      WHERE DATE(created_at) = DATE(?)
    `).get(dateStr);

    const summaryPayload = {
      date: dateStr,
      ...totals,
      updated_at: new Date().toISOString(),
    };

    const url = this.buildUrl(`/terminals/${terminalId}/daily_summaries/${dateStr}`);
    const res = await this.fetchFn(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summaryPayload),
    });

    if (!res.ok) {
      throw new Error(`Failed to push daily summary: HTTP ${res.status}`);
    }

    return { success: true, date: dateStr };
  }

  /**
   * Pushes live inventory stock levels to Firebase so remote admin can monitor supplies.
   */
  async pushInventorySnapshot() {
    const db = this.db;
    const { isEnabled, terminalId } = this.getConfig();
    if (!isEnabled) return { success: false, reason: 'Sync disabled' };

    const todayStr = new Date().toLocaleDateString('en-CA');
    const items = db.prepare(`
      SELECT 
        i.id,
        i.name,
        i.unit,
        i.min_stock,
        COALESCE(l.ending_qty, l.beginning_qty + l.stock_in - COALESCE(l.confirmed_out, l.suggested_out, 0), 0) as current_stock,
        l.stock_in,
        l.suggested_out,
        l.confirmed_out,
        l.waste_qty
      FROM inventory_items i
      LEFT JOIN inventory_logs l ON l.item_id = i.id AND l.log_date = ?
      WHERE i.active = 1
      ORDER BY i.name ASC
    `).all(todayStr);

    const payload = {
      date: todayStr,
      updated_at: new Date().toISOString(),
      items: items.map(item => ({
        ...item,
        current_stock: Math.round(item.current_stock * 100) / 100,
        is_low: item.current_stock <= item.min_stock,
      })),
    };

    const url = this.buildUrl(`/terminals/${terminalId}/inventory_snapshot`);
    const res = await this.fetchFn(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to push inventory snapshot: HTTP ${res.status}`);
    }

    return { success: true, itemCount: items.length };
  }

  /**
   * Pushes store heartbeat indicating store terminal is alive.
   */
  async pushHeartbeat() {
    const { isEnabled, branchId, terminalId } = this.getConfig();
    if (!isEnabled) return { success: false, reason: 'Sync disabled' };

    const payload = {
      branchId,
      status: 'online',
      app_version: '1.0.0',
      last_sync_at: new Date().toISOString(),
      terminal_os: process.platform,
    };

    const url = this.buildUrl(`/terminals/${terminalId}/heartbeat`);
    const res = await this.fetchFn(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return { success: res.ok };
  }

  /**
   * Pulls remote admin action queue from Firebase and safely applies each action locally.
   * Actions are recorded in `applied_admin_actions` to guarantee 100% idempotency.
   */
  async pullAndApplyAdminActions() {
    const db = this.db;
    const { isEnabled } = this.getConfig();
    if (!isEnabled) return { applied: 0, skipped: true, reason: 'Sync disabled' };

    const queueUrl = this.buildUrl('/admin_actions_queue');
    const res = await this.fetchFn(queueUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (res.status === 404 || !res.ok) {
      return { applied: 0, reason: 'Queue empty or unavailable' };
    }

    const data = await res.json();
    if (!data || typeof data !== 'object') {
      return { applied: 0 };
    }

    let appliedCount = 0;
    const checkAppliedStmt = db.prepare('SELECT id FROM applied_admin_actions WHERE action_id = ?');
    const recordAppliedStmt = db.prepare(`
      INSERT INTO applied_admin_actions (action_id, action_type, payload, applied_at)
      VALUES (?, ?, ?, datetime('now', 'localtime'))
    `);

    // Data can be object of actions keyed by actionId
    for (const [actionKey, action] of Object.entries(data)) {
      if (!action || typeof action !== 'object') continue;
      const actionId = action.id || actionKey;
      const actionType = action.action_type || action.type;
      const payload = action.payload || {};

      // Idempotency check: has this action been applied already?
      const alreadyApplied = checkAppliedStmt.get(actionId);
      if (alreadyApplied) {
        continue;
      }

      logger.info(`Applying remote admin action [${actionType}] ID: ${actionId}`);

      try {
        db.transaction(() => {
          switch (actionType) {
            case 'change_price': {
              const { variant_id, price, cost } = payload;
              if (variant_id && price !== undefined) {
                db.prepare(`
                  UPDATE product_variants 
                  SET 
                    price = ?, 
                    cost = COALESCE(?, cost),
                    updated_at = datetime('now', 'localtime')
                  WHERE id = ?
                `).run(Number(price), cost !== undefined ? Number(cost) : null, variant_id);
              }
              break;
            }

            case 'update_setting': {
              const { key, value } = payload;
              if (key && value !== undefined) {
                this.settingsService.updateSettings({ [key]: value });
              }
              break;
            }

            case 'add_staff': {
              this.staffService.createStaff(payload);
              break;
            }

            case 'deactivate_staff': {
              if (payload.userId) {
                this.staffService.deactivateStaff(payload.userId);
              }
              break;
            }

            case 'create_product': {
              this.menuService.createProduct(payload);
              break;
            }

            case 'update_product': {
              if (payload.id) {
                this.menuService.updateProduct(payload.id, payload);
              }
              break;
            }

            default:
              logger.warn(`Unknown remote action type: ${actionType}`);
          }

          recordAppliedStmt.run(actionId, actionType, JSON.stringify(payload));
        })();

        // Notify Firebase that action is applied
        const updateUrl = this.buildUrl(`/admin_actions_queue/${actionKey}`);
        await this.fetchFn(updateUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'applied',
            applied_at: new Date().toISOString(),
          }),
        });

        appliedCount++;
      } catch (err) {
        logger.error(`Failed to apply remote action ${actionId}: ${err.message}`);
      }
    }

    return { applied: appliedCount };
  }

  /**
   * Executes a full synchronization cycle (Push Orders, Daily Summary, Inventory, Heartbeat + Pull Actions).
   * Logs execution status in `sync_log` table.
   */
  async runSync() {
    const db = this.db;
    const startTime = new Date().toISOString();

    const logStmt = db.prepare(`
      INSERT INTO sync_log (direction, status, records_synced, error_message, started_at)
      VALUES (?, 'partial', 0, NULL, ?)
    `);
    const logInfo = logStmt.run('push', startTime);
    const syncLogId = logInfo.lastInsertRowid;

    let totalRecords = 0;
    try {
      // 1. Push pending orders
      const ordersRes = await this.pushPendingOrders();
      totalRecords += ordersRes.pushed || 0;

      // 2. Push today's summary
      await this.pushDailySummary();

      // 3. Push inventory snapshot
      await this.pushInventorySnapshot();

      // 4. Push terminal heartbeat
      await this.pushHeartbeat();

      // 5. Pull and apply queued admin actions
      const actionsRes = await this.pullAndApplyAdminActions();
      totalRecords += actionsRes.applied || 0;

      // Record successful completion
      db.prepare(`
        UPDATE sync_log 
        SET status = 'success', records_synced = ?, completed_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(totalRecords, syncLogId);

      return {
        success: true,
        recordsSynced: totalRecords,
        ordersPushed: ordersRes.pushed || 0,
        actionsApplied: actionsRes.applied || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error(`Sync cycle failed: ${err.message}`);

      db.prepare(`
        UPDATE sync_log 
        SET status = 'failed', records_synced = ?, error_message = ?, completed_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(totalRecords, err.message, syncLogId);

      return {
        success: false,
        recordsSynced: totalRecords,
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Retrieves overall synchronization diagnostics and status.
   */
  getSyncStatus() {
    const db = this.db;
    const config = this.getConfig();

    const pendingOrdersCount = db.prepare(`
      SELECT COUNT(id) as count 
      FROM orders 
      WHERE synced_at IS NULL AND status = 'completed'
    `).get().count;

    const totalOrdersCount = db.prepare('SELECT COUNT(id) as count FROM orders').get().count;

    const lastSuccessfulLog = db.prepare(`
      SELECT completed_at, records_synced 
      FROM sync_log 
      WHERE status = 'success' 
      ORDER BY id DESC 
      LIMIT 1
    `).get();

    const lastLog = db.prepare(`
      SELECT id, direction, status, records_synced, error_message, started_at, completed_at
      FROM sync_log 
      ORDER BY id DESC 
      LIMIT 1
    `).get();

    return {
      isEnabled: config.isEnabled,
      baseUrl: config.baseUrl,
      branchId: config.branchId,
      pendingOrdersCount,
      totalOrdersCount,
      lastSuccessfulSyncAt: lastSuccessfulLog ? lastSuccessfulLog.completed_at : null,
      lastSyncStatus: lastLog ? lastLog.status : 'never_run',
      lastSyncError: lastLog ? lastLog.error_message : null,
      lastLog,
    };
  }

  /**
   * Retrieves recent sync audit logs.
   */
  getSyncLogs(limit = 20) {
    const db = this.db;
    return db.prepare(`
      SELECT id, direction, status, records_synced, error_message, started_at, completed_at
      FROM sync_log
      ORDER BY id DESC
      LIMIT ?
    `).all(limit);
  }
}

export const syncService = new SyncService();

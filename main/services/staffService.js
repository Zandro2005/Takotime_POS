// main/services/staffService.js
// Business logic for staff user accounts, role assignment, credential hashing, and deactivation.

import bcrypt from 'bcryptjs';
import { getDb } from '../db/db.js';
import { ROLES } from '../../shared/constants.js';
import { logger } from '../utils/logger.js';

export class StaffService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
    this.saltRounds = 10;
  }

  get db() {
    return this._db || getDb();
  }

  hash(plainText) {
    return bcrypt.hashSync(plainText, this.saltRounds);
  }

  verify(plainText, hash) {
    if (!plainText || !hash) return false;
    return bcrypt.compareSync(plainText, hash);
  }

  /**
   * Retrieves all staff users with their metadata, omitting sensitive password/PIN hashes.
   */
  listStaff() {
    const db = this.db;
    return db.prepare(`
      SELECT 
        u.id, 
        u.name, 
        u.username, 
        u.role, 
        u.active, 
        u.created_at, 
        u.updated_at,
        CASE WHEN u.pin IS NOT NULL THEN 1 ELSE 0 END as has_pin,
        (SELECT COUNT(id) FROM shifts WHERE staff_id = u.id) as total_shifts,
        (SELECT MAX(opened_at) FROM shifts WHERE staff_id = u.id) as last_shift_at
      FROM users u
      ORDER BY 
        CASE u.role 
          WHEN '${ROLES.ADMIN}' THEN 1 
          WHEN '${ROLES.ADMIN_STAFF}' THEN 2 
          ELSE 3 
        END,
        u.name ASC
    `).all();
  }

  /**
   * Retrieves a single staff user by ID.
   */
  getStaffById(userId) {
    const db = this.db;
    const user = db.prepare(`
      SELECT 
        id, 
        name, 
        username, 
        role, 
        active, 
        created_at, 
        updated_at,
        CASE WHEN pin IS NOT NULL THEN 1 ELSE 0 END as has_pin
      FROM users 
      WHERE id = ?
    `).get(userId);

    if (!user) {
      throw new Error(`Staff account #${userId} not found`);
    }
    return user;
  }

  /**
   * Creates a new staff account.
   */
  createStaff({ name, username, password, pin, role }) {
    const db = this.db;

    if (!name || !name.trim()) {
      throw new Error('Full name is required');
    }
    const cleanUsername = (username || '').trim().toLowerCase();
    if (!cleanUsername) {
      throw new Error('Username is required');
    }
    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    const validRoles = [ROLES.STAFF, ROLES.ADMIN_STAFF, ROLES.ADMIN, ROLES.REMOTE_ADMIN];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be staff, admin_staff, admin, or remote_admin.`);
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (pin && !/^\d{4,6}$/.test(pin)) {
      throw new Error('PIN must be 4 to 6 numeric digits');
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(cleanUsername);
    if (existing) {
      throw new Error(`Username "${cleanUsername}" is already taken`);
    }

    const passwordHash = this.hash(password);
    const pinHash = pin ? this.hash(pin) : null;

    const info = db.prepare(`
      INSERT INTO users (name, username, pin, password_hash, role, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(name.trim(), cleanUsername, pinHash, passwordHash, role);

    logger.info(`Created staff account: ${cleanUsername} (ID ${info.lastInsertRowid}, Role: ${role})`);

    return this.getStaffById(info.lastInsertRowid);
  }

  /**
   * Updates general profile info (name, role, active status).
   */
  updateStaff(userId, { name, role, active }) {
    const db = this.db;
    const current = this.getStaffById(userId);

    if (name !== undefined && !name.trim()) {
      throw new Error('Name cannot be empty');
    }

    const newRole = role !== undefined ? role : current.role;
    const validRoles = [ROLES.STAFF, ROLES.ADMIN_STAFF, ROLES.ADMIN];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    const newActive = active !== undefined ? (active ? 1 : 0) : current.active;

    // Safety check: ensure at least one active administrator remains
    if (current.role === ROLES.ADMIN && (newRole !== ROLES.ADMIN || newActive === 0)) {
      const activeAdminCount = db.prepare(`
        SELECT COUNT(id) as count 
        FROM users 
        WHERE role = ? AND active = 1 AND id != ?
      `).get(ROLES.ADMIN, userId).count;

      if (activeAdminCount === 0) {
        throw new Error('Operation blocked: The system must retain at least one active Administrator');
      }
    }

    db.prepare(`
      UPDATE users 
      SET 
        name = COALESCE(?, name),
        role = ?,
        active = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(name ? name.trim() : null, newRole, newActive, userId);

    logger.info(`Updated staff account ID ${userId}`);
    return this.getStaffById(userId);
  }

  /**
   * Soft-deactivates a staff account.
   */
  deactivateStaff(userId) {
    return this.updateStaff(userId, { active: 0 });
  }

  /**
   * Reactivates a staff account.
   */
  reactivateStaff(userId) {
    return this.updateStaff(userId, { active: 1 });
  }

  /**
   * Resets the password for a staff account.
   */
  resetPassword(userId, newPassword) {
    const db = this.db;
    this.getStaffById(userId); // ensure user exists

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const hash = this.hash(newPassword);
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now', 'localtime') 
      WHERE id = ?
    `).run(hash, userId);

    logger.info(`Reset password for staff ID ${userId}`);
    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Sets or updates the quick login PIN for a staff member.
   */
  resetPin(userId, newPin) {
    const db = this.db;
    this.getStaffById(userId); // ensure user exists

    if (newPin !== null && newPin !== '' && !/^\d{4,6}$/.test(newPin)) {
      throw new Error('PIN must be 4 to 6 numeric digits');
    }

    const pinHash = (newPin && newPin.trim()) ? this.hash(newPin.trim()) : null;
    db.prepare(`
      UPDATE users 
      SET pin = ?, updated_at = datetime('now', 'localtime') 
      WHERE id = ?
    `).run(pinHash, userId);

    logger.info(`Updated PIN for staff ID ${userId}`);
    return { success: true, message: pinHash ? 'PIN updated successfully' : 'PIN cleared' };
  }
}

export const staffService = new StaffService();

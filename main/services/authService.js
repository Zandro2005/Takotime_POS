// main/services/authService.js
// Authentication & session management service with bcrypt password & PIN hashing

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { getDb } from '../db/db.js';
import { logger } from '../utils/logger.js';
import { hasPermission, PERMISSIONS } from '../../shared/permissions.js';
import { ROLES } from '../../shared/constants.js';

// In-memory active sessions: sessionId -> { user, openedAt, lastActivityAt }
const activeSessions = new Map();

export class AuthService {
  constructor() {
    this.saltRounds = 10;
  }

  hash(plainText) {
    return bcrypt.hashSync(plainText, this.saltRounds);
  }

  verify(plainText, hash) {
    if (!plainText || !hash) return false;
    return bcrypt.compareSync(plainText, hash);
  }

  createSession(user) {
    const sessionId = crypto.randomUUID();
    const session = {
      sessionId,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      openedAt: new Date(),
      lastActivityAt: new Date(),
    };
    activeSessions.set(sessionId, session);
    logger.info(`Session created for user: ${user.username} (${user.role}), sessionId: ${sessionId}`);
    return session;
  }

  touchSession(sessionId) {
    const session = activeSessions.get(sessionId);
    if (session) {
      session.lastActivityAt = new Date();
    }
  }

  getSession(sessionId) {
    if (!sessionId) return null;
    const session = activeSessions.get(sessionId);
    if (!session) return null;

    // Check session timeout against settings table
    const db = getDb();
    const timeoutRow = db.prepare("SELECT value FROM settings WHERE key = 'session_timeout_min'").get();
    const timeoutMin = timeoutRow ? parseInt(timeoutRow.value, 10) : 30;

    const idleMinutes = (Date.now() - new Date(session.lastActivityAt).getTime()) / (1000 * 60);
    if (idleMinutes > timeoutMin) {
      logger.info(`Session timed out for user ${session.user.username} after ${idleMinutes.toFixed(1)} mins idle.`);
      activeSessions.delete(sessionId);
      return null;
    }

    session.lastActivityAt = new Date();
    return session;
  }

  logout(sessionId) {
    if (sessionId && activeSessions.has(sessionId)) {
      const session = activeSessions.get(sessionId);
      logger.info(`User logged out: ${session?.user?.username}`);
      activeSessions.delete(sessionId);
    }
    return true;
  }

  login(username, password) {
    const db = getDb();
    const user = db.prepare(`
      SELECT id, name, username, password_hash, pin, role, active
      FROM users
      WHERE username = ? COLLATE NOCASE AND active = 1
    `).get(username);

    if (!user) {
      logger.warn(`Login failed: user not found or inactive (${username})`);
      throw new Error('Invalid username or password');
    }

    const passwordMatch = this.verify(password, user.password_hash);
    if (!passwordMatch) {
      logger.warn(`Login failed: incorrect password for user (${username})`);
      throw new Error('Invalid username or password');
    }

    return this.createSession(user);
  }

  loginWithPin(pin) {
    if (!pin) throw new Error('PIN is required');
    const db = getDb();
    const activeUsers = db.prepare(`
      SELECT id, name, username, pin, role, active
      FROM users
      WHERE active = 1 AND pin IS NOT NULL
    `).all();

    for (const user of activeUsers) {
      if (this.verify(pin, user.pin)) {
        logger.info(`PIN login successful for user: ${user.username} (${user.role})`);
        return this.createSession(user);
      }
    }

    logger.warn('PIN login failed: no active user matched this PIN');
    throw new Error('Invalid PIN');
  }

  checkUserPermission(userOrRole, permission) {
    const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
    if (!role) return false;
    return hasPermission(role, permission);
  }

  createUser(payload) {
    const db = getDb();
    const { name, username, password, pin, role } = payload;

    const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username);
    if (existing) {
      throw new Error(`Username "${username}" already exists`);
    }

    const passwordHash = this.hash(password);
    const pinHash = pin ? this.hash(pin) : null;

    const info = db.prepare(`
      INSERT INTO users (name, username, pin, password_hash, role, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(name, username, pinHash, passwordHash, role);

    logger.info(`Created new user: ${username} with ID ${info.lastInsertRowid} (${role})`);
    return {
      id: info.lastInsertRowid,
      name,
      username,
      role,
      active: 1,
    };
  }

  listUsers() {
    const db = getDb();
    return db.prepare(`
      SELECT id, name, username, role, active, created_at, updated_at
      FROM users
      ORDER BY role, name
    `).all();
  }

  deactivateUser(userId) {
    const db = getDb();
    db.prepare("UPDATE users SET active = 0, updated_at = datetime('now', 'localtime') WHERE id = ?").run(userId);
    logger.info(`Deactivated user with ID: ${userId}`);
    return true;
  }
}

export const authService = new AuthService();

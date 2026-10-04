// main/utils/ipcWrapper.js
// Wraps IPC handlers with automatic role/permission checks, logging, and error handling

import { ipcMain } from 'electron';
import { logger } from './logger.js';
import { authService } from '../services/authService.js';
import { CHANNEL_PERMISSIONS } from '../../shared/permissions.js';

/**
 * Registers an IPC handler with optional permission enforcement
 * @param {string} channel - The IPC channel name
 * @param {Function} handler - The handler function (payload, context) => Promise<any>
 * @param {string|null} requiredPermission - Permission key required (or null for public/auth)
 */
export function registerIpcHandler(channel, handler, requiredPermission = null) {
  const perm = requiredPermission !== null ? requiredPermission : CHANNEL_PERMISSIONS[channel];

  const PUBLIC_CHANNELS = [
    'auth:login',
    'auth:login_pin',
    'auth:logout',
    'auth:session',
    'system:ping'
  ];

  ipcMain.handle(channel, async (event, payload = {}) => {
    const startedAt = Date.now();
    const sessionId = payload?.sessionId || null;

    logger.debug(`IPC Call -> ${channel}`, { hasSession: !!sessionId });

    try {
      let session = null;
      const isPublic = PUBLIC_CHANNELS.includes(channel);

      // Validate session for all non-public channels, even if no specific permission is required
      if (!isPublic || perm) {
        if (!sessionId) {
          throw new Error('Authentication required');
        }

        session = authService.getSession(sessionId, !payload?.isPolling);
        if (!session) {
          throw new Error('Session expired or invalid');
        }

        // Check specific permission against user's role if one is required
        if (perm) {
          const allowed = authService.checkUserPermission(session.user.role, perm);
          if (!allowed) {
            logger.warn(`Permission denied on ${channel} for user ${session.user.username} (role: ${session.user.role}, required: ${perm})`);
            throw new Error('Forbidden: Insufficient permissions');
          }
        }
      } else if (sessionId) {
        session = authService.getSession(sessionId, !payload?.isPolling);
      }

      // Execute handler
      const result = await handler(payload, { session, event });
      const durationMs = Date.now() - startedAt;
      logger.debug(`IPC Success <- ${channel} (${durationMs}ms)`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      logger.error(`IPC Error on ${channel} (${durationMs}ms): ${error.message}`, {
        channel,
        error: error.message,
        stack: error.stack,
      });

      let userMessage = error.message || 'An unexpected error occurred';
      if (error.code && error.code.startsWith('SQLITE_')) {
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
          userMessage = 'Operation failed: This record is linked to other active records and cannot be modified or deleted.';
        } else if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          userMessage = 'Operation failed: A record with this value already exists.';
        } else {
          userMessage = 'A database error occurred while processing your request.';
        }
      }

      return {
        success: false,
        error: userMessage,
      };
    }
  });
}

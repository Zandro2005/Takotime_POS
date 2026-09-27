// main/ipc/authHandlers.js
// IPC handlers for authentication and session management

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { authService } from '../services/authService.js';
import { validateLoginPayload, validatePin } from '../../shared/validators.js';

export function registerAuthHandlers() {
  // Username & password login
  registerIpcHandler(IPC_CHANNELS.AUTH_LOGIN, async (payload) => {
    const val = validateLoginPayload(payload);
    if (!val.valid) throw new Error(val.message);

    return authService.login(payload.username.trim(), payload.password);
  }, null); // Public

  // Staff Fast-login with PIN
  registerIpcHandler(IPC_CHANNELS.AUTH_LOGIN_PIN, async (payload) => {
    const val = validatePin(payload?.pin);
    if (!val.valid) throw new Error(val.message);

    return authService.loginWithPin(payload.pin);
  }, null); // Public

  // Logout
  registerIpcHandler(IPC_CHANNELS.AUTH_LOGOUT, async (payload) => {
    return authService.logout(payload?.sessionId);
  }, null); // Session optional/cleared

  // Validate and get active session
  registerIpcHandler(IPC_CHANNELS.AUTH_GET_SESSION, async (payload) => {
    const session = authService.getSession(payload?.sessionId);
    if (!session) throw new Error('Session expired');
    return session;
  }, null);
}

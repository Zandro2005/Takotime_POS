// main/utils/paths.js
// Safe resolution of user data path across both Electron runtime and Node test runner

import path from 'node:path';

/**
 * Returns the application user data directory.
 * - If process.env.TAKOTIME_USER_DATA is set, uses that.
 * - If running inside Electron (process.versions.electron is defined), resolves the
 *   standard OS AppData / Application Support directory for 'takotime-pos'.
 * - Otherwise (Node test runner), falls back to path.join(process.cwd(), 'data').
 */
export function getUserDataPath() {
  if (process.env.TAKOTIME_USER_DATA) {
    return process.env.TAKOTIME_USER_DATA;
  }

  // Detect if running inside Electron runtime
  if (process.versions && process.versions.electron) {
    if (process.platform === 'win32') {
      const appData = process.env.APPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Roaming') : null);
      if (appData) {
        return path.join(appData, 'takotime-pos');
      }
    } else if (process.platform === 'darwin') {
      const home = process.env.HOME || '';
      return path.join(home, 'Library', 'Application Support', 'takotime-pos');
    } else {
      const configHome = process.env.XDG_CONFIG_HOME || (process.env.HOME ? path.join(process.env.HOME, '.config') : null);
      if (configHome) {
        return path.join(configHome, 'takotime-pos');
      }
    }
  }

  return path.join(process.cwd(), 'data');
}

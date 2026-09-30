// main/utils/paths.js
// Safe resolution of user data path across both Electron runtime and Node test runner

import path from 'node:path';
import { createRequire } from 'node:module';
import fs from 'node:fs';

function getElectronApp() {
  try {
    // In Electron's main process, require('electron') returns the real module with .app
    // In plain Node (tests), require('electron') returns a string path to the binary
    const require_ = createRequire(import.meta.url);
    const electron = require_('electron');
    
    // Debug: write diagnostics to a temp file to understand electron module shape
    const debugInfo = `typeof electron: ${typeof electron}\nisObject: ${typeof electron === 'object' && electron !== null}\nkeys: ${typeof electron === 'object' && electron !== null ? Object.keys(electron).join(',') : 'N/A'}\nhasApp: ${!!(typeof electron === 'object' && electron !== null && electron.app)}\nelectron value: ${String(electron).substring(0, 200)}\n`;
    try {
      fs.writeFileSync(path.join(process.env.APPDATA || 'C:\\Users\\ADMIN\\AppData\\Roaming', 'takotime-pos', 'paths-debug.txt'), debugInfo);
    } catch { /* ignore */ }

    if (typeof electron === 'object' && electron !== null && electron.app) {
      return electron.app;
    }
  } catch (err) {
    // Debug: log error
    try {
      fs.writeFileSync(path.join(process.env.APPDATA || 'C:\\Users\\ADMIN\\AppData\\Roaming', 'takotime-pos', 'paths-error.txt'), String(err));
    } catch { /* ignore */ }
  }
  return null;
}

export function getUserDataPath() {
  const app = getElectronApp();
  if (app && typeof app.getPath === 'function') {
    return app.getPath('userData');
  }
  return process.env.TAKOTIME_USER_DATA || path.join(process.cwd(), 'data');
}

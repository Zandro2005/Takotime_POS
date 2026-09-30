// main/utils/initEnv.js
// Runs before all other main process modules to initialize environment configuration
import { app } from 'electron';

if (app && typeof app.getPath === 'function') {
  try {
    process.env.TAKOTIME_USER_DATA = app.getPath('userData');
  } catch (_) {
    // Handled by paths.js fallback
  }
}

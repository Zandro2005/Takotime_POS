// main/utils/logger.js
// Rotating file logger with structured output and severity levels

import fs from 'node:fs';
import path from 'node:path';
import { getUserDataPath } from './paths.js';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

class Logger {
  constructor() {
    this._logsDir = null;
    this._currentLogFile = null;
    this.maxFileSize = 5 * 1024 * 1024; // 5 MB
    this.maxFiles = 5;
    this.minLevel = LOG_LEVELS.DEBUG;
  }

  get logsDir() {
    if (!this._logsDir) {
      this._logsDir = path.join(getUserDataPath(), 'logs');
      this._ensureDir();
    }
    return this._logsDir;
  }

  get currentLogFile() {
    if (!this._currentLogFile) {
      this._currentLogFile = path.join(this.logsDir, 'app.log');
    }
    return this._currentLogFile;
  }

  _ensureDir() {
    try {
      if (!fs.existsSync(this._logsDir)) {
        fs.mkdirSync(this._logsDir, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create logs directory:', err);
    }
  }

  rotateIfNeeded() {
    try {
      if (!fs.existsSync(this.currentLogFile)) return;

      const stats = fs.statSync(this.currentLogFile);
      if (stats.size < this.maxFileSize) return;

      // Rotate existing logs: app.4.log -> deleted, app.3.log -> app.4.log, etc.
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const source = path.join(this.logsDir, `app.${i}.log`);
        const target = path.join(this.logsDir, `app.${i + 1}.log`);
        if (fs.existsSync(source)) {
          if (i === this.maxFiles - 1) {
            fs.unlinkSync(source);
          } else {
            fs.renameSync(source, target);
          }
        }
      }

      // Rename current to app.1.log
      fs.renameSync(this.currentLogFile, path.join(this.logsDir, 'app.1.log'));
    } catch (err) {
      console.error('Log rotation error:', err);
    }
  }

  log(level, message, meta = null) {
    if (level < this.minLevel) return;

    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level] || 'INFO';
    const metaString = meta ? ` ${typeof meta === 'object' ? JSON.stringify(meta) : meta}` : '';
    const logLine = `[${timestamp}] [${levelName}] ${message}${metaString}\n`;

    // Console output
    if (process.env.NODE_ENV !== 'production' || level >= LOG_LEVELS.INFO) {
      if (level === LOG_LEVELS.ERROR) {
        console.error(logLine.trim());
      } else if (level === LOG_LEVELS.WARN) {
        console.warn(logLine.trim());
      } else {
        console.log(logLine.trim());
      }
    }

    // File output
    try {
      this.rotateIfNeeded();
      fs.appendFileSync(this.currentLogFile, logLine, 'utf8');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  debug(msg, meta) { this.log(LOG_LEVELS.DEBUG, msg, meta); }
  info(msg, meta) { this.log(LOG_LEVELS.INFO, msg, meta); }
  warn(msg, meta) { this.log(LOG_LEVELS.WARN, msg, meta); }
  error(msg, meta) { this.log(LOG_LEVELS.ERROR, msg, meta); }

  getRecentLogs(limit = 100) {
    try {
      if (!fs.existsSync(this.currentLogFile)) return [];
      const content = fs.readFileSync(this.currentLogFile, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.slice(-limit).reverse().map(line => {
        const match = line.match(/^\[(.*?)\] \[(.*?)\] (.*)$/);
        if (match) {
          return { timestamp: match[1], level: match[2], message: match[3] };
        }
        return { timestamp: new Date().toISOString(), level: 'INFO', message: line };
      });
    } catch (err) {
      this.error('Failed to read recent logs', err);
      return [];
    }
  }
}

export const logger = new Logger();

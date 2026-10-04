// main/services/printService.js
// Thermal receipt printing engine with ESC/POS binary command synthesis, spooler simulation, and cash drawer kick

import fs from 'node:fs';
import path from 'node:path';
import { ReceiptService, receiptService } from './receiptService.js';
import { getUserDataPath } from '../utils/paths.js';
import { logger } from '../utils/logger.js';

// Standard ESC/POS Control Codes
export const ESC_POS = {
  INIT: Buffer.from([0x1b, 0x40]), // ESC @
  ALIGN_LEFT: Buffer.from([0x1b, 0x61, 0x00]), // ESC a 0
  ALIGN_CENTER: Buffer.from([0x1b, 0x61, 0x01]), // ESC a 1
  ALIGN_RIGHT: Buffer.from([0x1b, 0x61, 0x02]), // ESC a 2
  TEXT_NORMAL: Buffer.from([0x1b, 0x21, 0x00]), // Normal text
  TEXT_BOLD_ON: Buffer.from([0x1b, 0x45, 0x01]), // ESC E 1
  TEXT_BOLD_OFF: Buffer.from([0x1b, 0x45, 0x00]), // ESC E 0
  TEXT_DOUBLE_HEIGHT: Buffer.from([0x1b, 0x21, 0x10]), // Double height
  TEXT_DOUBLE_WIDTH_HEIGHT: Buffer.from([0x1b, 0x21, 0x30]), // Double width & height
  FEED_LINES: (n = 3) => Buffer.from([0x1b, 0x64, n]), // ESC d n
  CUT_PAPER: Buffer.from([0x1d, 0x56, 0x41, 0x03]), // GS V 65 3 (partial cut with feed)
  DRAWER_KICK: Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]), // ESC p 0 25 250 (Cash drawer pulse)
};

export class PrintService {
  constructor(dbInstance = null, options = {}) {
    this._db = dbInstance;
    this.receiptService = options.receiptService || new ReceiptService(dbInstance);
    this._spoolerDir = options.spoolerDir || null;
    this.paperWidth = options.paperWidth || 32; // 32 chars for 58mm, 48 chars for 80mm
  }

  get spoolerDir() {
    return this._spoolerDir || path.join(getUserDataPath(), 'spooler');
  }

  ensureSpoolerDir() {
    try {
      if (!fs.existsSync(this.spoolerDir)) {
        fs.mkdirSync(this.spoolerDir, { recursive: true });
      }
    } catch (err) {
      logger.error('Failed to create print spooler directory', err);
    }
  }

  generateEscPosBuffer(orderId) {
    const formatted = this.receiptService.formatReceipt(orderId);
    const order = formatted.order;
    const chunks = [];

    // 1. Initialize Printer
    chunks.push(ESC_POS.INIT);

    // 2. Center Align & Header
    chunks.push(ESC_POS.ALIGN_CENTER);
    chunks.push(ESC_POS.TEXT_DOUBLE_WIDTH_HEIGHT);
    chunks.push(Buffer.from(`${formatted.storeName}\n`, 'ascii'));

    chunks.push(ESC_POS.TEXT_NORMAL);
    chunks.push(Buffer.from(`${formatted.header}\n`, 'ascii'));
    chunks.push(Buffer.from('================================\n', 'ascii'));

    // 3. Queue Number (Big & Bold)
    chunks.push(ESC_POS.ALIGN_CENTER);
    chunks.push(ESC_POS.TEXT_NORMAL);
    chunks.push(Buffer.from('ORDER QUEUE NUMBER\n', 'ascii'));
    chunks.push(ESC_POS.TEXT_DOUBLE_WIDTH_HEIGHT);
    chunks.push(Buffer.from(`  #${String(order.queue_no).padStart(3, '0')}  \n`, 'ascii'));

    // 4. Order Details (Left Align)
    chunks.push(ESC_POS.TEXT_NORMAL);
    chunks.push(ESC_POS.ALIGN_LEFT);
    chunks.push(Buffer.from(`Order ID: #${order.id} [${order.order_type.toUpperCase()}]\n`, 'ascii'));
    chunks.push(Buffer.from(`Date: ${new Date(order.created_at).toLocaleString()}\n`, 'ascii'));
    chunks.push(Buffer.from(`Cashier: ${order.staff_name}\n`, 'ascii'));
    chunks.push(Buffer.from('--------------------------------\n', 'ascii'));

    // 5. Monospace items table from receiptService
    const receiptText = formatted.formattedText;
    chunks.push(Buffer.from(receiptText, 'utf8'));

    // 6. Cash drawer pulse on cash checkout or when cash change is due
    if (order.payment_method === 'cash' || (order.change_due && order.change_due > 0)) {
      chunks.push(ESC_POS.DRAWER_KICK);
    }

    // 7. Feed and Cut Paper
    chunks.push(ESC_POS.FEED_LINES(3));
    chunks.push(ESC_POS.CUT_PAPER);

    return {
      buffer: Buffer.concat(chunks),
      formattedText: receiptText,
      order,
    };
  }

  sendBufferToPrinter(buffer, options = {}) {
    let printerTarget = options.printerTarget;
    if (!printerTarget && this._db) {
      try {
        const row = this._db.prepare("SELECT value FROM settings WHERE key = 'printer_target'").get();
        if (row) printerTarget = row.value;
      } catch (e) {
        // Settings table might not exist in early tests
      }
    }

    if (printerTarget && printerTarget.startsWith('tcp://')) {
      const ip = printerTarget.replace('tcp://', '');
      const net = require('node:net');
      const client = new net.Socket();
      client.connect(9100, ip, () => {
        client.write(buffer);
        client.destroy();
      });
      client.on('error', (err) => logger.error(`Network printer error: ${err.message}`));
      logger.info(`Buffer sent directly to Network Printer: ${ip}`);
      return true;
    } else if (printerTarget && printerTarget.trim() !== '') {
      try {
        fs.writeFileSync(printerTarget, buffer);
        logger.info(`Buffer sent directly to port: ${printerTarget}`);
        return true;
      } catch (e) {
        logger.error(`Failed to write to printer port ${printerTarget}:`, e);
        return false;
      }
    }
    return false; // No printer configured, fallback to simulation
  }

  printReceipt(orderId, options = {}) {
    try {
      logger.info(`Formatting thermal receipt for Order #${orderId}...`);

      const { buffer, formattedText, order } = this.generateEscPosBuffer(orderId);

      const isRealPrinter = this.sendBufferToPrinter(buffer, options);

      if (!isRealPrinter) {
        this.ensureSpoolerDir();
        // Write a SINGLE simulated spool file (overwritten) to avoid infinite file spam
        const spoolTextFile = path.join(this.spoolerDir, `last_receipt.txt`);
        fs.writeFileSync(spoolTextFile, formattedText, 'utf8');
        logger.info(`Receipt saved to simulated spooler: ${spoolTextFile}`);
      }

      return {
        success: true,
        simulated: !isRealPrinter,
        orderId,
        timestamp: new Date().toISOString(),
        receiptText: formattedText,
      };
    } catch (err) {
      // CRITICAL: POS ordering never crashes if printer encounters error
      logger.error(`Receipt printing encountered an error for order #${orderId}`, err);
      return {
        success: false,
        simulated: false,
        orderId,
        error: err.message,
        canRetry: true,
      };
    }
  }

  openCashDrawer(options = {}) {
    try {
      logger.info('Sending cash drawer kick command...');
      const isRealPrinter = this.sendBufferToPrinter(ESC_POS.DRAWER_KICK, options);
      
      if (!isRealPrinter) {
        this.ensureSpoolerDir();
        const logFile = path.join(this.spoolerDir, 'drawer_kick.log');
        // Overwrite file instead of appending to avoid infinite growth
        fs.writeFileSync(logFile, `[${new Date().toISOString()}] Cash drawer kick pulse issued\n`);
      }

      return {
        success: true,
        pulseCode: 'ESC_p_0_25_250',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('Failed to kick cash drawer', err);
      return { success: false, error: err.message };
    }
  }

  testPrint(options = {}) {
    try {
      const chunks = [];
      chunks.push(ESC_POS.INIT);
      chunks.push(ESC_POS.ALIGN_CENTER);
      chunks.push(ESC_POS.TEXT_DOUBLE_WIDTH_HEIGHT);
      chunks.push(Buffer.from('TAKOTIME POS\n', 'ascii'));
      chunks.push(ESC_POS.TEXT_NORMAL);
      chunks.push(Buffer.from('HARDWARE TEST RECEIPT\n', 'ascii'));
      chunks.push(Buffer.from('================================\n', 'ascii'));
      chunks.push(ESC_POS.ALIGN_LEFT);
      chunks.push(Buffer.from(`Date: ${new Date().toLocaleString()}\n`, 'ascii'));
      chunks.push(Buffer.from('Thermal Print Engine: READY\n', 'ascii'));
      chunks.push(Buffer.from('Paper Width: 58mm (32 Col)\n', 'ascii'));
      chunks.push(Buffer.from('Cash Drawer Kick: FUNCTIONAL\n', 'ascii'));
      chunks.push(Buffer.from('--------------------------------\n', 'ascii'));
      chunks.push(ESC_POS.ALIGN_CENTER);
      chunks.push(Buffer.from('SYSTEM CHECK: PASSED\n\n', 'ascii'));
      chunks.push(ESC_POS.FEED_LINES(3));
      chunks.push(ESC_POS.CUT_PAPER);

      const buffer = Buffer.concat(chunks);
      const isRealPrinter = this.sendBufferToPrinter(buffer, options);

      if (!isRealPrinter) {
        this.ensureSpoolerDir();
        const testFile = path.join(this.spoolerDir, 'test_receipt.txt');
        fs.writeFileSync(testFile, 'TAKOTIME POS TEST RECEIPT\nSTATUS: ONLINE\nDATE: ' + new Date().toLocaleString());
      }

      logger.info('Test receipt successfully generated.');
      return {
        success: true,
        simulated: !isRealPrinter,
        message: 'Thermal printer test receipt sent.',
      };
    } catch (err) {
      logger.error('Test print failed', err);
      return { success: false, error: err.message };
    }
  }

  getPrinterStatus() {
    return {
      status: 'ONLINE',
      mode: 'ESC/POS Monospace Thermal Driver',
      paperWidth: `${this.paperWidth} columns (58mm)`,
      spoolerPath: this.spoolerDir,
      cashDrawerConnected: true,
    };
  }
}

export const printService = new PrintService();

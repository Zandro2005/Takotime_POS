// main/services/receiptService.js
// Receipt formatting and monospace print text generation

import { getDb } from '../db/db.js';
import { orderService } from './orderService.js';

import { OrderService } from './orderService.js';

export class ReceiptService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
  }

  get db() {
    return this._db || getDb();
  }

  formatReceipt(orderId) {
    const db = this.db;
    const os = new OrderService(db);
    const order = os.getOrder(orderId);
    if (!order) throw new Error(`Order #${orderId} not found`);

    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    const settings = settingsRows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    const storeName = settings.store_name || 'TAKOTIME';
    const header = settings.receipt_header || 'TAKOTIME\nMontalban Branch';
    const footer = settings.receipt_footer || 'Thank you! Come again!';
    const currency = settings.currency_symbol || '₱';

    // Build formatted monospace plain text receipt
    const width = 32;
    const divider = '-'.repeat(width);
    const doubleDivider = '='.repeat(width);

    const pad = (str, len) => str.padEnd(len, ' ');
    const padRight = (str, len) => str.padStart(len, ' ');

    const lines = [];
    lines.push(storeName.toUpperCase().padStart((width + storeName.length) / 2, ' '));
    lines.push(header);
    lines.push(doubleDivider);

    lines.push(`QUEUE #: ${String(order.queue_no).padStart(3, '0')}`);
    lines.push(`Order ID: #${order.id}  [${order.order_type.toUpperCase().replace('_', '-')}]`);
    lines.push(`Date: ${new Date(order.created_at).toLocaleString()}`);
    lines.push(`Cashier: ${order.staff_name}`);
    lines.push(divider);

    lines.push(`${pad('ITEM', 18)}${pad('QTY', 5)}${padRight('TOTAL', 9)}`);
    lines.push(divider);

    for (const item of order.items) {
      const itemTitle = `${item.product_name} (${item.variant_label})`;
      lines.push(itemTitle);
      lines.push(`${pad('', 18)}${pad(String(item.qty), 5)}${padRight(`${currency}${item.subtotal.toFixed(2)}`, 9)}`);

      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          const modText = ` + ${mod.name}`;
          const modDelta = mod.price_delta > 0 ? `+${currency}${mod.price_delta.toFixed(2)}` : 'FREE';
          lines.push(`${pad(modText, 23)}${padRight(modDelta, 9)}`);
        }
      }
    }

    lines.push(divider);
    lines.push(`${pad('SUBTOTAL:', 20)}${padRight(`${currency}${order.subtotal.toFixed(2)}`, 12)}`);

    if (order.discount > 0) {
      const discLabel = `DISCOUNT (${(order.discount_type || 'PROMO').toUpperCase()}):`;
      lines.push(`${pad(discLabel, 20)}${padRight(`-${currency}${order.discount.toFixed(2)}`, 12)}`);
    }

    lines.push(doubleDivider);
    lines.push(`${pad('TOTAL DUE:', 18)}${padRight(`${currency}${order.total.toFixed(2)}`, 14)}`);
    lines.push(doubleDivider);

    lines.push(`Payment: ${order.payment_method.toUpperCase()}`);
    if (order.payment_method === 'cash') {
      lines.push(`${pad('Amount Tendered:', 20)}${padRight(`${currency}${(order.amount_tendered || 0).toFixed(2)}`, 12)}`);
      lines.push(`${pad('Change Due:', 20)}${padRight(`${currency}${(order.change_due || 0).toFixed(2)}`, 12)}`);
    } else if (order.payment_method === 'gcash') {
      lines.push(`GCash Ref #: ${order.gcash_ref_no || 'N/A'}`);
    }

    lines.push(divider);
    lines.push(footer);
    lines.push('\n');

    return {
      order,
      storeName,
      header,
      footer,
      formattedText: lines.join('\n'),
    };
  }
}

export const receiptService = new ReceiptService();

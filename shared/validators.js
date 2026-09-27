// shared/validators.js
// Shared input validation routines

import { ORDER_TYPES, PAYMENT_METHODS, DISCOUNT_TYPES, CASH_MOVEMENT_TYPES, ROLES } from './constants.js';

export function validatePin(pin) {
  if (!pin || typeof pin !== 'string') return { valid: false, message: 'PIN must be a string' };
  if (!/^\d{4,6}$/.test(pin)) return { valid: false, message: 'PIN must be 4 to 6 digits' };
  return { valid: true };
}

export function validateLoginPayload(payload) {
  if (!payload || typeof payload !== 'object') return { valid: false, message: 'Invalid payload' };
  if (!payload.username?.trim()) return { valid: false, message: 'Username is required' };
  if (!payload.password) return { valid: false, message: 'Password is required' };
  return { valid: true };
}

export function validateOrderPayload(order) {
  if (!order || typeof order !== 'object') return { valid: false, message: 'Order data required' };
  if (!order.shiftId) return { valid: false, message: 'Shift ID is required' };
  if (!order.staffId) return { valid: false, message: 'Staff ID is required' };
  
  if (!Object.values(ORDER_TYPES).includes(order.orderType)) {
    return { valid: false, message: `Invalid order type: ${order.orderType}` };
  }

  if (!Object.values(PAYMENT_METHODS).includes(order.paymentMethod)) {
    return { valid: false, message: `Invalid payment method: ${order.paymentMethod}` };
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    return { valid: false, message: 'Order must contain at least one item' };
  }

  for (const item of order.items) {
    if (!item.variantId) return { valid: false, message: 'Item variant ID required' };
    if (!item.qty || item.qty < 1) return { valid: false, message: 'Item qty must be at least 1' };
  }

  if (order.discount > 0 && order.discountType) {
    if (!Object.values(DISCOUNT_TYPES).includes(order.discountType)) {
      return { valid: false, message: `Invalid discount type: ${order.discountType}` };
    }
  }

  if (order.paymentMethod === PAYMENT_METHODS.CASH) {
    if (order.amountTendered !== undefined && order.amountTendered < order.total) {
      return { valid: false, message: 'Amount tendered is less than order total' };
    }
  }

  return { valid: true };
}

export function validateCashMovement(payload) {
  if (!payload || typeof payload !== 'object') return { valid: false, message: 'Payload required' };
  if (!payload.shiftId) return { valid: false, message: 'Shift ID required' };
  if (!Object.values(CASH_MOVEMENT_TYPES).includes(payload.type)) {
    return { valid: false, message: `Invalid cash movement type: ${payload.type}` };
  }
  if (typeof payload.amount !== 'number' || payload.amount <= 0) {
    return { valid: false, message: 'Amount must be greater than zero' };
  }
  return { valid: true };
}

export function validateUserCreate(payload) {
  if (!payload || typeof payload !== 'object') return { valid: false, message: 'Payload required' };
  if (!payload.name?.trim()) return { valid: false, message: 'Name is required' };
  if (!payload.username?.trim()) return { valid: false, message: 'Username is required' };
  if (!payload.password || payload.password.length < 4) {
    return { valid: false, message: 'Password must be at least 4 characters' };
  }
  if (!Object.values(ROLES).includes(payload.role)) {
    return { valid: false, message: `Invalid role: ${payload.role}` };
  }
  if (payload.pin) {
    const pinCheck = validatePin(payload.pin);
    if (!pinCheck.valid) return pinCheck;
  }
  return { valid: true };
}

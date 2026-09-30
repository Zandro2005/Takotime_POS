// shared/validators.js
// Shared input validation routines using Zod

import { z } from 'zod';
import { ORDER_TYPES, PAYMENT_METHODS, DISCOUNT_TYPES, CASH_MOVEMENT_TYPES, ROLES } from './constants.js';

// Schemas
const pinSchema = z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits');

const loginPayloadSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const orderItemSchema = z.object({
  variantId: z.number().int().positive('Item variant ID required'),
  qty: z.number().int().min(1, 'Item qty must be at least 1'),
});

const orderPayloadSchema = z.object({
  shiftId: z.number().int().positive('Shift ID is required'),
  staffId: z.number().int().positive('Staff ID is required'),
  orderType: z.enum(Object.values(ORDER_TYPES), { invalid_type_error: 'Invalid order type' }),
  paymentMethod: z.enum(Object.values(PAYMENT_METHODS), { invalid_type_error: 'Invalid payment method' }),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  discount: z.number().min(0).optional(),
  discountType: z.enum(Object.values(DISCOUNT_TYPES)).optional(),
  total: z.number().min(0),
  amountTendered: z.number().min(0).optional(),
}).refine(data => {
  if (data.paymentMethod === PAYMENT_METHODS.CASH && data.amountTendered !== undefined) {
    return data.amountTendered >= data.total;
  }
  return true;
}, { message: 'Amount tendered is less than order total' });

const cashMovementSchema = z.object({
  shiftId: z.number().int().positive('Shift ID required'),
  type: z.enum(Object.values(CASH_MOVEMENT_TYPES), { invalid_type_error: 'Invalid cash movement type' }),
  amount: z.number().positive('Amount must be greater than zero'),
});

const userCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(Object.values(ROLES), { invalid_type_error: 'Invalid role' }),
  pin: pinSchema.optional().nullable(),
});

// Wrapper to match previous API
function validateWithZod(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, message: result.error.errors[0].message };
}

export function validatePin(pin) {
  return validateWithZod(pinSchema, pin);
}

export function validateLoginPayload(payload) {
  return validateWithZod(loginPayloadSchema, payload);
}

export function validateOrderPayload(order) {
  return validateWithZod(orderPayloadSchema, order);
}

export function validateCashMovement(payload) {
  return validateWithZod(cashMovementSchema, payload);
}

export function validateUserCreate(payload) {
  return validateWithZod(userCreateSchema, payload);
}

// shared/constants.js
// Single source of truth for enums, keys, and IPC channels

export const ROLES = {
  STAFF: 'staff',
  ADMIN_STAFF: 'admin_staff',
  ADMIN: 'admin',
};

export const ORDER_TYPES = {
  DINE_IN: 'dine_in',
  TAKEOUT: 'takeout',
};

export const ORDER_STATUS = {
  COMPLETED: 'completed',
  VOIDED: 'voided',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  GCASH: 'gcash',
};

export const SHIFT_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  FORCE_CLOSED: 'force_closed',
};

export const DISCOUNT_TYPES = {
  SENIOR: 'senior',
  PWD: 'pwd',
  PROMO: 'promo',
  MANUAL: 'manual',
};

export const CASH_MOVEMENT_TYPES = {
  CASH_IN: 'cash_in',
  CASH_OUT: 'cash_out',
  CASH_DROP: 'cash_drop',
};

export const IPC_CHANNELS = {
  // Auth
  AUTH_LOGIN: 'pos:auth:login',
  AUTH_LOGIN_PIN: 'pos:auth:login-pin',
  AUTH_LOGOUT: 'pos:auth:logout',
  AUTH_GET_SESSION: 'pos:auth:session',
  AUTH_CHANGE_PASSWORD: 'pos:auth:change-password',

  // Shifts
  SHIFTS_OPEN: 'pos:shifts:open',
  SHIFTS_CLOSE: 'pos:shifts:close',
  SHIFTS_CURRENT: 'pos:shifts:current',
  SHIFTS_FORCE_CLOSE: 'pos:shifts:force-close',

  // Orders
  ORDERS_CREATE: 'pos:orders:create',
  ORDERS_VOID: 'pos:orders:void',
  ORDERS_LIST: 'pos:orders:list',
  ORDERS_GET: 'pos:orders:get',
  ORDERS_RECENT: 'pos:orders:recent',

  // Menu
  MENU_CATEGORIES: 'pos:menu:categories',
  MENU_PRODUCTS: 'pos:menu:products',
  MENU_VARIANTS: 'pos:menu:variants',
  MENU_MODIFIERS: 'pos:menu:modifiers',
  MENU_CATALOG: 'pos:menu:catalog',

  // Menu Admin
  MENU_ADMIN_CREATE_PRODUCT: 'pos:menu-admin:create-product',
  MENU_ADMIN_UPDATE_PRODUCT: 'pos:menu-admin:update-product',
  MENU_ADMIN_CREATE_VARIANT: 'pos:menu-admin:create-variant',
  MENU_ADMIN_UPDATE_VARIANT: 'pos:menu-admin:update-variant',
  MENU_ADMIN_MANAGE_MODIFIERS: 'pos:menu-admin:manage-modifiers',
  MENU_ADMIN_REORDER: 'pos:menu-admin:reorder',
  MENU_ADMIN_TOGGLE_ACTIVE: 'pos:menu-admin:toggle-active',

  // Recipes
  RECIPES_GET: 'pos:recipes:get',
  RECIPES_UPDATE: 'pos:recipes:update',

  // Inventory
  INVENTORY_ITEMS: 'pos:inventory:items',
  INVENTORY_LOG: 'pos:inventory:log',
  INVENTORY_UPDATE_LOG: 'pos:inventory:update-log',
  INVENTORY_CONFIRM: 'pos:inventory:confirm',
  INVENTORY_SAVE_ITEM: 'pos:inventory:save-item',

  // Reports
  REPORTS_DAILY_SALES: 'pos:reports:daily-sales',
  REPORTS_SHIFT_SUMMARY: 'pos:reports:shift-summary',
  REPORTS_PRODUCT_MIX: 'pos:reports:product-mix',
  REPORTS_INVENTORY: 'pos:reports:inventory',
  REPORTS_WASTE: 'pos:reports:waste',
  REPORTS_EXPORT_CSV: 'pos:reports:export-csv',

  // Staff Management
  STAFF_LIST: 'pos:staff:list',
  STAFF_CREATE: 'pos:staff:create',
  STAFF_UPDATE: 'pos:staff:update',
  STAFF_DEACTIVATE: 'pos:staff:deactivate',
  STAFF_RESET_PASSWORD: 'pos:staff:reset-password',

  // Settings
  SETTINGS_GET_ALL: 'pos:settings:get-all',
  SETTINGS_UPDATE: 'pos:settings:update',

  // Cash Management
  CASH_RECORD_MOVEMENT: 'pos:cash:record-movement',
  CASH_LIST_MOVEMENTS: 'pos:cash:list-movements',

  // Backups
  BACKUP_RUN_NOW: 'pos:backup:run-now',
  BACKUP_LIST: 'pos:backup:list',
  BACKUP_STATUS: 'pos:backup:status',

  // Sync
  SYNC_STATUS: 'pos:sync:status',
  SYNC_TRIGGER: 'pos:sync:trigger',
  SYNC_LOG: 'pos:sync:log',

  // Health
  HEALTH_CHECK: 'pos:health:check',
  HEALTH_DB_INTEGRITY: 'pos:health:db-integrity',
  HEALTH_STATUS: 'pos:health:status',

  // Printing
  PRINT_RECEIPT: 'pos:print:receipt',
  PRINT_TEST: 'pos:print:test',
};

// shared/constants.js
// Single source of truth for enums, keys, and IPC channels

export const ROLES = {
  STAFF: 'staff',
  ADMIN_STAFF: 'admin_staff',
  ADMIN: 'admin',
  REMOTE_ADMIN: 'remote_admin',
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
  CASHLESS: 'cashless',
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
  MENU_ADMIN_CREATE_CATEGORY: 'pos:menu-admin:create-category',
  MENU_ADMIN_UPDATE_CATEGORY: 'pos:menu-admin:update-category',
  MENU_ADMIN_CREATE_PRODUCT: 'pos:menu-admin:create-product',
  MENU_ADMIN_UPDATE_PRODUCT: 'pos:menu-admin:update-product',
  MENU_ADMIN_CREATE_VARIANT: 'pos:menu-admin:create-variant',
  MENU_ADMIN_UPDATE_VARIANT: 'pos:menu-admin:update-variant',
  MENU_ADMIN_DELETE_VARIANT: 'pos:menu-admin:delete-variant',
  MENU_ADMIN_CREATE_MODIFIER: 'pos:menu-admin:create-modifier',
  MENU_ADMIN_UPDATE_MODIFIER: 'pos:menu-admin:update-modifier',
  MENU_ADMIN_DELETE_MODIFIER: 'pos:menu-admin:delete-modifier',
  MENU_ADMIN_ALL_MODIFIERS: 'pos:menu-admin:all-modifiers',
  MENU_ADMIN_MANAGE_MODIFIERS: 'pos:menu-admin:manage-modifiers',
  MENU_ADMIN_CLEAR_MODIFIERS: 'pos:menu-admin:clear-modifiers',
  MENU_ADMIN_REORDER: 'pos:menu-admin:reorder',
  MENU_ADMIN_TOGGLE_ACTIVE: 'pos:menu-admin:toggle-active',

  // Recipes
  RECIPES_GET: 'pos:recipes:get',
  RECIPES_UPDATE: 'pos:recipes:update',
  RECIPES_COVERAGE: 'pos:recipes:coverage',

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
  STAFF_REACTIVATE: 'pos:staff:reactivate',
  STAFF_RESET_PASSWORD: 'pos:staff:reset-password',
  STAFF_RESET_PIN: 'pos:staff:reset-pin',

  // Settings
  SETTINGS_GET_ALL: 'pos:settings:get-all',
  SETTINGS_UPDATE: 'pos:settings:update',

  // Dashboard
  DASHBOARD_OVERVIEW: 'pos:dashboard:overview',
  DASHBOARD_TREND: 'pos:dashboard:trend',

  // Cash Management
  CASH_RECORD_MOVEMENT: 'pos:cash:record-movement',
  CASH_LIST_MOVEMENTS: 'pos:cash:list-movements',

  // Backups
  BACKUP_RUN_NOW: 'pos:backup:run-now',
  BACKUP_LIST: 'pos:backup:list',
  BACKUP_STATUS: 'pos:backup:status',
  BACKUP_VERIFY: 'pos:backup:verify',
  BACKUP_PRUNE: 'pos:backup:prune',

  // Sync
  SYNC_STATUS: 'pos:sync:status',
  SYNC_TRIGGER: 'pos:sync:trigger',
  SYNC_LOG: 'pos:sync:log',

  // Health & Recovery
  HEALTH_CHECK: 'pos:health:check',
  HEALTH_DB_INTEGRITY: 'pos:health:db-integrity',
  HEALTH_STATUS: 'pos:health:status',
  HEALTH_STALE_SHIFTS: 'pos:health:stale-shifts',
  HEALTH_FORCE_CLOSE: 'pos:health:force-close-shift',

  // Printing & Hardware
  PRINT_RECEIPT: 'pos:print:receipt',
  PRINT_TEST: 'pos:print:test',
  PRINT_DRAWER: 'pos:print:drawer',
  PRINT_STATUS: 'pos:print:status',

  // Diagnostic Logs
  LOGS_RECENT: 'pos:logs:recent',
};


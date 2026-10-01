// main/preload.js
// Secure ContextBridge exposing namespaced IPC to renderer

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (username, password) => ipcRenderer.invoke('pos:auth:login', { username, password }),
    loginWithPin: (pin) => ipcRenderer.invoke('pos:auth:login-pin', { pin }),
    logout: (sessionId) => ipcRenderer.invoke('pos:auth:logout', { sessionId }),
    getSession: (sessionId) => ipcRenderer.invoke('pos:auth:session', { sessionId }),
  },

  shifts: {
    getCurrent: (sessionId) => ipcRenderer.invoke('pos:shifts:current', { sessionId }),
    open: (sessionId, startingCash, notes) => ipcRenderer.invoke('pos:shifts:open', { sessionId, startingCash, notes }),
    close: (sessionId, shiftId, endingCash, notes) => ipcRenderer.invoke('pos:shifts:close', { sessionId, shiftId, endingCash, notes }),
    forceClose: (sessionId) => ipcRenderer.invoke('pos:shifts:force-close', { sessionId }),
  },

  cash: {
    recordMovement: (sessionId, shiftId, type, amount, reason) =>
      ipcRenderer.invoke('pos:cash:record-movement', { sessionId, shiftId, type, amount, reason }),
    listMovements: (sessionId, shiftId) =>
      ipcRenderer.invoke('pos:cash:list-movements', { sessionId, shiftId }),
  },

  menu: {
    getCatalog: (sessionId) => ipcRenderer.invoke('pos:menu:catalog', { sessionId }),
    getCategories: (sessionId) => ipcRenderer.invoke('pos:menu:categories', { sessionId }),
    getProducts: (sessionId, categoryId) => ipcRenderer.invoke('pos:menu:products', { sessionId, categoryId }),
    getVariants: (sessionId, productId) => ipcRenderer.invoke('pos:menu:variants', { sessionId, productId }),
    getModifiers: (sessionId, productId) => ipcRenderer.invoke('pos:menu:modifiers', { sessionId, productId }),
  },

  menuAdmin: {
    createCategory: (sessionId, data) => ipcRenderer.invoke('pos:menu-admin:create-category', { sessionId, ...data }),
    updateCategory: (sessionId, data) => ipcRenderer.invoke('pos:menu-admin:update-category', { sessionId, ...data }),
    deleteCategory: (sessionId, id) => ipcRenderer.invoke('pos:menu-admin:delete-category', { sessionId, id }),
    createProduct: (sessionId, data) => ipcRenderer.invoke('pos:menu-admin:create-product', { sessionId, ...data }),
    updateProduct: (sessionId, data) => ipcRenderer.invoke('pos:menu-admin:update-product', { sessionId, ...data }),
    deleteProduct: (sessionId, id) => ipcRenderer.invoke('pos:menu-admin:delete-product', { sessionId, id }),
    createVariant: (sessionId, data) => ipcRenderer.invoke('pos:menu-admin:create-variant', { sessionId, ...data }),
    updateVariant: (sessionId, data) => ipcRenderer.invoke('pos:menu-admin:update-variant', { sessionId, ...data }),
    deleteVariant: (sessionId, id) => ipcRenderer.invoke('pos:menu-admin:delete-variant', { sessionId, id }),
    createModifier: (sessionId, data) => ipcRenderer.invoke('pos:menu-admin:create-modifier', { sessionId, ...data }),
    updateModifier: (sessionId, data) => ipcRenderer.invoke('pos:menu-admin:update-modifier', { sessionId, ...data }),
    deleteModifier: (sessionId, id) => ipcRenderer.invoke('pos:menu-admin:delete-modifier', { sessionId, id }),
    getAllModifiers: (sessionId, includeInactive) => ipcRenderer.invoke('pos:menu-admin:all-modifiers', { sessionId, includeInactive }),
    getCategoryModifiers: (sessionId, categoryId, includeInactive) => ipcRenderer.invoke('pos:menu-admin:category-modifiers', { sessionId, categoryId, includeInactive }),
    manageModifiers: (sessionId, data) => ipcRenderer.invoke('pos:menu-admin:manage-modifiers', { sessionId, ...data }),
    clearCategoryModifiers: (sessionId, categoryId) => ipcRenderer.invoke('pos:menu-admin:clear-modifiers', { sessionId, categoryId }),
    clearProductModifiers: (sessionId, productId) => ipcRenderer.invoke('pos:menu-admin:clear-modifiers', { sessionId, productId }),
    toggleActive: (sessionId, id, active) => ipcRenderer.invoke('pos:menu-admin:toggle-active', { sessionId, id, active }),
  },

  recipes: {
    get: (sessionId, variantId) => ipcRenderer.invoke('pos:recipes:get', { sessionId, variantId }),
    update: (sessionId, variantId, ingredients) => ipcRenderer.invoke('pos:recipes:update', { sessionId, variantId, ingredients }),
    getCoverage: (sessionId) => ipcRenderer.invoke('pos:recipes:coverage', { sessionId }),
  },

  orders: {
    create: (sessionId, orderData) => ipcRenderer.invoke('pos:orders:create', { sessionId, ...orderData }),
    void: (sessionId, orderId, reason) => ipcRenderer.invoke('pos:orders:void', { sessionId, orderId, reason }),
    get: (sessionId, orderId) => ipcRenderer.invoke('pos:orders:get', { sessionId, orderId }),
    getRecent: (sessionId, shiftId, limit) => ipcRenderer.invoke('pos:orders:recent', { sessionId, shiftId, limit }),
  },

  receipt: {
    format: (sessionId, orderId) => ipcRenderer.invoke('pos:print:receipt', { sessionId, orderId }),
  },

  inventory: {
    getItems: (sessionId, date) => ipcRenderer.invoke('pos:inventory:items', { sessionId, date }),
    getLog: (sessionId, date) => ipcRenderer.invoke('pos:inventory:log', { sessionId, date }),
    updateLog: (sessionId, data) => ipcRenderer.invoke('pos:inventory:update-log', { sessionId, ...data }),
    confirmOut: (sessionId, data) => ipcRenderer.invoke('pos:inventory:confirm', { sessionId, ...data }),
    saveItem: (sessionId, itemData) => ipcRenderer.invoke('pos:inventory:save-item', { sessionId, ...itemData }),
  },

  reports: {
    getDailySales: (sessionId, date) => ipcRenderer.invoke('pos:reports:daily-sales', { sessionId, date }),
    getShiftSummary: (sessionId, shiftId) => ipcRenderer.invoke('pos:reports:shift-summary', { sessionId, shiftId }),
    getProductMix: (sessionId, startDate, endDate) => ipcRenderer.invoke('pos:reports:product-mix', { sessionId, startDate, endDate }),
    getInventory: (sessionId, startDate, endDate) => ipcRenderer.invoke('pos:reports:inventory', { sessionId, startDate, endDate }),
    exportCsv: (sessionId, reportType, data) => ipcRenderer.invoke('pos:reports:export-csv', { sessionId, reportType, data }),
  },

  staff: {
    list: (sessionId) => ipcRenderer.invoke('pos:staff:list', { sessionId }),
    create: (sessionId, staffData) => ipcRenderer.invoke('pos:staff:create', { sessionId, ...staffData }),
    update: (sessionId, staffData) => ipcRenderer.invoke('pos:staff:update', { sessionId, ...staffData }),
    deactivate: (sessionId, id) => ipcRenderer.invoke('pos:staff:deactivate', { sessionId, id }),
    reactivate: (sessionId, id) => ipcRenderer.invoke('pos:staff:reactivate', { sessionId, id }),
    resetPassword: (sessionId, id, password) => ipcRenderer.invoke('pos:staff:reset-password', { sessionId, id, password }),
    resetPin: (sessionId, id, pin) => ipcRenderer.invoke('pos:staff:reset-pin', { sessionId, id, pin }),
  },

  settings: {
    getAll: (sessionId) => ipcRenderer.invoke('pos:settings:get-all', { sessionId }),
    update: (sessionId, settings) => ipcRenderer.invoke('pos:settings:update', { sessionId, settings }),
  },

  dashboard: {
    getOverview: (sessionId, date, timeframe) => ipcRenderer.invoke('pos:dashboard:overview', { sessionId, date, timeframe }),
    getSalesTrend: (sessionId, timeframe, date) => ipcRenderer.invoke('pos:dashboard:trend', { sessionId, timeframe, date }),
  },

  sync: {
    getStatus: (sessionId) => ipcRenderer.invoke('pos:sync:status', { sessionId }),
    trigger: (sessionId) => ipcRenderer.invoke('pos:sync:trigger', { sessionId }),
    getLogs: (sessionId, limit) => ipcRenderer.invoke('pos:sync:log', { sessionId, limit }),
  },

  health: {
    getStatus: (sessionId) => ipcRenderer.invoke('pos:health:status', { sessionId }),
    checkIntegrity: (sessionId) => ipcRenderer.invoke('pos:health:db-integrity', { sessionId }),
    getStaleShifts: (sessionId) => ipcRenderer.invoke('pos:health:stale-shifts', { sessionId }),
    forceCloseShift: (sessionId, shiftId, notes) => ipcRenderer.invoke('pos:health:force-close-shift', { sessionId, shiftId, notes }),
  },

  backup: {
    runNow: (sessionId, reason) => ipcRenderer.invoke('pos:backup:run-now', { sessionId, reason }),
    list: (sessionId) => ipcRenderer.invoke('pos:backup:list', { sessionId }),
    getStatus: (sessionId) => ipcRenderer.invoke('pos:backup:status', { sessionId }),
    verify: (sessionId, filePath) => ipcRenderer.invoke('pos:backup:verify', { sessionId, filePath }),
    prune: (sessionId, retentionDays) => ipcRenderer.invoke('pos:backup:prune', { sessionId, retentionDays }),
  },

  print: {
    receipt: (sessionId, orderId, options) => ipcRenderer.invoke('pos:print:receipt', { sessionId, orderId, options }),
    test: (sessionId) => ipcRenderer.invoke('pos:print:test', { sessionId }),
    drawer: (sessionId) => ipcRenderer.invoke('pos:print:drawer', { sessionId }),
    status: (sessionId) => ipcRenderer.invoke('pos:print:status', { sessionId }),
  },

  logs: {
    getRecent: (sessionId, limit) => ipcRenderer.invoke('pos:logs:recent', { sessionId, limit }),
    clientError: (errorData) => ipcRenderer.invoke('pos:logs:client', errorData),
  },
});


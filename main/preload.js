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

  orders: {
    create: (sessionId, orderData) => ipcRenderer.invoke('pos:orders:create', { sessionId, ...orderData }),
    void: (sessionId, orderId, reason) => ipcRenderer.invoke('pos:orders:void', { sessionId, orderId, reason }),
    get: (sessionId, orderId) => ipcRenderer.invoke('pos:orders:get', { sessionId, orderId }),
    getRecent: (sessionId, shiftId, limit) => ipcRenderer.invoke('pos:orders:recent', { sessionId, shiftId, limit }),
  },

  receipt: {
    format: (sessionId, orderId) => ipcRenderer.invoke('pos:print:receipt', { sessionId, orderId }),
  },

  invoke: (channel, payload = {}) => ipcRenderer.invoke(channel, payload),
});

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

  invoke: (channel, payload = {}) => ipcRenderer.invoke(channel, payload),
});

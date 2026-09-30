// renderer/utils/logger.js
export const clientLogger = {
  error: (message, meta) => {
    console.error(message, meta);
    if (window.api && window.api.logs && window.api.logs.clientError) {
      window.api.logs.clientError({ level: 'error', message, meta }).catch(() => {});
    }
  },
  warn: (message, meta) => {
    console.warn(message, meta);
    if (window.api && window.api.logs && window.api.logs.clientError) {
      window.api.logs.clientError({ level: 'warn', message, meta }).catch(() => {});
    }
  },
  info: (message, meta) => {
    console.info(message, meta);
    if (window.api && window.api.logs && window.api.logs.clientError) {
      window.api.logs.clientError({ level: 'info', message, meta }).catch(() => {});
    }
  }
};

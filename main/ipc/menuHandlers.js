// main/ipc/menuHandlers.js
// IPC handlers for menu queries

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { menuService } from '../services/menuService.js';

export function registerMenuHandlers() {
  // Get active categories
  registerIpcHandler(IPC_CHANNELS.MENU_CATEGORIES, async () => {
    return menuService.getCategories();
  });

  // Get products by category
  registerIpcHandler(IPC_CHANNELS.MENU_PRODUCTS, async (payload) => {
    return menuService.getProductsByCategory(payload.categoryId);
  });

  // Get variants for a product
  registerIpcHandler(IPC_CHANNELS.MENU_VARIANTS, async (payload) => {
    return menuService.getVariants(payload.productId);
  });

  // Get modifiers for a product
  registerIpcHandler(IPC_CHANNELS.MENU_MODIFIERS, async (payload) => {
    return menuService.getModifiers(payload.productId);
  });

  // Get full structured menu catalog in one call
  registerIpcHandler(IPC_CHANNELS.MENU_CATALOG, async () => {
    return menuService.getFullCatalog();
  });
}

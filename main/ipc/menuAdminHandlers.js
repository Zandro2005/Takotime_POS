// main/ipc/menuAdminHandlers.js
// IPC handlers for catalog CRUD (categories, products, variants, modifiers)

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { menuService } from '../services/menuService.js';

export function registerMenuAdminHandlers() {
  // Categories
  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_CREATE_CATEGORY, async (payload) => {
    return menuService.createCategory(payload);
  });

  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_UPDATE_CATEGORY, async (payload) => {
    if (!payload?.id) throw new Error('Category id is required');
    return menuService.updateCategory(payload.id, payload);
  });

  // Products
  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_CREATE_PRODUCT, async (payload) => {
    return menuService.createProduct(payload);
  });

  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_UPDATE_PRODUCT, async (payload) => {
    if (!payload?.id) throw new Error('Product id is required');
    return menuService.updateProduct(payload.id, payload);
  });

  // Variants
  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_CREATE_VARIANT, async (payload) => {
    return menuService.createVariant(payload);
  });

  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_UPDATE_VARIANT, async (payload) => {
    if (!payload?.id) throw new Error('Variant id is required');
    return menuService.updateVariant(payload.id, payload);
  });

  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_DELETE_VARIANT, async (payload) => {
    if (!payload?.id) throw new Error('Variant id is required');
    return menuService.deleteVariant(payload.id);
  });

  // Modifiers
  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_CREATE_MODIFIER, async (payload) => {
    return menuService.createModifier(payload);
  });

  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_UPDATE_MODIFIER, async (payload) => {
    if (!payload?.id) throw new Error('Modifier id is required');
    return menuService.updateModifier(payload.id, payload);
  });

  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_DELETE_MODIFIER, async (payload) => {
    if (!payload?.id) throw new Error('Modifier id is required');
    return menuService.deleteModifier(payload.id);
  });

  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_ALL_MODIFIERS, async (payload) => {
    return menuService.getAllModifiers(payload?.includeInactive ?? true);
  });

  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_MANAGE_MODIFIERS, async (payload) => {
    if (!payload?.productId) throw new Error('productId is required');
    return menuService.setProductModifiers(payload.productId, payload.modifierIds || []);
  });

  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_CLEAR_MODIFIERS, async (payload) => {
    if (!payload?.productId) throw new Error('productId is required');
    return menuService.clearProductModifiers(payload.productId);
  });

  registerIpcHandler(IPC_CHANNELS.MENU_ADMIN_TOGGLE_ACTIVE, async (payload) => {
    if (!payload?.id) throw new Error('Product id is required');
    return menuService.updateProduct(payload.id, { active: payload.active });
  });
}

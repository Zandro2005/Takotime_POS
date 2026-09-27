// main/ipc/recipeHandlers.js
// IPC handlers for BOM recipes and ingredient linkage

import { IPC_CHANNELS } from '../../shared/constants.js';
import { registerIpcHandler } from '../utils/ipcWrapper.js';
import { recipeService } from '../services/recipeService.js';

export function registerRecipeHandlers() {
  // Get recipe ingredients for a variant
  registerIpcHandler(IPC_CHANNELS.RECIPES_GET, async (payload) => {
    if (!payload?.variantId) throw new Error('variantId is required');
    return recipeService.getRecipeForVariant(payload.variantId);
  });

  // Save / update recipe ingredients for a variant
  registerIpcHandler(IPC_CHANNELS.RECIPES_UPDATE, async (payload) => {
    if (!payload?.variantId) throw new Error('variantId is required');
    return recipeService.saveRecipeForVariant(payload.variantId, payload.ingredients || []);
  });

  // Recipe coverage validation report
  registerIpcHandler(IPC_CHANNELS.RECIPES_COVERAGE, async () => {
    return recipeService.validateRecipeCoverage();
  });
}

// tests/unit/menuRecipe.test.js
// Unit tests for Phase 4: Menu Management & BOM Recipe Builder

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { initDatabase, closeDb } from '../../main/db/db.js';
import { runMigrations } from '../../main/db/migrations/migrationRunner.js';
import { seedInitialData } from '../../main/db/seed.js';
import { menuService } from '../../main/services/menuService.js';
import { recipeService } from '../../main/services/recipeService.js';
import { inventoryService } from '../../main/services/inventoryService.js';
import { orderService } from '../../main/services/orderService.js';
import { shiftService } from '../../main/services/shiftService.js';

let testDb;

test.before(async () => {
  const testDbPath = path.join(process.cwd(), 'data', 'test-menu.db');
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch {}
  }

  testDb = initDatabase(testDbPath);
  runMigrations(testDb);
  await seedInitialData(testDb);
});

test.after(() => {
  closeDb();
});

test('Phase 4 Menu & Recipe Suite', async (t) => {
  let newCatId;
  let newProdId;
  let newVariantId;
  let newModifierId;

  // 1. Category Management
  await t.test('1. Category CRUD creates and updates categories', () => {
    const created = menuService.createCategory({ name: 'Special Combos', sortOrder: 4 });
    assert.ok(created.id);
    assert.equal(created.name, 'Special Combos');
    newCatId = created.id;

    const updated = menuService.updateCategory(newCatId, { name: 'Party Platters', sortOrder: 5 });
    assert.equal(updated.name, 'Party Platters');
    assert.equal(updated.sort_order, 5);

    const all = menuService.getCategories();
    assert.ok(all.some(c => c.id === newCatId && c.name === 'Party Platters'));
  });

  // 2. Product Management
  await t.test('2. Product CRUD creates and updates products', () => {
    const prod = menuService.createProduct({
      name: 'Mega Takoyaki Platter (24pcs)',
      categoryId: newCatId,
      sortOrder: 1,
    });
    assert.ok(prod.id);
    assert.equal(prod.name, 'Mega Takoyaki Platter (24pcs)');
    newProdId = prod.id;

    const updated = menuService.updateProduct(newProdId, { name: 'Mega Party Platter (24pcs)' });
    assert.equal(updated.name, 'Mega Party Platter (24pcs)');
  });

  // 3. Variant Management
  await t.test('3. Variant CRUD creates, updates, and validates pricing/cost', () => {
    const variant = menuService.createVariant({
      productId: newProdId,
      label: '24 pcs Box',
      price: 240.0,
      cost: 95.0,
      sortOrder: 1,
    });
    assert.ok(variant.id);
    assert.equal(variant.price, 240.0);
    assert.equal(variant.cost, 95.0);
    newVariantId = variant.id;

    const updated = menuService.updateVariant(newVariantId, { price: 250.0 });
    assert.equal(updated.price, 250.0);

    const variants = menuService.getVariants(newProdId);
    assert.equal(variants.length, 1);
    assert.equal(variants[0].label, '24 pcs Box');
  });

  // 4. Modifier Management & Linkage
  await t.test('4. Modifier CRUD and product modifier linking', () => {
    const mod = menuService.createModifier({ name: 'Truffle Mayo', priceDelta: 15.0 });
    assert.ok(mod.id);
    newModifierId = mod.id;

    // Link to new product
    menuService.linkModifier(newProdId, newModifierId);
    const prodMods = menuService.getModifiers(newProdId);
    assert.ok(prodMods.some(m => m.id === newModifierId && m.name === 'Truffle Mayo'));

    // Set multiple modifiers
    menuService.setProductModifiers(newProdId, [1, 2, newModifierId]);
    const updatedMods = menuService.getModifiers(newProdId);
    assert.equal(updatedMods.length, 3);
  });

  // 5. Recipe Management (BOM Linking)
  await t.test('5. RecipeService links variants to inventory items with quantities', () => {
    // Check initial coverage - newVariantId should have NO recipe
    const coverageBefore = recipeService.getRecipeCoverage();
    const targetVariantCoverage = coverageBefore.find(c => c.variant_id === newVariantId);
    assert.ok(targetVariantCoverage);
    assert.equal(targetVariantCoverage.hasRecipe, false);
    assert.ok(targetVariantCoverage.warning);

    // Save recipe for 24pcs box:
    // 0.48 kg batter (item 1), 0.24 kg octopus (item 2)
    const saved = recipeService.saveRecipeForVariant(newVariantId, [
      { inventoryItemId: 1, qtyPerUnit: 0.48 },
      { inventoryItemId: 2, qtyPerUnit: 0.24 },
    ]);

    assert.equal(saved.ingredients.length, 2);
    const batter = saved.ingredients.find(i => i.inventoryItemId === 1);
    const octopus = saved.ingredients.find(i => i.inventoryItemId === 2);
    assert.ok(batter && batter.qtyPerUnit === 0.48);
    assert.ok(octopus && octopus.qtyPerUnit === 0.24);

    // Verify coverage updated
    const coverageAfter = recipeService.getRecipeCoverage();
    const covered = coverageAfter.find(c => c.variant_id === newVariantId);
    assert.equal(covered.hasRecipe, true);
    assert.equal(covered.ingredient_count, 2);
  });

  // 6. Recipe Depletion Verification in Order Flow
  await t.test('6. Ordering newly created product depletes inventory according to custom recipe', async () => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    inventoryService.initializeDayLog(today);

    // Open shift
    const shift = shiftService.openShift(3, 1000);

    // Order 1x 24 pcs Box
    await orderService.createOrder({
      shiftId: shift.id,
      staffId: 3,
      items: [{ variantId: newVariantId, qty: 1 }],
      paymentMethod: 'cash',
      amountTendered: 300,
    });

    // Check inventory suggested out for today
    const items = inventoryService.getItemsForDate(today);
    const batter = items.find(i => i.itemId === 1);
    const oct = items.find(i => i.itemId === 2);

    // Expect at least 0.48 kg batter and 0.24 kg octopus
    assert.ok(batter.suggestedOut >= 0.48);
    assert.ok(oct.suggestedOut >= 0.24);
  });
});

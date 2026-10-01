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

  // 1b. Category Deletion (Hard delete vs Soft deactivate)
  await t.test('1b. Category delete: hard deletes when unsold/empty, soft deactivates when sold', () => {
    // 1. Unsold / empty category -> hard deletes
    const tempCat = menuService.createCategory({ name: 'Seasonal Promo Category' });
    const tempCatProd = menuService.createProduct({ name: 'Seasonal Item', categoryId: tempCat.id });
    menuService.createVariant({ productId: tempCatProd.id, label: 'Single', price: 99.0 });

    const delRes = menuService.deleteCategory(tempCat.id);
    assert.equal(delRes.deleted, true);
    assert.ok(!menuService.getCategories(true).some(c => c.id === tempCat.id));

    // 2. Category with historical sales -> soft deactivates
    const soldCat = menuService.createCategory({ name: 'Historical Sold Category' });
    const soldCatProd = menuService.createProduct({ name: 'Historical Drink', categoryId: soldCat.id });
    const soldCatVar = menuService.createVariant({ productId: soldCatProd.id, label: 'Large', price: 55.0 });

    const dummyShift = shiftService.getCurrentShift() || shiftService.openShift(3, 1000);
    const ordInfo = testDb.prepare(`
      INSERT INTO orders (shift_id, staff_id, order_type, queue_no, subtotal, total, payment_method)
      VALUES (?, 3, 'dine_in', 997, 55.0, 55.0, 'cash')
    `).run(dummyShift.id);
    testDb.prepare(`
      INSERT INTO order_items (order_id, variant_id, qty, unit_price, subtotal)
      VALUES (?, ?, 1, 55.0, 55.0)
    `).run(ordInfo.lastInsertRowid, soldCatVar.id);

    const soldCatRes = menuService.deleteCategory(soldCat.id);
    assert.equal(soldCatRes.deactivated, true);
    // Active category catalog should exclude it
    assert.ok(!menuService.getCategories(false).some(c => c.id === soldCat.id));
    // Inactive query retains it
    assert.ok(menuService.getCategories(true).some(c => c.id === soldCat.id && c.active === 0));
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

  // 2b. Product Deletion (Hard delete vs Soft deactivate)
  await t.test('2b. Product delete: hard deletes when unsold, soft deactivates when sold', () => {
    // 1. Create a dummy product with variant (unsold)
    const tempProd = menuService.createProduct({
      name: 'Temporary Unsold Product',
      categoryId: newCatId,
    });
    menuService.createVariant({
      productId: tempProd.id,
      label: 'Regular',
      price: 50.0,
    });

    // Delete unsold product -> hard deletes
    const res = menuService.deleteProduct(tempProd.id);
    assert.equal(res.deleted, true);
    assert.ok(!menuService.getProductsByCategory(newCatId, true).some(p => p.id === tempProd.id));

    // 2. Product with historical sales -> soft deactivates
    const soldProd = menuService.createProduct({
      name: 'Historical Sold Product',
      categoryId: newCatId,
    });
    const soldVar = menuService.createVariant({
      productId: soldProd.id,
      label: 'Single',
      price: 60.0,
    });

    const dummyShift = shiftService.getCurrentShift() || shiftService.openShift(3, 1000);
    const ordInfo = testDb.prepare(`
      INSERT INTO orders (shift_id, staff_id, order_type, queue_no, subtotal, total, payment_method)
      VALUES (?, 3, 'dine_in', 998, 60.0, 60.0, 'cash')
    `).run(dummyShift.id);
    const orderItemId = testDb.prepare(`
      INSERT INTO order_items (order_id, variant_id, qty, unit_price, subtotal)
      VALUES (?, ?, 1, 60.0, 60.0)
    `).run(ordInfo.lastInsertRowid, soldVar.id).lastInsertRowid;

    const soldRes = menuService.deleteProduct(soldProd.id);
    assert.equal(soldRes.deactivated, true);

    // Active products should not include it
    assert.ok(!menuService.getProductsByCategory(newCatId, false).some(p => p.id === soldProd.id));
    // Inactive lookup includes it with active = 0
    assert.ok(menuService.getProductsByCategory(newCatId, true).some(p => p.id === soldProd.id && p.active === 0));

    // Clean up
    testDb.prepare(`DELETE FROM order_items WHERE id = ?`).run(orderItemId);
    testDb.prepare(`DELETE FROM orders WHERE id = ?`).run(ordInfo.lastInsertRowid);
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
    // Create modifier
    const mod = menuService.createModifier({ name: 'Truffle Mayo', priceDelta: 15.0 });
    assert.ok(mod.id);
    newModifierId = mod.id;

    // Read all modifiers
    const allMods = menuService.getAllModifiers(true);
    assert.ok(allMods.some(m => m.id === newModifierId && m.name === 'Truffle Mayo'));

    // Update modifier name, price delta, and active state
    const updated = menuService.updateModifier(newModifierId, {
      name: 'Premium Truffle Mayo',
      priceDelta: 20.0,
      active: 1,
    });
    assert.equal(updated.name, 'Premium Truffle Mayo');
    assert.equal(updated.price_delta, 20.0);
    assert.equal(updated.active, 1);

    // Link to new product
    menuService.linkModifier(newProdId, newModifierId);
    const prodMods = menuService.getModifiers(newProdId);
    assert.ok(prodMods.some(m => m.id === newModifierId && m.name === 'Premium Truffle Mayo'));

    // Set multiple modifiers
    menuService.setProductModifiers(newProdId, [1, 2, newModifierId]);
    const updatedMods = menuService.getModifiers(newProdId);
    assert.equal(updatedMods.length, 3);
  });

  // 4b. Modifier Safe Deletion (Hard delete vs Soft deactivate)
  await t.test('4b. Modifier delete: hard deletes when unsold, soft deactivates when sold', async () => {
    // Case 1: Unsold modifier -> hard delete
    const tempMod = menuService.createModifier({ name: 'Temp Unsold Topping', priceDelta: 8.0 });
    menuService.linkModifier(newProdId, tempMod.id);
    assert.ok(menuService.getModifiers(newProdId).some(m => m.id === tempMod.id));

    const deleteRes = menuService.deleteModifier(tempMod.id);
    assert.equal(deleteRes.deleted, true);
    assert.ok(!menuService.getAllModifiers(true).some(m => m.id === tempMod.id));
    assert.ok(!menuService.getModifiers(newProdId).some(m => m.id === tempMod.id));

    // Case 2: Sold modifier -> soft deactivation & unlinking from product
    const soldMod = menuService.createModifier({ name: 'Historical Sold Dip', priceDelta: 12.0 });
    menuService.linkModifier(newProdId, soldMod.id);

    // Insert order & order_item with proper FKs to satisfy SQLite foreign keys
    const dummyShift = shiftService.getCurrentShift() || shiftService.openShift(3, 1000);
    const ordInfo = testDb.prepare(`
      INSERT INTO orders (shift_id, staff_id, order_type, queue_no, subtotal, total, payment_method)
      VALUES (?, 3, 'dine_in', 999, 100.0, 100.0, 'cash')
    `).run(dummyShift.id);
    const orderItemId = testDb.prepare(`
      INSERT INTO order_items (order_id, variant_id, qty, unit_price, subtotal)
      VALUES (?, ?, 1, 100.0, 100.0)
    `).run(ordInfo.lastInsertRowid, newVariantId).lastInsertRowid;

    testDb.prepare(`
      INSERT INTO order_item_modifiers (order_item_id, modifier_id, price_delta)
      VALUES (?, ?, 12.0)
    `).run(orderItemId, soldMod.id);

    const safeDeleteRes = menuService.deleteModifier(soldMod.id);
    assert.equal(safeDeleteRes.deactivated, true);

    // Verify still in database with active = 0 for historical records
    const checkMod = testDb.prepare(`SELECT * FROM modifiers WHERE id = ?`).get(soldMod.id);
    assert.ok(checkMod);
    assert.equal(checkMod.active, 0);

    // Verify unlinked from future product modifiers
    const checkLinked = testDb.prepare(`SELECT * FROM product_modifiers WHERE modifier_id = ?`).all(soldMod.id);
    assert.equal(checkLinked.length, 0);

    // Clean up dummy records
    testDb.prepare(`DELETE FROM order_item_modifiers WHERE modifier_id = ?`).run(soldMod.id);
    testDb.prepare(`DELETE FROM order_items WHERE id = ?`).run(orderItemId);
    testDb.prepare(`DELETE FROM orders WHERE id = ?`).run(ordInfo.lastInsertRowid);
  });

  // 4c. Product-Specific Modifier Creation & Clear All Deletion
  await t.test('4c. Product-specific modifier creation and clearProductModifiers deletes modifiers', () => {
    // Directly add a modifier to product
    const pMod = menuService.createProductModifier(newProdId, { name: 'Garlic Crunch', priceDelta: 6.0 });
    assert.ok(pMod.id);
    const prodMods = menuService.getModifiers(newProdId);
    assert.ok(prodMods.some(m => m.id === pMod.id && m.name === 'Garlic Crunch'));

    // Clear all modifiers on this product -> unlinks and deletes them
    const clearRes = menuService.clearProductModifiers(newProdId);
    assert.ok(clearRes.success);
    const modsAfterClear = menuService.getModifiers(newProdId);
    assert.equal(modsAfterClear.length, 0);

    // Verify Garlic Crunch was deleted because it was unsold
    assert.ok(!menuService.getAllModifiers(true).some(m => m.id === pMod.id));
  });

  // 4d. Category-Level Modifier Management
  await t.test('4d. Category-level modifier CRUD and catalog inheritance', () => {
    // 1. Create a category modifier for category 2 (Siomai)
    const catMod = menuService.createCategoryModifier(2, { name: 'Fried Garlic Topping', priceDelta: 7.0 });
    assert.ok(catMod.id);

    // 2. Query category modifiers for category 2
    const siomaiMods = menuService.getCategoryModifiers(2);
    assert.ok(siomaiMods.some(m => m.id === catMod.id && m.name === 'Fried Garlic Topping'));

    // 3. Catalog includes category modifiers on the category object
    const catalog = menuService.getFullCatalog();
    const siomaiCat = catalog.find(c => c.id === 2);
    assert.ok(siomaiCat);
    assert.ok(siomaiCat.modifiers.some(m => m.id === catMod.id));

    // 4. Products in this category inherit the category modifiers
    const porkSiomai = siomaiCat.products.find(p => p.id === 3);
    assert.ok(porkSiomai.modifiers.some(m => m.id === catMod.id));

    // 5. Clean up category modifier
    const delRes = menuService.deleteModifier(catMod.id);
    assert.equal(delRes.deleted, true);
    assert.ok(!menuService.getCategoryModifiers(2).some(m => m.id === catMod.id));
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

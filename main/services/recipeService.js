// main/services/recipeService.js
// Bill of Materials (BOM) recipe management: links product variants to inventory items

import { getDb } from '../db/db.js';

export class RecipeService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
  }

  get db() {
    return this._db || getDb();
  }

  /**
   * Retrieves all recipe ingredients for a specific variant.
   */
  getRecipeForVariant(variantId) {
    const db = this.db;
    const stmt = db.prepare(`
      SELECT
        r.id,
        r.product_variant_id,
        r.inventory_item_id,
        r.qty_per_unit,
        i.name as item_name,
        i.unit as item_unit,
        i.active as item_active
      FROM recipes r
      JOIN inventory_items i ON i.id = r.inventory_item_id
      WHERE r.product_variant_id = ?
      ORDER BY i.name ASC
    `);

    const rows = stmt.all(variantId);
    return {
      variantId,
      ingredients: rows.map(r => ({
        id: r.id,
        inventoryItemId: r.inventory_item_id,
        name: r.item_name,
        unit: r.item_unit,
        qtyPerUnit: r.qty_per_unit,
        itemActive: r.item_active,
      })),
    };
  }

  /**
   * Saves / updates all recipe ingredient linkages for a variant atomically.
   */
  saveRecipeForVariant(variantId, ingredientRows = []) {
    if (!variantId) throw new Error('Variant ID is required');

    const db = this.db;

    // Verify variant exists
    const variant = db.prepare(`SELECT id, label FROM product_variants WHERE id = ?`).get(variantId);
    if (!variant) throw new Error(`Product variant #${variantId} not found`);

    return db.transaction(() => {
      // 1. Clear existing recipe rows
      db.prepare(`DELETE FROM recipes WHERE product_variant_id = ?`).run(variantId);

      // 2. Validate and insert new recipe rows
      const insert = db.prepare(`
        INSERT INTO recipes (product_variant_id, inventory_item_id, qty_per_unit)
        VALUES (?, ?, ?)
      `);

      for (const row of ingredientRows) {
        const itemId = row.inventoryItemId || row.inventory_item_id;
        const qty = Number(row.qtyPerUnit || row.qty_per_unit);

        if (!itemId) throw new Error('Each recipe ingredient must specify an inventory item');
        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Quantity per unit for ingredient #${itemId} must be a positive number`);
        }

        insert.run(variantId, itemId, qty);
      }

      return this.getRecipeForVariant(variantId);
    })();
  }

  /**
   * Returns list of all active variants across products, detailing recipe coverage.
   */
  getRecipeCoverage() {
    const db = this.db;
    const stmt = db.prepare(`
      SELECT
        c.name as category_name,
        p.id as product_id,
        p.name as product_name,
        pv.id as variant_id,
        pv.label as variant_label,
        pv.price,
        pv.cost,
        COUNT(r.id) as ingredient_count
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN recipes r ON r.product_variant_id = pv.id
      WHERE pv.active = 1 AND p.active = 1 AND c.active = 1
      GROUP BY pv.id
      ORDER BY c.sort_order ASC, p.sort_order ASC, pv.sort_order ASC
    `);

    const rows = stmt.all();
    return rows.map(r => ({
      ...r,
      hasRecipe: r.ingredient_count > 0,
      warning: r.ingredient_count === 0 ? 'Missing recipe - sales will not deplete inventory' : null,
    }));
  }

  /**
   * High-level validation report for store recipes.
   */
  validateRecipeCoverage() {
    const coverage = this.getRecipeCoverage();
    const totalVariants = coverage.length;
    const coveredVariants = coverage.filter(c => c.hasRecipe).length;
    const missing = coverage.filter(c => !c.hasRecipe);

    return {
      totalVariants,
      coveredVariants,
      missingCount: missing.length,
      coveragePercent: totalVariants > 0 ? (coveredVariants / totalVariants) * 100 : 100,
      missingVariants: missing,
    };
  }
}

export const recipeService = new RecipeService();

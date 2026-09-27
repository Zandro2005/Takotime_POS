// main/services/menuService.js
// Menu catalog queries, variants retrieval, and catalog administration CRUD

import { getDb } from '../db/db.js';

export class MenuService {
  constructor(dbInstance = null) {
    this._db = dbInstance;
  }

  get db() {
    return this._db || getDb();
  }

  // --- Read Methods ---

  getCategories(includeInactive = false) {
    const db = this.db;
    const filter = includeInactive ? '' : 'WHERE active = 1';
    return db.prepare(`
      SELECT id, name, sort_order, active
      FROM categories
      ${filter}
      ORDER BY sort_order ASC, name ASC
    `).all();
  }

  getProductsByCategory(categoryId, includeInactive = false) {
    const db = this.db;
    const filter = includeInactive ? 'WHERE category_id = ?' : 'WHERE category_id = ? AND active = 1';
    return db.prepare(`
      SELECT id, name, category_id, sort_order, active
      FROM products
      ${filter}
      ORDER BY sort_order ASC, name ASC
    `).all(categoryId);
  }

  getVariants(productId, includeInactive = false) {
    const db = this.db;
    const filter = includeInactive ? 'WHERE product_id = ?' : 'WHERE product_id = ? AND active = 1';
    return db.prepare(`
      SELECT id, product_id, label, price, cost, sort_order, active
      FROM product_variants
      ${filter}
      ORDER BY sort_order ASC, price ASC
    `).all(productId);
  }

  getModifiers(productId) {
    const db = this.db;
    return db.prepare(`
      SELECT m.id, m.name, m.price_delta, m.active
      FROM modifiers m
      JOIN product_modifiers pm ON m.id = pm.modifier_id
      WHERE pm.product_id = ? AND m.active = 1
      ORDER BY m.price_delta ASC, m.name ASC
    `).all(productId);
  }

  getAllModifiers(includeInactive = false) {
    const db = this.db;
    const filter = includeInactive ? '' : 'WHERE active = 1';
    return db.prepare(`
      SELECT id, name, price_delta, active
      FROM modifiers
      ${filter}
      ORDER BY price_delta ASC, name ASC
    `).all();
  }

  getFullCatalog(includeInactive = false) {
    const db = this.db;
    const categories = this.getCategories(includeInactive);
    const productFilter = includeInactive ? '' : 'WHERE active = 1';
    const variantFilter = includeInactive ? '' : 'WHERE active = 1';

    const allProducts = db.prepare(`
      SELECT id, name, category_id, sort_order, active
      FROM products
      ${productFilter}
      ORDER BY sort_order ASC, name ASC
    `).all();

    const allVariants = db.prepare(`
      SELECT id, product_id, label, price, cost, sort_order, active
      FROM product_variants
      ${variantFilter}
      ORDER BY sort_order ASC, price ASC
    `).all();

    const allProductModifiers = db.prepare(`
      SELECT pm.product_id, m.id as modifier_id, m.name, m.price_delta
      FROM product_modifiers pm
      JOIN modifiers m ON pm.modifier_id = m.id
      WHERE m.active = 1
      ORDER BY m.price_delta ASC, m.name ASC
    `).all();

    // Assemble catalog hierarchy
    const productsByCat = {};
    for (const p of allProducts) {
      if (!productsByCat[p.category_id]) productsByCat[p.category_id] = [];

      const variants = allVariants.filter(v => v.product_id === p.id);
      const modifiers = allProductModifiers.filter(pm => pm.product_id === p.id);

      productsByCat[p.category_id].push({
        ...p,
        variants,
        modifiers,
      });
    }

    return categories.map(cat => ({
      ...cat,
      products: productsByCat[cat.id] || [],
    }));
  }

  // --- Category CRUD ---

  createCategory({ name, sortOrder = 0 }) {
    if (!name || !name.trim()) throw new Error('Category name is required');
    const db = this.db;
    const stmt = db.prepare(`
      INSERT INTO categories (name, sort_order, active)
      VALUES (?, ?, 1)
    `);
    const info = stmt.run(name.trim(), Number(sortOrder) || 0);
    return { id: info.lastInsertRowid, name: name.trim(), sort_order: Number(sortOrder) || 0, active: 1 };
  }

  updateCategory(id, { name, sortOrder, active }) {
    const db = this.db;
    const existing = db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id);
    if (!existing) throw new Error(`Category #${id} not found`);

    const newName = name !== undefined ? name.trim() : existing.name;
    const newSort = sortOrder !== undefined ? Number(sortOrder) : existing.sort_order;
    const newActive = active !== undefined ? (active ? 1 : 0) : existing.active;

    db.prepare(`
      UPDATE categories
      SET name = ?, sort_order = ?, active = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(newName, newSort, newActive, id);

    return { id, name: newName, sort_order: newSort, active: newActive };
  }

  // --- Product CRUD ---

  createProduct({ name, categoryId, sortOrder = 0 }) {
    if (!name || !name.trim()) throw new Error('Product name is required');
    if (!categoryId) throw new Error('Category ID is required');

    const db = this.db;
    const cat = db.prepare(`SELECT id FROM categories WHERE id = ?`).get(categoryId);
    if (!cat) throw new Error(`Category #${categoryId} not found`);

    const stmt = db.prepare(`
      INSERT INTO products (name, category_id, sort_order, active)
      VALUES (?, ?, ?, 1)
    `);
    const info = stmt.run(name.trim(), categoryId, Number(sortOrder) || 0);
    return { id: info.lastInsertRowid, name: name.trim(), category_id: categoryId, sort_order: Number(sortOrder) || 0, active: 1 };
  }

  updateProduct(id, { name, categoryId, sortOrder, active }) {
    const db = this.db;
    const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    if (!existing) throw new Error(`Product #${id} not found`);

    const newName = name !== undefined ? name.trim() : existing.name;
    const newCat = categoryId !== undefined ? categoryId : existing.category_id;
    const newSort = sortOrder !== undefined ? Number(sortOrder) : existing.sort_order;
    const newActive = active !== undefined ? (active ? 1 : 0) : existing.active;

    db.prepare(`
      UPDATE products
      SET name = ?, category_id = ?, sort_order = ?, active = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(newName, newCat, newSort, newActive, id);

    return { id, name: newName, category_id: newCat, sort_order: newSort, active: newActive };
  }

  // --- Variant CRUD ---

  createVariant({ productId, label, price, cost = 0, sortOrder = 0 }) {
    if (!productId) throw new Error('Product ID is required');
    if (!label || !label.trim()) throw new Error('Variant label is required');
    if (typeof price !== 'number' || price < 0) throw new Error('Price must be a valid non-negative number');

    const db = this.db;
    const prod = db.prepare(`SELECT id FROM products WHERE id = ?`).get(productId);
    if (!prod) throw new Error(`Product #${productId} not found`);

    const stmt = db.prepare(`
      INSERT INTO product_variants (product_id, label, price, cost, sort_order, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    const info = stmt.run(productId, label.trim(), price, Number(cost) || 0, Number(sortOrder) || 0);
    return {
      id: info.lastInsertRowid,
      product_id: productId,
      label: label.trim(),
      price,
      cost: Number(cost) || 0,
      sort_order: Number(sortOrder) || 0,
      active: 1,
    };
  }

  updateVariant(id, { label, price, cost, sortOrder, active }) {
    const db = this.db;
    const existing = db.prepare(`SELECT * FROM product_variants WHERE id = ?`).get(id);
    if (!existing) throw new Error(`Variant #${id} not found`);

    const newLabel = label !== undefined ? label.trim() : existing.label;
    const newPrice = price !== undefined ? Number(price) : existing.price;
    const newCost = cost !== undefined ? Number(cost) : existing.cost;
    const newSort = sortOrder !== undefined ? Number(sortOrder) : existing.sort_order;
    const newActive = active !== undefined ? (active ? 1 : 0) : existing.active;

    db.prepare(`
      UPDATE product_variants
      SET label = ?, price = ?, cost = ?, sort_order = ?, active = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(newLabel, newPrice, newCost, newSort, newActive, id);

    return { id, product_id: existing.product_id, label: newLabel, price: newPrice, cost: newCost, sort_order: newSort, active: newActive };
  }

  deleteVariant(id) {
    const db = this.db;
    // Check if variant has order_items
    const orderItemCount = db.prepare(`SELECT COUNT(id) as count FROM order_items WHERE variant_id = ?`).get(id);
    if (orderItemCount.count > 0) {
      // Soft deactivate to preserve historical sales
      db.prepare(`UPDATE product_variants SET active = 0 WHERE id = ?`).run(id);
      return { success: true, deactivated: true };
    }
    // Safe to hard delete if never sold
    db.prepare(`DELETE FROM recipes WHERE product_variant_id = ?`).run(id);
    db.prepare(`DELETE FROM product_variants WHERE id = ?`).run(id);
    return { success: true, deleted: true };
  }

  // --- Modifier CRUD & Linkage ---

  createModifier({ name, priceDelta = 0 }) {
    if (!name || !name.trim()) throw new Error('Modifier name is required');
    const db = this.db;
    const stmt = db.prepare(`
      INSERT INTO modifiers (name, price_delta, active)
      VALUES (?, ?, 1)
    `);
    const info = stmt.run(name.trim(), Number(priceDelta) || 0);
    return { id: info.lastInsertRowid, name: name.trim(), price_delta: Number(priceDelta) || 0, active: 1 };
  }

  updateModifier(id, { name, priceDelta, active }) {
    const db = this.db;
    const existing = db.prepare(`SELECT * FROM modifiers WHERE id = ?`).get(id);
    if (!existing) throw new Error(`Modifier #${id} not found`);

    const newName = name !== undefined ? name.trim() : existing.name;
    const newDelta = priceDelta !== undefined ? Number(priceDelta) : existing.price_delta;
    const newActive = active !== undefined ? (active ? 1 : 0) : existing.active;

    db.prepare(`
      UPDATE modifiers
      SET name = ?, price_delta = ?, active = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(newName, newDelta, newActive, id);

    return { id, name: newName, price_delta: newDelta, active: newActive };
  }

  linkModifier(productId, modifierId) {
    const db = this.db;
    db.prepare(`
      INSERT OR IGNORE INTO product_modifiers (product_id, modifier_id)
      VALUES (?, ?)
    `).run(productId, modifierId);
    return { success: true };
  }

  unlinkModifier(productId, modifierId) {
    const db = this.db;
    db.prepare(`
      DELETE FROM product_modifiers
      WHERE product_id = ? AND modifier_id = ?
    `).run(productId, modifierId);
    return { success: true };
  }

  setProductModifiers(productId, modifierIds = []) {
    const db = this.db;
    return db.transaction(() => {
      db.prepare(`DELETE FROM product_modifiers WHERE product_id = ?`).run(productId);
      const insert = db.prepare(`
        INSERT INTO product_modifiers (product_id, modifier_id)
        VALUES (?, ?)
      `);
      for (const modId of modifierIds) {
        insert.run(productId, modId);
      }
      return { success: true, modifierIds };
    })();
  }
}

export const menuService = new MenuService();

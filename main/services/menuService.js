// main/services/menuService.js
// Menu catalog queries and variants retrieval

import { getDb } from '../db/db.js';

export class MenuService {
  getCategories() {
    const db = getDb();
    return db.prepare(`
      SELECT id, name, sort_order, active
      FROM categories
      WHERE active = 1
      ORDER BY sort_order ASC, name ASC
    `).all();
  }

  getProductsByCategory(categoryId) {
    const db = getDb();
    return db.prepare(`
      SELECT id, name, category_id, sort_order, active
      FROM products
      WHERE category_id = ? AND active = 1
      ORDER BY sort_order ASC, name ASC
    `).all(categoryId);
  }

  getVariants(productId) {
    const db = getDb();
    return db.prepare(`
      SELECT id, product_id, label, price, cost, sort_order, active
      FROM product_variants
      WHERE product_id = ? AND active = 1
      ORDER BY sort_order ASC, price ASC
    `).all(productId);
  }

  getModifiers(productId) {
    const db = getDb();
    return db.prepare(`
      SELECT m.id, m.name, m.price_delta, m.active
      FROM modifiers m
      JOIN product_modifiers pm ON m.id = pm.modifier_id
      WHERE pm.product_id = ? AND m.active = 1
      ORDER BY m.price_delta ASC, m.name ASC
    `).all(productId);
  }

  getFullCatalog() {
    const db = getDb();
    const categories = this.getCategories();
    const allProducts = db.prepare(`
      SELECT id, name, category_id, sort_order
      FROM products
      WHERE active = 1
      ORDER BY sort_order ASC, name ASC
    `).all();

    const allVariants = db.prepare(`
      SELECT id, product_id, label, price, cost, sort_order
      FROM product_variants
      WHERE active = 1
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
}

export const menuService = new MenuService();

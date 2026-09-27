// main/db/seed.js
// Seeder for initial users, catalog, modifiers, inventory items, and recipes

import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';
import { ROLES } from '../../shared/constants.js';

export function seedInitialData(db) {
  logger.info('Seeding initial database data...');

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, username, pin, password_hash, role, active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const saltRounds = 10;
  
  // 1. Seed Users
  const adminPass = bcrypt.hashSync('admin123', saltRounds);
  const adminPin = bcrypt.hashSync('1234', saltRounds);
  insertUser.run('Store Admin', 'admin', adminPin, adminPass, ROLES.ADMIN);

  const supervisorPass = bcrypt.hashSync('staff123', saltRounds);
  const supervisorPin = bcrypt.hashSync('5678', saltRounds);
  insertUser.run('Lead Staff', 'supervisor', supervisorPin, supervisorPass, ROLES.ADMIN_STAFF);

  const cashierPass = bcrypt.hashSync('cashier123', saltRounds);
  const cashierPin = bcrypt.hashSync('1111', saltRounds);
  insertUser.run('Cashier 1', 'cashier', cashierPin, cashierPass, ROLES.STAFF);

  // 2. Seed Categories
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (?, ?, ?)');
  insertCategory.run(1, 'Takoyaki', 1);
  insertCategory.run(2, 'Siomai', 2);
  insertCategory.run(3, 'Drinks', 3);

  // 3. Seed Products
  const insertProduct = db.prepare('INSERT OR IGNORE INTO products (id, name, category_id, sort_order) VALUES (?, ?, ?, ?)');
  insertProduct.run(1, 'Classic Octopus Takoyaki', 1, 1);
  insertProduct.run(2, 'Crab & Cheese Takoyaki', 1, 2);
  insertProduct.run(3, 'Pork Siomai', 2, 1);
  insertProduct.run(4, 'Japanese Beef Siomai', 2, 2);
  insertProduct.run(5, 'Iced Japanese Green Tea (16oz)', 3, 1);
  insertProduct.run(6, 'Fresh Calamansi Juice (16oz)', 3, 2);
  insertProduct.run(7, 'Mineral Water (500ml)', 3, 3);

  // 4. Seed Product Variants
  const insertVariant = db.prepare(`
    INSERT OR IGNORE INTO product_variants (id, product_id, label, price, cost, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  // Classic Octopus Takoyaki
  insertVariant.run(1, 1, '4 pcs', 45.0, 20.0, 1);
  insertVariant.run(2, 1, '8 pcs', 85.0, 38.0, 2);
  insertVariant.run(3, 1, '12 pcs', 125.0, 55.0, 3);
  // Crab & Cheese Takoyaki
  insertVariant.run(4, 2, '4 pcs', 50.0, 22.0, 1);
  insertVariant.run(5, 2, '8 pcs', 95.0, 42.0, 2);
  insertVariant.run(6, 2, '12 pcs', 140.0, 60.0, 3);
  // Pork Siomai
  insertVariant.run(7, 3, '4 pcs', 40.0, 18.0, 1);
  insertVariant.run(8, 3, '8 pcs', 75.0, 34.0, 2);
  // Japanese Beef Siomai
  insertVariant.run(9, 4, '4 pcs', 50.0, 22.0, 1);
  insertVariant.run(10, 4, '8 pcs', 95.0, 42.0, 2);
  // Drinks (Single regular size)
  insertVariant.run(11, 5, 'Regular (16oz)', 35.0, 12.0, 1);
  insertVariant.run(12, 6, 'Regular (16oz)', 30.0, 10.0, 1);
  insertVariant.run(13, 7, 'Bottle (500ml)', 20.0, 8.0, 1);

  // 5. Seed Modifiers
  const insertModifier = db.prepare(`
    INSERT OR IGNORE INTO modifiers (id, name, price_delta) VALUES (?, ?, ?)
  `);
  insertModifier.run(1, 'Extra Takoyaki Sauce', 5.0);
  insertModifier.run(2, 'Extra Japanese Mayo', 5.0);
  insertModifier.run(3, 'Extra Bonito Flakes', 10.0);
  insertModifier.run(4, 'Chili Garlic Sauce', 5.0);
  insertModifier.run(5, 'Less Ice', 0.0);
  insertModifier.run(6, 'Extra Ice', 0.0);

  // 6. Link Modifiers to Products
  const linkModifier = db.prepare(`
    INSERT OR IGNORE INTO product_modifiers (product_id, modifier_id) VALUES (?, ?)
  `);
  // Takoyaki modifiers
  linkModifier.run(1, 1);
  linkModifier.run(1, 2);
  linkModifier.run(1, 3);
  linkModifier.run(1, 4);

  linkModifier.run(2, 1);
  linkModifier.run(2, 2);
  linkModifier.run(2, 3);
  linkModifier.run(2, 4);

  // Siomai modifiers
  linkModifier.run(3, 4);
  linkModifier.run(4, 4);

  // Drinks modifiers
  linkModifier.run(5, 5);
  linkModifier.run(5, 6);
  linkModifier.run(6, 5);
  linkModifier.run(6, 6);

  // 7. Seed Inventory Items
  const insertInventoryItem = db.prepare(`
    INSERT OR IGNORE INTO inventory_items (id, name, unit, min_stock) VALUES (?, ?, ?, ?)
  `);
  insertInventoryItem.run(1, 'Takoyaki Batter Premix', 'kg', 5.0);
  insertInventoryItem.run(2, 'Diced Octopus', 'kg', 2.0);
  insertInventoryItem.run(3, 'Crab Stick', 'kg', 2.0);
  insertInventoryItem.run(4, 'Cheese Cubes', 'kg', 1.5);
  insertInventoryItem.run(5, 'Pork Siomai (raw)', 'pcs', 100.0);
  insertInventoryItem.run(6, 'Beef Siomai (raw)', 'pcs', 100.0);
  insertInventoryItem.run(7, 'Takoyaki Sauce', 'liters', 3.0);
  insertInventoryItem.run(8, 'Japanese Mayo', 'liters', 3.0);
  insertInventoryItem.run(9, 'Bonito Flakes', 'packs', 2.0);
  insertInventoryItem.run(10, 'Cups 16oz', 'pcs', 50.0);
  insertInventoryItem.run(11, 'Water Bottle 500ml', 'pcs', 24.0);

  // 8. Seed Recipes (BOM)
  const insertRecipe = db.prepare(`
    INSERT OR IGNORE INTO recipes (product_variant_id, inventory_item_id, qty_per_unit)
    VALUES (?, ?, ?)
  `);
  // 4 pcs octopus (variant 1): 0.08 kg batter, 0.04 kg octopus
  insertRecipe.run(1, 1, 0.08);
  insertRecipe.run(1, 2, 0.04);
  // 8 pcs octopus (variant 2): 0.16 kg batter, 0.08 kg octopus
  insertRecipe.run(2, 1, 0.16);
  insertRecipe.run(2, 2, 0.08);
  // 12 pcs octopus (variant 3): 0.24 kg batter, 0.12 kg octopus
  insertRecipe.run(3, 1, 0.24);
  insertRecipe.run(3, 2, 0.12);

  // 4 pcs crab & cheese (variant 4): 0.08 kg batter, 0.03 kg crab, 0.02 kg cheese
  insertRecipe.run(4, 1, 0.08);
  insertRecipe.run(4, 3, 0.03);
  insertRecipe.run(4, 4, 0.02);
  // 8 pcs crab & cheese (variant 5): 0.16 kg batter, 0.06 kg crab, 0.04 kg cheese
  insertRecipe.run(5, 1, 0.16);
  insertRecipe.run(5, 3, 0.06);
  insertRecipe.run(5, 4, 0.04);
  // 12 pcs crab & cheese (variant 6): 0.24 kg batter, 0.09 kg crab, 0.06 kg cheese
  insertRecipe.run(6, 1, 0.24);
  insertRecipe.run(6, 3, 0.09);
  insertRecipe.run(6, 4, 0.06);

  // Siomai: 4pcs = 4 raw pcs, 8pcs = 8 raw pcs
  insertRecipe.run(7, 5, 4.0);
  insertRecipe.run(8, 5, 8.0);
  insertRecipe.run(9, 6, 4.0);
  insertRecipe.run(10, 6, 8.0);

  // Drinks: 1 cup per drink
  insertRecipe.run(11, 10, 1.0);
  insertRecipe.run(12, 10, 1.0);
  // Water bottle: 1 bottle
  insertRecipe.run(13, 11, 1.0);

  logger.info('Database seeded successfully with initial users, catalog, and recipes.');
}

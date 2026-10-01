-- main/db/migrations/004_category_modifiers.sql
-- Migration 004: Category-level Add-ons and Modifiers

CREATE TABLE IF NOT EXISTS category_modifiers (
    category_id     INTEGER NOT NULL REFERENCES categories(id),
    modifier_id     INTEGER NOT NULL REFERENCES modifiers(id),
    PRIMARY KEY (category_id, modifier_id)
);

-- Backfill category_modifiers from existing product_modifiers
INSERT OR IGNORE INTO category_modifiers (category_id, modifier_id)
SELECT DISTINCT p.category_id, pm.modifier_id
FROM product_modifiers pm
JOIN products p ON pm.product_id = p.id;

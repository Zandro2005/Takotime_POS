-- ============================================================
-- TAKOTIME POS — Schema v1.0
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ──────────────────────────────────────────────
-- Identity & Auth
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    username        TEXT    NOT NULL UNIQUE,
    pin             TEXT,                              -- bcrypt hash of 4-6 digit PIN (staff fast-login)
    password_hash   TEXT    NOT NULL,                  -- bcrypt hash
    role            TEXT    NOT NULL CHECK (role IN ('staff', 'admin_staff', 'admin', 'remote_admin')),
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ──────────────────────────────────────────────
-- Sellable Catalog
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL UNIQUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS products (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    category_id     INTEGER NOT NULL REFERENCES categories(id),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS product_variants (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    label           TEXT    NOT NULL,                   -- "4pcs", "8pcs", "12pcs", "16oz"
    price           REAL    NOT NULL,
    cost            REAL    NOT NULL DEFAULT 0,         -- for margin reports
    sort_order      INTEGER NOT NULL DEFAULT 0,
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS modifiers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,                   -- "Extra Sauce", "Less Sugar", "Extra Nori"
    price_delta     REAL    NOT NULL DEFAULT 0,
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS product_modifiers (
    product_id      INTEGER NOT NULL REFERENCES products(id),
    modifier_id     INTEGER NOT NULL REFERENCES modifiers(id),
    PRIMARY KEY (product_id, modifier_id)
);

CREATE TABLE IF NOT EXISTS category_modifiers (
    category_id     INTEGER NOT NULL REFERENCES categories(id),
    modifier_id     INTEGER NOT NULL REFERENCES modifiers(id),
    PRIMARY KEY (category_id, modifier_id)
);

-- ──────────────────────────────────────────────
-- Shifts & Cash Tracking
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id        INTEGER NOT NULL REFERENCES users(id),
    status          TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'force_closed')),
    opened_at       DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    closed_at       DATETIME,
    starting_cash   REAL    NOT NULL DEFAULT 0,
    ending_cash     REAL,
    expected_cash   REAL,                              -- computed at close: starting + cash sales - cash movements out
    last_queue_no   INTEGER NOT NULL DEFAULT 0,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS cash_movements (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id        INTEGER NOT NULL REFERENCES shifts(id),
    type            TEXT    NOT NULL CHECK (type IN ('cash_in', 'cash_out', 'cash_drop')),
    amount          REAL    NOT NULL,
    reason          TEXT,
    created_by      INTEGER NOT NULL REFERENCES users(id),
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ──────────────────────────────────────────────
-- Orders
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id        INTEGER NOT NULL REFERENCES shifts(id),
    staff_id        INTEGER NOT NULL REFERENCES users(id),
    order_type      TEXT    NOT NULL CHECK (order_type IN ('dine_in', 'takeout')),
    queue_no        INTEGER NOT NULL,
    subtotal        REAL    NOT NULL,
    discount        REAL    NOT NULL DEFAULT 0,
    discount_type   TEXT,                              -- 'senior', 'pwd', 'promo', 'manual'
    discount_reason TEXT,
    total           REAL    NOT NULL,
    payment_method  TEXT    NOT NULL CHECK (payment_method IN ('cash', 'gcash', 'cashless')),
    gcash_ref_no    TEXT,
    amount_tendered REAL,                              -- for cash: how much customer gave
    change_due      REAL,                              -- for cash: change returned
    status          TEXT    NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'voided')),
    voided_at       DATETIME,
    void_reason     TEXT,
    voided_by       INTEGER REFERENCES users(id),
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    synced_at       DATETIME
);

CREATE TABLE IF NOT EXISTS order_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    variant_id      INTEGER NOT NULL REFERENCES product_variants(id),
    qty             INTEGER NOT NULL DEFAULT 1,
    unit_price      REAL    NOT NULL,                  -- snapshot at time of sale
    subtotal        REAL    NOT NULL                   -- unit_price * qty + modifier deltas
);

CREATE TABLE IF NOT EXISTS order_item_modifiers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id   INTEGER NOT NULL REFERENCES order_items(id),
    modifier_id     INTEGER NOT NULL REFERENCES modifiers(id),
    price_delta     REAL    NOT NULL                   -- snapshot at time of sale
);

-- ──────────────────────────────────────────────
-- Inventory
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,                   -- "Flour", "Crab Stick", "Siomai (pre-made)"
    unit            TEXT    NOT NULL,                   -- "kg", "pcs", "liters", "pack"
    min_stock       REAL    NOT NULL DEFAULT 0,         -- threshold for low stock alert
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS inventory_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id         INTEGER NOT NULL REFERENCES inventory_items(id),
    log_date        DATE    NOT NULL,
    beginning_qty   REAL    NOT NULL DEFAULT 0,         -- opening balance
    stock_in        REAL    NOT NULL DEFAULT 0,
    suggested_out   REAL    NOT NULL DEFAULT 0,         -- computed from orders × recipes
    confirmed_out   REAL,                               -- NULL until Admin Staff confirms
    ending_qty      REAL,                               -- beginning_qty + stock_in - confirmed_out
    waste_qty       REAL    GENERATED ALWAYS AS (
                        CASE WHEN confirmed_out IS NOT NULL
                             THEN confirmed_out - suggested_out
                             ELSE NULL END
                    ) STORED,                           -- free shrinkage signal
    prepared_by     INTEGER REFERENCES users(id),
    checked_by      INTEGER REFERENCES users(id),
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE(item_id, log_date)                           -- one row per item per day
);

-- ──────────────────────────────────────────────
-- Bill of Materials (Recipes)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    product_variant_id  INTEGER NOT NULL REFERENCES product_variants(id),
    inventory_item_id   INTEGER NOT NULL REFERENCES inventory_items(id),
    qty_per_unit        REAL    NOT NULL,               -- e.g. 0.05 kg flour per 1 takoyaki
    UNIQUE(product_variant_id, inventory_item_id)
);

-- ──────────────────────────────────────────────
-- Daily Sales Summary (materialized for reports)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_sales_summary (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id        INTEGER NOT NULL REFERENCES shifts(id),
    summary_date    DATE    NOT NULL,
    total_orders    INTEGER NOT NULL DEFAULT 0,
    total_gross     REAL    NOT NULL DEFAULT 0,
    total_discounts REAL    NOT NULL DEFAULT 0,
    total_net       REAL    NOT NULL DEFAULT 0,
    total_voided    INTEGER NOT NULL DEFAULT 0,
    cash_total      REAL    NOT NULL DEFAULT 0,
    gcash_total     REAL    NOT NULL DEFAULT 0,
    computed_at     DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ──────────────────────────────────────────────
-- Settings (key-value store)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    key             TEXT    PRIMARY KEY,
    value           TEXT    NOT NULL,
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ──────────────────────────────────────────────
-- Remote Admin Sync
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    direction       TEXT    NOT NULL CHECK (direction IN ('push', 'pull')),
    status          TEXT    NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
    records_synced  INTEGER NOT NULL DEFAULT 0,
    error_message   TEXT,
    started_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    completed_at    DATETIME
);

CREATE TABLE IF NOT EXISTS applied_admin_actions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id       TEXT    NOT NULL UNIQUE,            -- Firebase key, deduplication anchor
    action_type     TEXT    NOT NULL,
    payload         TEXT    NOT NULL,                   -- JSON
    applied_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ──────────────────────────────────────────────
-- Indices for hot queries
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_shift       ON orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_orders_created     ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_date ON inventory_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product   ON product_variants(product_id);

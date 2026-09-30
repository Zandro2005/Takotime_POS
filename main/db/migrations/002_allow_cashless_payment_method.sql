-- Migration 002: Allow 'cashless' payment method in orders table
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS orders_v2 (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id        INTEGER NOT NULL REFERENCES shifts(id),
    staff_id        INTEGER NOT NULL REFERENCES users(id),
    order_type      TEXT    NOT NULL CHECK (order_type IN ('dine_in', 'takeout')),
    queue_no        INTEGER NOT NULL,
    subtotal        REAL    NOT NULL,
    discount        REAL    NOT NULL DEFAULT 0,
    discount_type   TEXT,
    discount_reason TEXT,
    total           REAL    NOT NULL,
    payment_method  TEXT    NOT NULL CHECK (payment_method IN ('cash', 'gcash', 'cashless')),
    gcash_ref_no    TEXT,
    amount_tendered REAL,
    change_due      REAL,
    status          TEXT    NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'voided')),
    voided_at       DATETIME,
    void_reason     TEXT,
    voided_by       INTEGER REFERENCES users(id),
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    synced_at       DATETIME
);

INSERT INTO orders_v2 SELECT * FROM orders;
DROP TABLE orders;
ALTER TABLE orders_v2 RENAME TO orders;

PRAGMA foreign_keys = ON;

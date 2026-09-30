-- Migration 003: Allow 'remote_admin' role in users table
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS users_v3 (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    username        TEXT    NOT NULL UNIQUE,
    pin             TEXT,
    password_hash   TEXT    NOT NULL,
    role            TEXT    NOT NULL CHECK (role IN ('staff', 'admin_staff', 'admin', 'remote_admin')),
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
);

INSERT INTO users_v3 SELECT * FROM users;
DROP TABLE users;
ALTER TABLE users_v3 RENAME TO users;

PRAGMA foreign_keys = ON;

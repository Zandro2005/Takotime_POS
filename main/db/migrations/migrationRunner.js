// main/db/migrations/migrationRunner.js
// Versioned migration runner tracking schema via PRAGMA user_version

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations(db) {
  logger.info('Starting database migration check...');

  // Get current schema version
  const currentVersionResult = db.pragma('user_version', { simple: true });
  let currentVersion = typeof currentVersionResult === 'number' ? currentVersionResult : 0;
  logger.info(`Current database schema version: ${currentVersion}`);

  // Base schema init if brand new database
  if (currentVersion === 0) {
    logger.info('Database is uninitialized. Applying base schema (schema.sql)...');
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Base schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Run schema in transaction
    db.transaction(() => {
      db.exec(schemaSql);
      // Run seed data if seed.sql exists
      const seedPath = path.join(__dirname, '..', 'seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        db.exec(seedSql);
      }
      db.pragma('user_version = 1');
    })();

    currentVersion = 1;
    logger.info('Base schema and seed data applied successfully. user_version is now 1.');
  }

  // Check for subsequent migrations in migrations directory
  const migrationsDir = __dirname;

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) continue;

    const migrationVersion = parseInt(match[1], 10);
    if (migrationVersion > currentVersion) {
      logger.info(`Applying migration: ${file} (Target version: ${migrationVersion})`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      db.transaction(() => {
        db.exec(sql);
        db.pragma(`user_version = ${migrationVersion}`);
      })();

      currentVersion = migrationVersion;
      logger.info(`Migration ${file} applied successfully. user_version is now ${currentVersion}.`);
    }
  }

  logger.info(`Database schema is up to date at version ${currentVersion}.`);
  return currentVersion;
}

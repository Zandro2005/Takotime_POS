# TAKOTIME POS — Database Migrations

## Rules & Conventions
1. **Never edit `schema.sql` directly once production data exists in the field.**
2. All post-v1 schema alterations must be added here as numbered SQL files:
   - Format: `002_add_column_to_table.sql`, `003_create_new_table.sql`, etc.
   - Version number must be strictly sequential.
3. Every migration file runs inside an atomic transaction managed by `migrationRunner.js`.
4. After applying a migration, `PRAGMA user_version` is updated to match the migration number.
5. All migrations must be idempotent or safe to apply on top of the preceding version.

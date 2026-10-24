import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log('[Migration] No DATABASE_URL specified. Local JSON store is active at data/akhyana_store.json.');
    console.log('[Migration] Skipping PostgreSQL schema execution.');
    return;
  }

  console.log('[Migration] Connecting to PostgreSQL at configured DATABASE_URL...');
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[Migration] Successfully connected to PostgreSQL.');

    // Ensure migrations ledger table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.resolve(process.cwd(), 'src/db/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.warn('[Migration] Migrations directory not found:', migrationsDir);
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const checkRes = await client.query('SELECT name FROM _schema_migrations WHERE name = $1', [file]);
      if (checkRes.rows.length > 0) {
        console.log(`[Migration] ✓ Already applied: ${file}`);
        continue;
      }

      console.log(`[Migration] Executing migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[Migration] ✓ Successfully applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migration] ✗ Failed to apply ${file}:`, err);
        throw err;
      }
    }

    console.log('[Migration] All PostgreSQL migrations are up to date.');
  } catch (err: any) {
    console.error('[Migration] Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

runMigrations();

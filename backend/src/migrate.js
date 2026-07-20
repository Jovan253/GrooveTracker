// Hand-rolled migration runner (see plans/001-project-scaffolding.md).
//
// Applies db/migrations/*.sql in sorted filename order, tracking what's already
// been applied in a `schema_migrations` table. Designed to run as a Kubernetes
// init container or Job: exits 0 on success, non-zero on failure, and never hangs.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolved relative to this module, not process.cwd() — the container's
// workdir may not be the repo root.
const MIGRATIONS_DIR = path.resolve(__dirname, '../../db/migrations');

// Arbitrary constant used as the Postgres advisory lock key. Any int works;
// picked something unlikely to collide with other locks in this DB.
const ADVISORY_LOCK_KEY = 727_386_001;

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((row) => row.filename));
}

async function getMigrationFiles() {
  const entries = await readdir(MIGRATIONS_DIR);
  return entries.filter((name) => name.endsWith('.sql')).sort();
}

async function applyMigration(client, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = await readFile(filePath, 'utf8');

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
  } catch (err) {
    // Don't let a failing ROLLBACK mask the migration error that caused it.
    await client.query('ROLLBACK').catch((rollbackErr) => {
      console.error('ROLLBACK failed:', rollbackErr);
    });
    throw err;
  }
}

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Postgres session-level advisory lock: blocks other holders of the same
    // key until this session releases it (explicitly, or on disconnect). If
    // multiple replicas race to run migrations on startup (plausible with a
    // K8s Job or multiple pods running an init container against the same
    // DB), only one proceeds at a time and the others wait their turn rather
    // than applying migrations concurrently.
    console.log('Acquiring migration lock...');
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);

    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    const files = await getMigrationFiles();

    if (files.length === 0) {
      console.log(`No migration files found in ${MIGRATIONS_DIR}`);
      return;
    }

    for (const filename of files) {
      if (applied.has(filename)) {
        console.log(`Skipping ${filename} (already applied)`);
        continue;
      }

      console.log(`Applying ${filename}...`);
      await applyMigration(client, filename);
      console.log(`Applied ${filename}`);
    }

    console.log('Migrations complete.');
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]).catch(() => {
      // Best effort — the lock is released automatically when the session
      // (connection) ends, which happens right after this via client.release().
    });
    client.release();
  }
}

runMigrations()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Migration failed:', err);
    await pool.end();
    process.exit(1);
  });

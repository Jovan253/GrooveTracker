// Applies db/seed.sql for local development. Separate from migrate.js on
// purpose — seeding is a dev convenience, not part of the migration path that
// will run as a K8s init container/Job.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.resolve(__dirname, '../../db/seed.sql');

async function runSeed() {
  const sql = await readFile(SEED_FILE, 'utf8');
  console.log(`Applying seed data from ${SEED_FILE}...`);
  await pool.query(sql);
  console.log('Seed complete.');
}

runSeed()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seed failed:', err);
    await pool.end();
    process.exit(1);
  });

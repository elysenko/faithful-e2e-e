'use strict';
/**
 * Production seed — runs with plain `node`, no TypeScript toolchain needed.
 * Dependencies: pg + bcryptjs (both in package.json "dependencies").
 * Usage:  node prisma/seed/seed.js
 * Called by: docker-entrypoint.sh (and `npx prisma db seed` via package.json "prisma.seed")
 *
 * Prints one `SEED_CRED <role> <email> <password>` line per user on stdout
 * every boot; the Colossus platform captures credentials from these logs.
 */
const { Pool } = require('pg');
const { createHash, randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');

function derivePassword(email) {
  return createHash('sha256')
    .update(email + (process.env.SEED_SECRET || 'colossus-seed'))
    .digest('hex')
    .slice(0, 16);
}

const SEED_USERS = [
  { name: 'Admin Name', email: 'admin@faithful-e.test', role: 'admin' },
  { name: 'User Name',  email: 'user@faithful-e.test',  role: 'user'  },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    for (const u of SEED_USERS) {
      const plain  = derivePassword(u.email);
      const hashed = bcrypt.hashSync(plain, 10);
      await pool.query(
        `INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5::"Role", now(), now())
         ON CONFLICT (email) DO UPDATE
           SET name     = EXCLUDED.name,
               password = EXCLUDED.password,
               role     = EXCLUDED.role,
               "updatedAt" = now()`,
        [randomUUID(), u.name, u.email, hashed, u.role],
      );
      console.log(`SEED_CRED ${u.role} ${u.email} ${plain}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });

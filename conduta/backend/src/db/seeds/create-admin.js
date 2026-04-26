#!/usr/bin/env node
/**
 * Cria o primeiro usuário admin.
 * Uso: node src/db/seeds/create-admin.js <email> <nome> <senha>
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../pg');

async function main() {
  const [, , email, nome, senha] = process.argv;

  if (!email || !nome || !senha) {
    console.error('Uso: node src/db/seeds/create-admin.js <email> <nome> <senha>');
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const result = await pool.query(
    `INSERT INTO users (email, nome, senha_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET role = 'admin'
     RETURNING id, email, nome, role, created_at`,
    [email, nome, senhaHash]
  );

  console.log('Admin criado/atualizado:', result.rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

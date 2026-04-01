require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pg');

async function migrate() {
  const migrationPath = path.join(__dirname, 'migrations', '001_initial.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('Migration executada com sucesso.');
  } catch (err) {
    console.error('Erro na migration:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

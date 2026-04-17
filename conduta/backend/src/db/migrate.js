require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pg');

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`Migration executada: ${file}`);
    } catch (err) {
      console.error(`Erro na migration ${file}:`, err.message);
      process.exit(1);
    }
  }

  await pool.end();
}

migrate();

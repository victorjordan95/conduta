/**
 * migrate-neo4j-status.js
 * Adds status:"verified" to all existing nodes and relationships that lack it.
 * Idempotent — safe to run multiple times.
 *
 * Usage: node src/db/migrate-neo4j-status.js
 */
require('dotenv').config();
const driver = require('./neo4j');

async function migrate() {
  const session = driver.session();
  try {
    console.log('\n=== Neo4j Migration: add status property ===\n');

    const queries = [
      `MATCH (n:Diagnostico) WHERE n.status IS NULL SET n.status = 'verified'`,
      `MATCH (n:Medicamento)  WHERE n.status IS NULL SET n.status = 'verified'`,
      `MATCH (n:RedFlag)      WHERE n.status IS NULL SET n.status = 'verified'`,
      `MATCH ()-[r:TRATA_COM]->() WHERE r.status IS NULL SET r.status = 'verified'`,
    ];

    for (const q of queries) {
      const result = await session.run(q);
      console.log(`✓ ${q.split('MATCH')[1].split('WHERE')[0].trim()} — ${result.summary.counters.updates().propertiesSet} propriedades definidas`);
    }

    console.log('\n✓ Migração concluída.\n');
  } catch (err) {
    console.error('Erro na migração:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

migrate();

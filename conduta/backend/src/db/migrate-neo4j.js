require('dotenv').config();
const fs = require('fs');
const path = require('path');
const graphDriver = require('./neo4j');

function splitStatements(cypher) {
  return cypher
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function isSchemaStatement(statement) {
  return /^CREATE\s+(?:CONSTRAINT|INDEX|FULLTEXT\s+INDEX|VECTOR\s+INDEX)\b/i.test(statement);
}

function loadMigrations(directory = path.join(__dirname, 'neo4j-migrations')) {
  return fs.readdirSync(directory)
    .filter((file) => /^\d+_.+\.cypher$/.test(file))
    .sort()
    .map((file) => ({
      id: path.basename(file, '.cypher'),
      cypher: fs.readFileSync(path.join(directory, file), 'utf8'),
    }));
}

async function applyMigration(session, migration) {
  const existing = await session.run(
    'MATCH (m:SchemaMigration {id: $id}) RETURN m.id AS id LIMIT 1',
    { id: migration.id }
  );
  if (existing.records.length > 0) return { id: migration.id, applied: false };

  const statements = splitStatements(migration.cypher);
  if (statements.every(isSchemaStatement)) {
    // Neo4j does not permit schema DDL and data writes in the same transaction.
    // DDL is idempotent (IF NOT EXISTS); if marker creation fails, the next run
    // safely replays it and then records the migration.
    for (const statement of statements) {
      await session.run(statement);
    }
    await session.executeWrite(async (tx) => {
      await tx.run(
        `CREATE (m:SchemaMigration {id: $id, appliedAt: $appliedAt})`,
        { id: migration.id, appliedAt: new Date().toISOString() }
      );
    });
  } else {
    await session.executeWrite(async (tx) => {
      for (const statement of statements) {
        await tx.run(statement);
      }
      await tx.run(
        `CREATE (m:SchemaMigration {id: $id, appliedAt: $appliedAt})`,
        { id: migration.id, appliedAt: new Date().toISOString() }
      );
    });
  }
  return { id: migration.id, applied: true };
}

async function runMigrations({ driver = graphDriver, directory } = {}) {
  if (!driver) throw new Error('NEO4J_URI não configurado.');

  const session = driver.session();
  try {
    const results = [];
    for (const migration of loadMigrations(directory)) {
      results.push(await applyMigration(session, migration));
    }
    return results;
  } finally {
    await session.close();
  }
}

if (require.main === module) {
  runMigrations()
    .then((results) => results.forEach((result) => console.log(`[neo4j-migrate] ${result.applied ? 'applied' : 'skipped'} ${result.id}`)))
    .catch((err) => {
      console.error('[neo4j-migrate] failed:', err.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (graphDriver) await graphDriver.close();
    });
}

module.exports = { applyMigration, isSchemaStatement, loadMigrations, runMigrations, splitStatements };

const neo4j = require('neo4j-driver');
require('dotenv').config();

let driver = null;

if (process.env.NEO4J_URI) {
  try {
    driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
    );
    console.log('[Neo4j] Driver inicializado:', process.env.NEO4J_URI);
  } catch (err) {
    console.error('[Neo4j] Falha ao inicializar driver:', err.message);
  }
} else {
  console.warn('[Neo4j] NEO4J_URI não definido — driver desabilitado');
}

module.exports = driver;

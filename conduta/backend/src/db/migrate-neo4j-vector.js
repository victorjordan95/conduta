require('dotenv').config();
const driver = require('../db/neo4j');

async function run() {
  if (!driver) {
    console.error('NEO4J_URI não configurado — abortando.');
    process.exit(1);
  }
  const session = driver.session();
  try {
    await session.run(`
      CREATE VECTOR INDEX documentoChunkEmbedding IF NOT EXISTS
      FOR (n:DocumentoChunk) ON n.embedding
      OPTIONS { indexConfig: {
        \`vector.dimensions\`: 1536,
        \`vector.similarity_function\`: 'cosine'
      }}
    `);
    console.log('[neo4j-vector] Vector index criado (ou já existia).');
  } catch (err) {
    console.error('[neo4j-vector] Erro:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

run();

const pdfParse = require('pdf-parse');
const { randomUUID } = require('crypto');
const driver = require('../db/neo4j');
const { embed } = require('./embeddings');

const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 50;

function chunkText(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(' ');
    chunks.push(chunk);
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function ingestPDF(buffer, fonte) {
  if (!driver) throw new Error('Neo4j não configurado');

  const data = await pdfParse(buffer);
  const text = data.text.replace(/\s+/g, ' ').trim();
  const chunks = chunkText(text);

  const session = driver.session();
  let created = 0;

  try {
    for (const chunk of chunks) {
      const embedding = await embed(chunk);
      await session.run(
        `CREATE (n:DocumentoChunk {
          id: $id,
          texto: $texto,
          fonte: $fonte,
          embedding: $embedding,
          status: 'active',
          createdAt: $createdAt
        })`,
        {
          id: randomUUID(),
          texto: chunk,
          fonte,
          embedding,
          createdAt: new Date().toISOString(),
        }
      );
      created++;
    }
  } finally {
    await session.close();
  }

  return { chunks: created, fonte };
}

async function listDocuments() {
  if (!driver) return [];
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (n:DocumentoChunk {status: 'active'})
      RETURN n.fonte AS fonte, count(n) AS total
      ORDER BY n.fonte
    `);
    return result.records.map((r) => ({
      fonte: r.get('fonte'),
      chunks: r.get('total').toNumber(),
    }));
  } finally {
    await session.close();
  }
}

module.exports = { chunkText, ingestPDF, listDocuments };

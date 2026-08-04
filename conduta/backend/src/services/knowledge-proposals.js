const { randomUUID } = require('crypto');
const driver = require('../db/neo4j');

const PROPOSAL_TYPES = new Set(['clinical_extraction']);
const FEEDBACK_TYPES = new Set(['positive', 'negative', 'partial']);

async function write(cypher, params) {
  if (!driver) return null;

  const session = driver.session();
  try {
    return await session.run(cypher, params);
  } finally {
    await session.close();
  }
}

async function createProposal({ type, payload, sourceSessionId }) {
  if (!PROPOSAL_TYPES.has(type)) throw new Error('Tipo de proposta inválido.');
  if (!sourceSessionId) throw new Error('sourceSessionId é obrigatório.');

  const id = randomUUID();
  const status = 'pending_review';
  const result = await write(
    `CREATE (p:PropostaConhecimento {
       id: $id,
       tipo: $type,
       payload: $payload,
       sourceSessionId: $sourceSessionId,
       status: $status,
       createdAt: $createdAt
     })
     RETURN p.id AS id`,
    {
      id,
      type,
      payload: JSON.stringify(payload),
      sourceSessionId,
      status,
      createdAt: new Date().toISOString(),
    }
  );

  if (!result) return null;
  return { id: result.records[0].get('id'), status };
}

async function createFeedbackSignal({ type, note, sourceSessionId }) {
  if (!FEEDBACK_TYPES.has(type)) throw new Error('Tipo de feedback inválido.');
  if (!sourceSessionId) throw new Error('sourceSessionId é obrigatório.');

  const id = randomUUID();
  const result = await write(
    `CREATE (s:SinalFeedback {
       id: $id,
       tipo: $type,
       nota: $note,
       sourceSessionId: $sourceSessionId,
       status: 'recorded',
       createdAt: $createdAt
     })
     RETURN s.id AS id`,
    {
      id,
      type,
      note: note?.trim() || null,
      sourceSessionId,
      createdAt: new Date().toISOString(),
    }
  );

  if (!result) return null;
  return { id: result.records[0].get('id'), status: 'recorded' };
}

module.exports = { createFeedbackSignal, createProposal };

/**
 * knowledge-extractor.js
 *
 * Async service that extracts clinical entities from an LLM response text
 * and persists them as status:"pending" nodes in Neo4j for admin review.
 *
 * Called fire-and-forget from analyze.js — never throws to the caller.
 */
const OpenAI = require('openai');
const driver = require('../db/neo4j');

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'Conduta',
  },
});

const EXTRACTION_SYSTEM = `Você é um extrator de entidades clínicas.
Dado um texto clínico em português, extraia APENAS entidades que sejam realmente novas informações clínicas — diagnósticos, medicamentos e relações de tratamento.
Retorne SOMENTE JSON válido com o seguinte schema, sem nenhum texto extra:
{
  "diagnosticos": [{ "nome": string, "cid": string|null, "sinonimos": string[], "redFlags": string[], "excluir": string[] }],
  "medicamentos": [{ "nome": string, "classe": string|null, "viaAdmin": string|null }],
  "relacoes": [{ "diagnostico": string, "medicamento": string, "dose": string, "linha": string, "obs": string|null }]
}
Se não houver entidades novas, retorne {"diagnosticos":[],"medicamentos":[],"relacoes":[]}.`;

/**
 * Extracts clinical entities from responseText and persists new ones
 * as pending nodes in Neo4j.
 *
 * @param {string} responseText - Full LLM response content
 * @param {string} sessionId    - PostgreSQL session ID (for traceability)
 */
async function extractAndPersist(responseText, sessionId) {
  if (!driver) return;
  const session = driver.session();
  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-5',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        { role: 'user', content: responseText },
      ],
      stream: false,
    });

    const raw = completion.choices[0]?.message?.content || '';
    let extracted;
    try {
      extracted = JSON.parse(raw);
    } catch {
      console.warn('[extractor] Resposta do LLM não é JSON válido — ignorando.');
      return;
    }

    const { diagnosticos = [], medicamentos = [], relacoes = [] } = extracted;
    const now = new Date().toISOString();

    let createdDiag = 0, createdMed = 0, createdRel = 0;

    // Persist pending Diagnostico nodes
    for (const d of diagnosticos) {
      if (!d.nome) continue;
      const exists = await session.run(
        `MATCH (n:Diagnostico {nome: $nome}) RETURN n.status AS status LIMIT 1`,
        { nome: d.nome }
      );
      if (exists.records.length > 0) continue;

      await session.run(
        `CREATE (n:Diagnostico {
           nome: $nome, cid: $cid, sinonimos: $sinonimos,
           status: 'pending', sourceSessionId: $sourceSessionId, createdAt: $createdAt
         })`,
        {
          nome: d.nome,
          cid: d.cid || '',
          sinonimos: d.sinonimos || [],
          sourceSessionId: sessionId,
          createdAt: now,
        }
      );
      createdDiag++;
    }

    // Persist pending Medicamento nodes
    for (const m of medicamentos) {
      if (!m.nome) continue;
      const exists = await session.run(
        `MATCH (n:Medicamento {nome: $nome}) RETURN n.status AS status LIMIT 1`,
        { nome: m.nome }
      );
      if (exists.records.length > 0) continue;

      await session.run(
        `CREATE (n:Medicamento {
           nome: $nome, classe: $classe, viaAdmin: $viaAdmin,
           status: 'pending', sourceSessionId: $sourceSessionId, createdAt: $createdAt
         })`,
        {
          nome: m.nome,
          classe: m.classe || '',
          viaAdmin: m.viaAdmin || '',
          sourceSessionId: sessionId,
          createdAt: now,
        }
      );
      createdMed++;
    }

    // Persist pending TRATA_COM relationships (only if both nodes exist)
    for (const rel of relacoes) {
      if (!rel.diagnostico || !rel.medicamento) continue;
      const result = await session.run(
        `MATCH (d:Diagnostico {nome: $diagnostico})
         MATCH (m:Medicamento {nome: $medicamento})
         MERGE (d)-[r:TRATA_COM]->(m)
         ON CREATE SET r.dose = $dose, r.linha = $linha, r.obs = $obs,
                       r.status = 'pending', r.sourceSessionId = $sourceSessionId, r.createdAt = $createdAt
         ON MATCH SET r.status = CASE WHEN r.status IS NULL THEN 'pending' ELSE r.status END
         RETURN r.status AS status`,
        {
          diagnostico: rel.diagnostico,
          medicamento: rel.medicamento,
          dose: rel.dose || '',
          linha: rel.linha || '',
          obs: rel.obs || '',
          sourceSessionId: sessionId,
          createdAt: now,
        }
      );
      if (result.records.length > 0) createdRel++;
    }

    const total = createdDiag + createdMed + createdRel;
    if (total > 0) {
      console.log(`[extractor] session ${sessionId}: ${createdDiag} diagnósticos, ${createdMed} medicamentos, ${createdRel} relações pendentes criados.`);
    }
  } catch (err) {
    console.error('[extractor] Erro (non-fatal):', err.message);
  } finally {
    await session.close();
  }
}

module.exports = { extractAndPersist };

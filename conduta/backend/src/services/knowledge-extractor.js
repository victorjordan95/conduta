/**
 * Extracts candidate clinical knowledge from an LLM response.
 * Candidates remain outside the canonical graph until an administrator reviews them.
 */
const OpenAI = require('openai');
const driver = require('../db/neo4j');
const { createProposal } = require('./knowledge-proposals');

function getClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Conduta',
    },
  });
}

const EXTRACTION_SYSTEM = `Você é um extrator de entidades clínicas.
Dado um texto clínico em português, extraia APENAS entidades que sejam realmente novas informações clínicas — diagnósticos, medicamentos e relações de tratamento.
Retorne SOMENTE JSON válido com o seguinte schema, sem nenhum texto extra:
{
  "diagnosticos": [{ "nome": string, "cid": string|null, "sinonimos": string[], "redFlags": string[], "excluir": string[] }],
  "medicamentos": [{ "nome": string, "classe": string|null, "viaAdmin": string|null }],
  "relacoes": [{ "diagnostico": string, "medicamento": string, "dose": string, "linha": string, "obs": string|null }]
}
Se não houver entidades novas, retorne {"diagnosticos":[],"medicamentos":[],"relacoes":[]}.`;

async function extractAndPersist(responseText, sessionId) {
  if (!driver) return;

  try {
    const completion = await getClient().chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-5',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        { role: 'user', content: responseText },
      ],
      stream: false,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      console.warn('[extractor] Resposta do LLM não é JSON válido. Raw:', raw.slice(0, 200));
      return;
    }

    const { diagnosticos = [], medicamentos = [], relacoes = [] } = extracted;
    const entityCount = diagnosticos.length + medicamentos.length + relacoes.length;
    if (entityCount === 0) return;

    await createProposal({
      type: 'clinical_extraction',
      payload: { diagnosticos, medicamentos, relacoes },
      sourceSessionId: sessionId,
    });

    console.log(`[extractor] session ${sessionId}: proposta clínica pendente criada (${entityCount} entidades/relações extraídas).`);
  } catch (err) {
    console.error('[extractor] Erro (non-fatal):', err.message);
  }
}

module.exports = { extractAndPersist };

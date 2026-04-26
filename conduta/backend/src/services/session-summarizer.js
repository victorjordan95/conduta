const OpenAI = require('openai');
const pool = require('../db/pg');

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('[summarizer] OPENROUTER_API_KEY não definido');
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Conduta',
    },
  });
}

const EXTRACTION_PROMPT = `Extraia do texto clínico abaixo um resumo estruturado.
Retorne SOMENTE JSON válido sem texto extra, com este schema:
{"hipotese":"<hipótese principal>","conduta":"<conduta imediata>","alertas":["<alerta1>","<alerta2>"]}
Se não houver alertas, use array vazio.`;

async function generateAndSave(sessionId, responseText) {
  const client = getClient();
  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: responseText.slice(0, 4000) },
      ],
      stream: false,
    });

    const raw = completion.choices[0]?.message?.content || '';
    let summary;
    try {
      summary = JSON.parse(raw);
    } catch {
      console.warn('[summarizer] Resposta não é JSON válido — ignorando.');
      return;
    }

    await pool.query(
      'UPDATE sessions SET summary = $1 WHERE id = $2',
      [JSON.stringify(summary), sessionId]
    );
  } catch (err) {
    console.error('[summarizer] Erro (non-fatal):', err.message);
  }
}

module.exports = { generateAndSave };

const pool = require('../db/pg');
const { embed } = require('./embeddings');

async function searchSimilarCases(content, userId) {
  try {
    const queryEmbedding = await embed(content);

    const result = await pool.query(
      `SELECT m.content, s.summary
       FROM messages m
       JOIN sessions s ON s.id = m.session_id
       WHERE m.role = 'user'
         AND m.embedding IS NOT NULL
         AND s.user_id != $1
         AND NOT EXISTS (
           SELECT 1 FROM messages m2
           WHERE m2.session_id = m.session_id
             AND m2.role = 'assistant'
             AND m2.feedback = 'negative'
         )
       ORDER BY m.embedding <=> $2::vector
       LIMIT 3`,
      [userId, JSON.stringify(queryEmbedding)]
    );

    if (result.rows.length === 0) return null;

    const lines = result.rows
      .filter((r) => r.summary)
      .map((r) => {
        const s = r.summary;
        const trecho = r.content.slice(0, 100).replace(/\n/g, ' ');
        return `- Caso similar: ${trecho}... → Hipótese: ${s.hipotese} | Conduta: ${s.conduta}`;
      });

    if (lines.length === 0) return null;

    return `Casos similares atendidos anteriormente:\n${lines.join('\n')}`;
  } catch (err) {
    console.error('[case-search] error (non-fatal):', err.message);
    return null;
  }
}

module.exports = { searchSimilarCases };

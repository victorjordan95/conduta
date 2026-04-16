const express = require('express');
const pool = require('../db/pg');
const driver = require('../db/neo4j');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { message_id, feedback, note } = req.body;

  if (!message_id || !['positive', 'negative'].includes(feedback)) {
    return res.status(400).json({ error: 'message_id e feedback (positive|negative) são obrigatórios.' });
  }

  if (note && note.length > 1000) {
    return res.status(400).json({ error: 'Nota não pode exceder 1000 caracteres.' });
  }

  try {
    // Salva feedback + nota + obtém session_id
    const result = await pool.query(
      `UPDATE messages SET feedback = $1, feedback_note = $2
       WHERE id = $3
         AND session_id IN (SELECT id FROM sessions WHERE user_id = $4)
       RETURNING session_id`,
      [feedback, note || null, message_id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }

    const sessionId = result.rows[0].session_id;

    applyKnowledgeFeedback(sessionId, feedback, note).catch((err) =>
      console.error('[feedback] erro ao aplicar no grafo:', err.message)
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Erro no /feedback:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

/**
 * Positivo → aprova nós/relações pendentes da sessão no Neo4j.
 * Negativo → remove nós pendentes + cria Correcao node com keywords da nota.
 */
async function applyKnowledgeFeedback(sessionId, feedback, note) {
  const session = driver.session();
  try {
    if (feedback === 'positive') {
      await session.run(
        `MATCH (n {status: 'pending', sourceSessionId: $sessionId})
         SET n.status = 'verified', n.approvedBy = 'feedback:positive', n.approvedAt = $now`,
        { sessionId, now: new Date().toISOString() }
      );
      await session.run(
        `MATCH ()-[r:TRATA_COM {status: 'pending', sourceSessionId: $sessionId}]->()
         SET r.status = 'verified', r.approvedBy = 'feedback:positive', r.approvedAt = $now`,
        { sessionId, now: new Date().toISOString() }
      );
    } else {
      // Remove nós pendentes da sessão
      await session.run(
        `MATCH (n {status: 'pending', sourceSessionId: $sessionId}) DETACH DELETE n`,
        { sessionId }
      );

      // Cria Correcao node para alimentar contexto futuro
      if (note && note.trim().length > 0) {
        const keywords = extractKeywords(note);
        await session.run(
          `CREATE (c:Correcao {
             sessionId: $sessionId,
             nota: $nota,
             keywords: $keywords,
             status: 'active',
             createdAt: $now
           })`,
          { sessionId, nota: note.trim(), keywords, now: new Date().toISOString() }
        );
        console.log(`[feedback] Correcao criada para session ${sessionId}: "${note.trim().slice(0, 60)}..."`);
      }
    }
  } finally {
    await session.close();
  }
}

/** Extrai termos com 4+ letras para indexação no grafo */
function extractKeywords(text) {
  return [...new Set(
    text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .slice(0, 20)
  )];
}

module.exports = router;

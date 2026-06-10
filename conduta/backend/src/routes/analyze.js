const express = require('express');
const pool = require('../db/pg');
const { collectAnalysis, streamReview, streamQuick } = require('../services/openrouter');
const { searchClinicalContext, searchFollowUpContext } = require('../services/neo4j-search');
const { searchSimilarCases } = require('../services/case-search');
const { extractAndPersist } = require('../services/knowledge-extractor');
const { generateAndSave } = require('../services/session-summarizer');
const { embed } = require('../services/embeddings');

const router = express.Router();

router.post('/', async (req, res) => {
  const { session_id, content, mode = 'completa' } = req.body;

  if (!session_id || !content) {
    return res.status(400).json({ error: 'session_id e content são obrigatórios.' });
  }

  if (!['rapida', 'completa'].includes(mode)) {
    return res.status(400).json({ error: "mode deve ser 'rapida' ou 'completa'." });
  }

  if (content.length > 8000) {
    return res.status(400).json({ error: 'Conteúdo não pode exceder 8000 caracteres.' });
  }

  try {
    const sessionCheck = await pool.query(
      'SELECT id, summary FROM sessions WHERE id = $1 AND user_id = $2',
      [session_id, req.userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    const sessionSummary = sessionCheck.rows[0].summary;

    const historyResult = await pool.query(
      `SELECT role, content FROM messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [session_id]
    );
    const history = historyResult.rows;

    if (history.length === 0) {
      const titulo = content.trim().slice(0, 60).replace(/\s+/g, ' ');
      await pool.query(
        'UPDATE sessions SET titulo = $1 WHERE id = $2',
        [titulo, session_id]
      );
    }

    const userMsgResult = await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3) RETURNING id',
      [session_id, 'user', content]
    );
    const userMessageId = userMsgResult.rows[0].id;

    const isFirstMessage = history.length === 0;
    const [neo4jContext, similarCases] = isFirstMessage
      ? await Promise.all([
          searchClinicalContext(content),
          searchSimilarCases(content, req.userId),
        ])
      : await Promise.all([
          searchFollowUpContext(content),
          Promise.resolve(null),
        ]);

    const contextParts = [neo4jContext, similarCases].filter(Boolean);
    const context = contextParts.length > 0 ? contextParts.join('\n\n---\n\n') : null;

    const summaryForStream = !isFirstMessage ? sessionSummary : null;

    const sessionMsgCount = history.filter((m) => m.role === 'user').length;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ session_msg_count: sessionMsgCount })}\n\n`);

    let fullReview;
    if (mode === 'rapida') {
      // ── Modo conduta rápida: chamada única streaming ──
      fullReview = await streamQuick(history, content, context, summaryForStream, res).catch((err) => {
        console.error('[analyze] quick error:', err.message);
        return null;
      });
    } else {
      // ── Fase 1: análise primária silenciosa (contexto interno) ──
      const firstAnalysis = await collectAnalysis(history, content, context, summaryForStream);

      // ── Fase 2: revisão final — única resposta visível ao usuário ──
      fullReview = await streamReview(content, firstAnalysis || '', res, history).catch((err) => {
        console.error('[analyze] review error:', err.message);
        return null;
      });
    }

    if (fullReview) {
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [session_id, 'assistant', fullReview]
      );

      extractAndPersist(fullReview, session_id).catch((err) =>
        console.error('[analyze] extractor fire-and-forget error:', err.message)
      );

      if (isFirstMessage) {
        generateAndSave(session_id, fullReview).catch((err) =>
          console.error('[analyze] summarizer fire-and-forget error:', err.message)
        );
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

    embed(content)
      .then((embedding) =>
        pool.query(
          'UPDATE messages SET embedding = $1 WHERE id = $2',
          [JSON.stringify(embedding), userMessageId]
        )
      )
      .catch((err) => console.error('[analyze] embed fire-and-forget error:', err.message));
  } catch (err) {
    console.error('Erro no /analyze:', err.message);
    if (!res.headersSent) {
      const status = err?.status ?? err?.response?.status;
      if (status === 429) {
        return res.status(429).json({ error: 'Serviço temporariamente sobrecarregado. Tente novamente em alguns segundos.' });
      }
      res.status(500).json({ error: 'Erro ao processar análise.' });
    }
  }
});

module.exports = router;

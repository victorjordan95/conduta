const express = require('express');
const pool = require('../db/pg');
const authMiddleware = require('../middleware/auth');
const { streamAnalysis } = require('../services/openrouter');
const { searchClinicalContext } = require('../services/neo4j-search');
const { searchSimilarCases } = require('../services/case-search');
const { extractAndPersist } = require('../services/knowledge-extractor');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { session_id, content } = req.body;

  if (!session_id || !content) {
    return res.status(400).json({ error: 'session_id e content são obrigatórios.' });
  }

  if (content.length > 8000) {
    return res.status(400).json({ error: 'Conteúdo não pode exceder 8000 caracteres.' });
  }

  try {
    // Verifica que a sessão pertence ao usuário autenticado
    const sessionCheck = await pool.query(
      'SELECT id FROM sessions WHERE id = $1 AND user_id = $2',
      [session_id, req.userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    // Busca histórico da sessão
    const historyResult = await pool.query(
      `SELECT role, content FROM messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [session_id]
    );
    const history = historyResult.rows;

    // Auto-título na primeira mensagem da sessão
    if (history.length === 0) {
      const titulo = content.trim().slice(0, 60).replace(/\s+/g, ' ');
      await pool.query(
        'UPDATE sessions SET titulo = $1 WHERE id = $2',
        [titulo, session_id]
      );
    }

    // Persiste mensagem do usuário antes de iniciar o stream
    await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
      [session_id, 'user', content]
    );

    // Busca contexto clínico apenas na primeira mensagem da sessão.
    // Em perguntas de follow-up, o histórico já contém o contexto necessário;
    // re-injetar contexto Neo4j com o texto da pergunta causa o modelo a repetir
    // a análise completa em vez de responder pontualmente.
    const isFirstMessage = history.length === 0;
    const [neo4jContext, similarCases] = isFirstMessage
      ? await Promise.all([
          searchClinicalContext(content),
          searchSimilarCases(content, req.userId),
        ])
      : [null, null];

    const contextParts = [neo4jContext, similarCases].filter(Boolean);
    const context = contextParts.length > 0 ? contextParts.join('\n\n---\n\n') : null;

    // Inicia stream e captura resposta completa para salvar
    const fullResponse = await streamAnalysis(history, content, context, res);

    // Persiste resposta do assistente após stream terminar
    if (fullResponse) {
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [session_id, 'assistant', fullResponse]
      );

      // Extração assíncrona de entidades clínicas — fire-and-forget (não bloqueia resposta)
      extractAndPersist(fullResponse, session_id).catch((err) =>
        console.error('[analyze] extractor fire-and-forget error:', err.message)
      );
    }
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

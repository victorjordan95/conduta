const express = require('express');
const pool = require('../db/pg');
const authMiddleware = require('../middleware/auth');
const { streamAnalysis } = require('../services/openrouter');
const { searchClinicalContext } = require('../services/neo4j-search');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { session_id, content } = req.body;

  if (!session_id || !content) {
    return res.status(400).json({ error: 'session_id e content são obrigatórios.' });
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

    // Persiste mensagem do usuário antes de iniciar o stream
    await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
      [session_id, 'user', content]
    );

    // Busca contexto clínico no Neo4j (non-fatal se falhar)
    const neo4jContext = await searchClinicalContext(content);

    // Inicia stream e captura resposta completa para salvar
    const fullResponse = await streamAnalysis(history, content, neo4jContext, res);

    // Persiste resposta do assistente após stream terminar
    if (fullResponse) {
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [session_id, 'assistant', fullResponse]
      );
    }
  } catch (err) {
    console.error('Erro no /analyze:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao processar análise.' });
    }
  }
});

module.exports = router;

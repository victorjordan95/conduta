const express = require('express');
const pool = require('../db/pg');
const authMiddleware = require('../middleware/auth');
const driver = require('../db/neo4j');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const result = isAdmin
      ? await pool.query(
          `SELECT s.id, s.titulo, s.created_at, u.email AS user_email, u.nome AS user_nome
           FROM sessions s
           JOIN users u ON u.id = s.user_id
           ORDER BY s.created_at DESC`
        )
      : await pool.query(
          `SELECT id, titulo, created_at
           FROM sessions
           WHERE user_id = $1
           ORDER BY created_at DESC`,
          [req.userId]
        );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', async (req, res) => {
  if (req.userRole === 'admin') {
    return res.status(403).json({ error: 'Admin não pode criar sessões.' });
  }

  const { titulo } = req.body;
  const tituloFinal = titulo || 'Novo caso';

  try {
    const result = await pool.query(
      `INSERT INTO sessions (user_id, titulo)
       VALUES ($1, $2)
       RETURNING id, titulo, created_at`,
      [req.userId, tituloFinal]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const sessionResult = isAdmin
      ? await pool.query(
          `SELECT s.id, s.titulo, s.created_at, s.summary, u.email AS user_email, u.nome AS user_nome
           FROM sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.id = $1`,
          [req.params.id]
        )
      : await pool.query(
          'SELECT id, titulo, created_at, summary FROM sessions WHERE id = $1 AND user_id = $2',
          [req.params.id, req.userId]
        );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    const messagesResult = isAdmin
      ? await pool.query(
          `SELECT id, role, content, created_at
           FROM messages
           WHERE session_id = $1
           ORDER BY created_at ASC`,
          [req.params.id]
        )
      : await pool.query(
          `SELECT m.id, m.role, m.content, m.created_at
           FROM messages m
           JOIN sessions s ON s.id = m.session_id
           WHERE m.session_id = $1 AND s.user_id = $2
           ORDER BY m.created_at ASC`,
          [req.params.id, req.userId]
        );

    res.json({
      session: sessionResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.put('/:id', async (req, res) => {
  const { titulo } = req.body;
  if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
    return res.status(400).json({ error: 'Título é obrigatório.' });
  }
  if (titulo.trim().length > 100) {
    return res.status(400).json({ error: 'Título deve ter no máximo 100 caracteres.' });
  }
  try {
    const result = await pool.query(
      `UPDATE sessions SET titulo = $1 WHERE id = $2 AND user_id = $3 RETURNING id, titulo, created_at`,
      [titulo.trim(), req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sessão não encontrada.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[sessions] renomear:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT id FROM sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Sessão não encontrada.' });
    await pool.query('BEGIN');
    try {
      await pool.query('DELETE FROM messages WHERE session_id = $1', [req.params.id]);
      await pool.query('DELETE FROM sessions WHERE id = $1', [req.params.id]);
      await pool.query('COMMIT');
    } catch (txErr) {
      await pool.query('ROLLBACK');
      throw txErr;
    }
    res.status(204).send();
  } catch (err) {
    console.error('[sessions] excluir:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/:id/entities', async (req, res) => {
  try {
    const sessionCheck = await pool.query(
      'SELECT id FROM sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }
  } catch (err) {
    console.error('[sessions] entities — pg:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }

  if (!driver) {
    return res.json({ diagnosticos: [], medicamentos: [] });
  }

  const neo4jSession = driver.session();
  try {
    const diagResult = await neo4jSession.run(
      `MATCH (d:Diagnostico) WHERE d.sourceSessionId = $sessionId AND d.status IN ["pending", "verified"]
       RETURN d.nome AS nome, d.cid AS cid, d.status AS status`,
      { sessionId: req.params.id }
    );
    const medResult = await neo4jSession.run(
      `MATCH (m:Medicamento) WHERE m.sourceSessionId = $sessionId AND m.status IN ["pending", "verified"]
       RETURN m.nome AS nome, m.classe AS classe, m.viaAdmin AS viaAdmin, m.status AS status`,
      { sessionId: req.params.id }
    );

    const diagnosticos = diagResult.records.map(r => ({
      nome: r.get('nome'),
      cid: r.get('cid'),
      status: r.get('status'),
    }));
    const medicamentos = medResult.records.map(r => ({
      nome: r.get('nome'),
      classe: r.get('classe'),
      viaAdmin: r.get('viaAdmin'),
      status: r.get('status'),
    }));

    res.json({ diagnosticos, medicamentos });
  } catch (err) {
    console.error('[sessions] entities — neo4j:', err.message);
    res.json({ diagnosticos: [], medicamentos: [] });
  } finally {
    if (neo4jSession) await neo4jSession.close();
  }
});

module.exports = router;

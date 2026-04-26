const express = require('express');
const pool = require('../db/pg');
const authMiddleware = require('../middleware/auth');

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
          `SELECT s.id, s.titulo, s.created_at, u.email AS user_email, u.nome AS user_nome
           FROM sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.id = $1`,
          [req.params.id]
        )
      : await pool.query(
          'SELECT id, titulo, created_at FROM sessions WHERE id = $1 AND user_id = $2',
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

module.exports = router;

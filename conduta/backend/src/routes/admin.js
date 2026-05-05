const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.get('/users', adminMiddleware, async (req, res) => {
  const { search } = req.query;
  try {
    let query, params;
    if (search && search.trim()) {
      query = `SELECT id, email, nome, role, plan, active, created_at
               FROM users
               WHERE nome ILIKE $1 OR email ILIKE $1
               ORDER BY created_at DESC`;
      params = [`%${search.trim()}%`];
    } else {
      query = `SELECT id, email, nome, role, plan, active, created_at
               FROM users
               ORDER BY created_at DESC`;
      params = [];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[admin] listar usuários:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.patch('/users/:id/status', adminMiddleware, async (req, res) => {
  const { active } = req.body;

  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'active deve ser boolean.' });
  }

  try {
    const targetResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.params.id]
    );
    if (targetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    if (targetResult.rows[0].role === 'admin') {
      return res.status(403).json({ error: 'Não é possível alterar o status de um admin.' });
    }

    const query = active
      ? `UPDATE users SET active = $1 WHERE id = $2 RETURNING id, email, nome, role, plan, active`
      : `UPDATE users SET active = $1, session_version = session_version + 1 WHERE id = $2 RETURNING id, email, nome, role, plan, active`;

    const result = await pool.query(query, [active, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[admin] alterar status:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/users', adminMiddleware, async (req, res) => {
  const { email, nome, senha } = req.body;

  if (!email || !nome || !senha) {
    return res.status(400).json({ error: 'email, nome e senha são obrigatórios.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO users (email, nome, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, nome, created_at`,
      [email, nome, senhaHash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }
    console.error('Erro ao criar usuário:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.put('/users/:id/plan', adminMiddleware, async (req, res) => {
  const { plan } = req.body;

  if (!['free', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Plano inválido. Use "free" ou "pro".' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET plan = $1 WHERE id = $2 RETURNING id, email, nome, role, plan',
      [plan, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar plano:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;

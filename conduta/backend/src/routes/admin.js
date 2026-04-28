const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

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

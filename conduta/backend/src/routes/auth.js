const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pg');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  console.log(`[AUTH] LOGIN attempt | ip=${ip} email=${email || '(empty)'}`);

  if (!email || !senha) {
    console.warn(`[AUTH] LOGIN rejected: missing fields | ip=${ip}`);
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    console.log(`[AUTH] DB query for email=${email}`);
    const result = await pool.query(
      'SELECT id, email, nome, senha_hash FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      console.warn(`[AUTH] LOGIN failed: user not found | email=${email} ip=${ip}`);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    console.log(`[AUTH] User found id=${user.id}, comparing password...`);
    const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);

    if (!senhaCorreta) {
      console.warn(`[AUTH] LOGIN failed: wrong password | email=${email} ip=${ip}`);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('[AUTH] JWT_SECRET not set — cannot sign token');
      return res.status(500).json({ error: 'Erro interno.' });
    }

    const token = jwt.sign(
      { sub: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    console.log(`[AUTH] LOGIN success | userId=${user.id} email=${email} ip=${ip}`);
    res.json({
      token,
      user: { id: user.id, email: user.email, nome: user.nome },
    });
  } catch (err) {
    console.error(`[AUTH] LOGIN error | email=${email} ip=${ip} stack=${err.stack}`);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/register', async (req, res) => {
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
    console.error('Erro ao registrar:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout realizado.' });
});

module.exports = router;

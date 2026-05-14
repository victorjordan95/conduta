const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db/pg');
const adminMiddleware = require('../middleware/admin');
const authMiddleware = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');

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
    const result = await pool.query(
      'SELECT id, email, nome, senha_hash, role, plan, email_verified, coachmarks_welcome_seen, coachmarks_session_seen FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      console.warn(`[AUTH] LOGIN failed: user not found | email=${email} ip=${ip}`);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);

    if (!senhaCorreta) {
      console.warn(`[AUTH] LOGIN failed: wrong password | email=${email} ip=${ip}`);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (!user.email_verified) {
      console.warn(`[AUTH] LOGIN blocked: email not verified | email=${email} ip=${ip}`);
      return res.status(403).json({
        error: 'Email não verificado. Verifique sua caixa de entrada.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('[AUTH] JWT_SECRET not set — cannot sign token');
      return res.status(500).json({ error: 'Erro interno.' });
    }

    const svResult = await pool.query(
      'UPDATE users SET session_version = session_version + 1 WHERE id = $1 RETURNING session_version',
      [user.id]
    );
    const sv = svResult.rows[0].session_version;

    const token = jwt.sign(
      { sub: user.id, role: user.role, sv },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    console.log(`[AUTH] LOGIN success | userId=${user.id} email=${email} role=${user.role} sv=${sv} ip=${ip}`);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        plan: user.plan,
        coachmarks_welcome_seen: user.coachmarks_welcome_seen,
        coachmarks_session_seen: user.coachmarks_session_seen,
      },
    });
  } catch (err) {
    const detail = process.env.NODE_ENV === 'production' ? err.message : err.stack;
    console.error(`[AUTH] LOGIN error | email=${email} ip=${ip} | ${detail}`);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/signup', async (req, res) => {
  const { email, nome, senha, terms_accepted_at } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!email || !nome || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  if (senha.length < 8) {
    return res.status(400).json({ error: 'Senha deve ter ao menos 8 caracteres.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO users (email, nome, senha_hash, role, terms_accepted_at, email_verified, email_verification_token, email_verification_expires_at)
       VALUES ($1, $2, $3, 'user', $4, FALSE, $5, $6)`,
      [email, nome, senhaHash, terms_accepted_at ? new Date() : null, verificationToken, verificationExpires]
    );

    await sendVerificationEmail(email, nome, verificationToken);

    console.log(`[AUTH] SIGNUP pending verification | email=${email} ip=${ip}`);
    res.status(201).json({ pending: true });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }
    console.error(`[AUTH] SIGNUP error | email=${email} | ${err.message}`);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token inválido.' });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           email_verification_token = NULL,
           email_verification_expires_at = NULL,
           session_version = session_version + 1
       WHERE email_verification_token = $1
         AND email_verification_expires_at > NOW()
         AND email_verified = FALSE
       RETURNING id, email, nome, role, plan, coachmarks_welcome_seen, coachmarks_session_seen, session_version`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: 'Link inválido ou expirado.' });
    }

    const user = result.rows[0];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Erro interno.' });
    }

    const jwtToken = jwt.sign(
      { sub: user.id, role: user.role, sv: user.session_version },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    console.log(`[AUTH] email verified | userId=${user.id} email=${user.email}`);
    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        plan: user.plan,
        coachmarks_welcome_seen: user.coachmarks_welcome_seen,
        coachmarks_session_seen: user.coachmarks_session_seen,
      },
    });
  } catch (err) {
    console.error('[AUTH] verify-email error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, nome, email_verified, email_verification_expires_at FROM users WHERE email = $1',
      [email]
    );

    if (!result.rows.length || result.rows[0].email_verified) {
      return res.json({ ok: true });
    }

    const user = result.rows[0];

    if (user.email_verification_expires_at) {
      const remaining = new Date(user.email_verification_expires_at) - Date.now();
      if (remaining > 23 * 60 * 60 * 1000) {
        return res.json({ ok: true });
      }
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'UPDATE users SET email_verification_token = $1, email_verification_expires_at = $2 WHERE id = $3',
      [newToken, newExpires, user.id]
    );

    await sendVerificationEmail(email, user.nome, newToken);

    res.json({ ok: true });
  } catch (err) {
    console.error('[AUTH] resend-verification error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, nome FROM users WHERE email = $1 AND email_verified = TRUE',
      [email]
    );

    if (result.rows.length) {
      const user = result.rows[0];
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

      await pool.query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2 WHERE id = $3',
        [resetToken, resetExpires, user.id]
      );

      await sendPasswordResetEmail(email, user.nome, resetToken);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[AUTH] forgot-password error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, nova_senha } = req.body;

  if (!token || !nova_senha) {
    return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
  }

  if (
    nova_senha.length < 8 ||
    !/[A-Z]/.test(nova_senha) ||
    !/[0-9]/.test(nova_senha)
  ) {
    return res.status(400).json({
      error: 'Senha deve ter ao menos 8 caracteres, uma letra maiúscula e um número.',
    });
  }

  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires_at > NOW()',
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: 'Link inválido ou expirado.' });
    }

    const userId = result.rows[0].id;
    const senhaHash = await bcrypt.hash(nova_senha, 10);

    await pool.query(
      `UPDATE users
       SET senha_hash = $1,
           password_reset_token = NULL,
           password_reset_expires_at = NULL,
           session_version = session_version + 1
       WHERE id = $2`,
      [senhaHash, userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[AUTH] reset-password error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout realizado.' });
});

router.post('/register', adminMiddleware, async (req, res) => {
  const { email, nome, senha, role } = req.body;

  if (!email || !nome || !senha) {
    return res.status(400).json({ error: 'email, nome e senha são obrigatórios.' });
  }

  if (senha.length < 8) {
    return res.status(400).json({ error: 'Senha deve ter ao menos 8 caracteres.' });
  }

  const roleValida = ['user', 'admin'].includes(role) ? role : 'user';

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO users (email, nome, senha_hash, role, email_verified)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, email, nome, role, created_at`,
      [email, nome, senhaHash, roleValida]
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

router.patch('/me/coachmarks', authMiddleware, async (req, res) => {
  const { type } = req.body;

  if (!['welcome', 'session'].includes(type)) {
    return res.status(400).json({ error: 'type deve ser "welcome" ou "session".' });
  }

  const column = type === 'welcome' ? 'coachmarks_welcome_seen' : 'coachmarks_session_seen';

  try {
    await pool.query(`UPDATE users SET ${column} = TRUE WHERE id = $1`, [req.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[AUTH] coachmarks update error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, nome, role, plan, coachmarks_welcome_seen, coachmarks_session_seen FROM users WHERE id = $1',
      [req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[AUTH] GET /me error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;

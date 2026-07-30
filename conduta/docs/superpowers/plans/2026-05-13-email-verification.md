# Email Verification & Password Recovery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar verificação de conta por email (bloqueante) e recuperação de senha via Resend ao Conduta.

**Architecture:** Migration adiciona 5 colunas à tabela `users`. Novo serviço `email.js` encapsula o SDK Resend. O middleware de auth já faz query no banco por request — basta adicionar `email_verified` ao SELECT existente. Signup passa a retornar `{pending: true}` sem JWT; verify-email emite o JWT após confirmar o token. O frontend ganha 4 páginas novas com o mesmo layout de `Login.jsx` (sem CSS novo).

**Tech Stack:** Node.js, Express, PostgreSQL, `resend` npm SDK, React, React Router 6, Login.module.scss reutilizado.

---

## Mapa de Arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `backend/src/db/migrations/013_email_verification.sql` | 5 novas colunas em `users` |
| Criar | `backend/src/services/email.js` | Wrapper Resend com 2 funções |
| Criar | `backend/src/__tests__/email-verification.test.js` | Testes de integração para todos os novos endpoints |
| Modificar | `backend/src/middleware/auth.js` | Adiciona `email_verified` ao SELECT existente + rejeita não verificados |
| Modificar | `backend/src/routes/auth.js` | Altera signup/login + 4 novas rotas |
| Criar | `frontend/src/pages/VerifyEmailPending.jsx` | Página "verifique seu email" com reenvio |
| Criar | `frontend/src/pages/VerifyEmail.jsx` | Página que consome `?token=` e faz auto-login |
| Criar | `frontend/src/pages/ForgotPassword.jsx` | Formulário de recuperação de senha |
| Criar | `frontend/src/pages/ResetPassword.jsx` | Formulário de nova senha via `?token=` |
| Modificar | `frontend/src/pages/Register.jsx` | Redireciona para `/verify-pending` em vez de auto-login |
| Modificar | `frontend/src/pages/Login.jsx` | Adiciona link "Esqueceu a senha?" e trata 403 EMAIL_NOT_VERIFIED |
| Modificar | `frontend/src/App.jsx` | Registra 4 novas rotas públicas |
| Modificar | `frontend/src/services/api.js` | 4 novas funções de email |
| Modificar | `frontend/src/context/AuthContext.jsx` | Trata `403 EMAIL_NOT_VERIFIED` |

---

## Task 1: Migration

**Files:**
- Create: `backend/src/db/migrations/013_email_verification.sql`

- [ ] **Step 1: Criar a migration**

```sql
-- backend/src/db/migrations/013_email_verification.sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_reset_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

-- Usuários existentes já são considerados verificados
UPDATE users SET email_verified = TRUE
WHERE email_verified IS FALSE OR email_verified IS NULL;
```

- [ ] **Step 2: Executar a migration**

```bash
cd conduta/backend && npm run migrate
```

Esperado: `Migration executada: 013_email_verification.sql`

- [ ] **Step 3: Verificar colunas no banco**

```bash
docker exec -it conduta-postgres-1 psql -U conduta -d conduta -c "\d users"
```

Esperado: colunas `email_verified`, `email_verification_token`, `email_verification_expires_at`, `password_reset_token`, `password_reset_expires_at` listadas.

- [ ] **Step 4: Commit**

```bash
git add conduta/backend/src/db/migrations/013_email_verification.sql
git commit -m "feat(db): adiciona colunas de verificação de email e reset de senha"
```

---

## Task 2: Instalar Resend + criar serviço de email

**Files:**
- Modify: `backend/package.json`
- Create: `backend/src/services/email.js`

- [ ] **Step 1: Instalar SDK Resend**

```bash
cd conduta/backend && npm install resend
```

Esperado: `resend` aparece em `dependencies` no `package.json`.

- [ ] **Step 2: Criar `backend/src/services/email.js`**

```js
// backend/src/services/email.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Conduta <onboarding@resend.dev>';

async function sendVerificationEmail(to, nome, token) {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: 'Confirme seu email — Conduta',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#1a6b73;margin-bottom:8px">Olá, ${nome}</h2>
        <p style="color:#333;line-height:1.6">
          Clique no botão abaixo para confirmar seu email e acessar o Conduta:
        </p>
        <a href="${url}"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1a6b73;
                  color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px">
          Confirmar email
        </a>
        <p style="color:#888;font-size:13px">
          O link expira em 24 horas.<br>
          Se você não criou uma conta no Conduta, ignore este email.
        </p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(to, nome, token) {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: 'Redefinição de senha — Conduta',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#1a6b73;margin-bottom:8px">Olá, ${nome}</h2>
        <p style="color:#333;line-height:1.6">
          Recebemos uma solicitação para redefinir a senha da sua conta no Conduta.
          Clique no botão abaixo para continuar:
        </p>
        <a href="${url}"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1a6b73;
                  color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px">
          Redefinir senha
        </a>
        <p style="color:#888;font-size:13px">
          O link expira em 1 hora.<br>
          Se você não solicitou a redefinição, ignore este email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
```

- [ ] **Step 3: Commit**

```bash
git add conduta/backend/package.json conduta/backend/package-lock.json conduta/backend/src/services/email.js
git commit -m "feat(email): serviço Resend com sendVerificationEmail e sendPasswordResetEmail"
```

---

## Task 3: Escrever testes de integração (backend)

**Files:**
- Create: `backend/src/__tests__/email-verification.test.js`

- [ ] **Step 1: Criar o arquivo de testes**

```js
// backend/src/__tests__/email-verification.test.js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db/pg');
const app = require('../app');

jest.mock('../services/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

const emailService = require('../services/email');

let verifiedUserId;
let unverifiedUserId;
let unverifiedToken;

beforeAll(async () => {
  require('dotenv').config();
  const hash = await bcrypt.hash('Senha123', 10);

  const r1 = await pool.query(
    `INSERT INTO users (email, nome, senha_hash, email_verified)
     VALUES ($1, $2, $3, TRUE) RETURNING id`,
    ['ev_verified@conduta.dev', 'Dr. Verified', hash]
  );
  verifiedUserId = r1.rows[0].id;

  unverifiedToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const r2 = await pool.query(
    `INSERT INTO users (email, nome, senha_hash, email_verified, email_verification_token, email_verification_expires_at)
     VALUES ($1, $2, $3, FALSE, $4, $5) RETURNING id`,
    ['ev_unverified@conduta.dev', 'Dr. Unverified', hash, unverifiedToken, expires]
  );
  unverifiedUserId = r2.rows[0].id;
});

afterAll(async () => {
  await pool.query(
    "DELETE FROM users WHERE email LIKE 'ev_%@conduta.dev'"
  );
  await pool.end();
});

beforeEach(() => jest.clearAllMocks());

// ── POST /auth/signup ──────────────────────────────────────────────
describe('POST /auth/signup', () => {
  afterEach(async () => {
    await pool.query("DELETE FROM users WHERE email = 'ev_new@conduta.dev'");
  });

  it('retorna {pending: true} sem JWT', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ nome: 'Dr. New', email: 'ev_new@conduta.dev', senha: 'Senha123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('pending', true);
    expect(res.body).not.toHaveProperty('token');
  });

  it('envia email de verificação no signup', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ nome: 'Dr. New', email: 'ev_new@conduta.dev', senha: 'Senha123' });

    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      'ev_new@conduta.dev',
      'Dr. New',
      expect.any(String)
    );
  });

  it('salva token de verificação no banco com expiração futura', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ nome: 'Dr. New', email: 'ev_new@conduta.dev', senha: 'Senha123' });

    const result = await pool.query(
      'SELECT email_verified, email_verification_token, email_verification_expires_at FROM users WHERE email = $1',
      ['ev_new@conduta.dev']
    );
    expect(result.rows[0].email_verified).toBe(false);
    expect(result.rows[0].email_verification_token).toBeTruthy();
    expect(new Date(result.rows[0].email_verification_expires_at)).toBeInstanceOf(Date);
  });
});

// ── GET /auth/verify-email ─────────────────────────────────────────
describe('GET /auth/verify-email', () => {
  it('com token válido retorna JWT e user', async () => {
    // Recria unverified para este teste pois pode ter sido usado antes
    await pool.query(
      'UPDATE users SET email_verified = FALSE, email_verification_token = $1, email_verification_expires_at = $2 WHERE id = $3',
      [unverifiedToken, new Date(Date.now() + 24 * 60 * 60 * 1000), unverifiedUserId]
    );

    const res = await request(app).get(`/auth/verify-email?token=${unverifiedToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', 'ev_unverified@conduta.dev');
  });

  it('marca email_verified como TRUE no banco após verificação', async () => {
    const token2 = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE users SET email_verified = FALSE, email_verification_token = $1, email_verification_expires_at = $2 WHERE id = $3',
      [token2, new Date(Date.now() + 24 * 60 * 60 * 1000), unverifiedUserId]
    );

    await request(app).get(`/auth/verify-email?token=${token2}`);

    const result = await pool.query('SELECT email_verified, email_verification_token FROM users WHERE id = $1', [unverifiedUserId]);
    expect(result.rows[0].email_verified).toBe(true);
    expect(result.rows[0].email_verification_token).toBeNull();
  });

  it('com token expirado retorna 400', async () => {
    const expiredToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO users (email, nome, senha_hash, email_verified, email_verification_token, email_verification_expires_at)
       VALUES ($1, $2, $3, FALSE, $4, $5)`,
      ['ev_expired@conduta.dev', 'Dr. Expired', await bcrypt.hash('Senha123', 10), expiredToken, new Date(Date.now() - 1000)]
    );

    const res = await request(app).get(`/auth/verify-email?token=${expiredToken}`);
    expect(res.status).toBe(400);

    await pool.query("DELETE FROM users WHERE email = 'ev_expired@conduta.dev'");
  });

  it('sem token retorna 400', async () => {
    const res = await request(app).get('/auth/verify-email');
    expect(res.status).toBe(400);
  });

  it('com token inexistente retorna 400', async () => {
    const res = await request(app).get('/auth/verify-email?token=tokeninexistente');
    expect(res.status).toBe(400);
  });
});

// ── POST /auth/login com verificação ──────────────────────────────
describe('POST /auth/login com email_verified', () => {
  beforeEach(async () => {
    await pool.query('UPDATE users SET email_verified = FALSE WHERE id = $1', [unverifiedUserId]);
  });

  it('login com email não verificado retorna 403 com code EMAIL_NOT_VERIFIED', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ev_unverified@conduta.dev', senha: 'Senha123' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('login com email verificado retorna JWT normalmente', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ev_verified@conduta.dev', senha: 'Senha123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

// ── POST /auth/resend-verification ────────────────────────────────
describe('POST /auth/resend-verification', () => {
  beforeEach(async () => {
    const oldToken = crypto.randomBytes(32).toString('hex');
    const oldExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1h no futuro (< 23h)
    await pool.query(
      'UPDATE users SET email_verified = FALSE, email_verification_token = $1, email_verification_expires_at = $2 WHERE id = $3',
      [oldToken, oldExpires, unverifiedUserId]
    );
  });

  it('retorna 200 mesmo para email inexistente', async () => {
    const res = await request(app)
      .post('/auth/resend-verification')
      .send({ email: 'naoexiste@conduta.dev' });

    expect(res.status).toBe(200);
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('retorna 200 e reenvia email quando token tem menos de 23h de vida', async () => {
    const res = await request(app)
      .post('/auth/resend-verification')
      .send({ email: 'ev_unverified@conduta.dev' });

    expect(res.status).toBe(200);
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      'ev_unverified@conduta.dev',
      'Dr. Unverified',
      expect.any(String)
    );
  });

  it('não reenvia quando token ainda tem mais de 23h', async () => {
    await pool.query(
      'UPDATE users SET email_verification_expires_at = $1 WHERE id = $2',
      [new Date(Date.now() + 23.5 * 60 * 60 * 1000), unverifiedUserId]
    );

    const res = await request(app)
      .post('/auth/resend-verification')
      .send({ email: 'ev_unverified@conduta.dev' });

    expect(res.status).toBe(200);
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });
});

// ── POST /auth/forgot-password ────────────────────────────────────
describe('POST /auth/forgot-password', () => {
  afterEach(async () => {
    await pool.query('UPDATE users SET password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = $1', [verifiedUserId]);
  });

  it('retorna 200 para email inexistente (sem vazar info)', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'naoexiste@conduta.dev' });

    expect(res.status).toBe(200);
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('envia email de reset para usuário verificado', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'ev_verified@conduta.dev' });

    expect(res.status).toBe(200);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'ev_verified@conduta.dev',
      'Dr. Verified',
      expect.any(String)
    );
  });

  it('salva token de reset no banco', async () => {
    await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'ev_verified@conduta.dev' });

    const result = await pool.query('SELECT password_reset_token, password_reset_expires_at FROM users WHERE id = $1', [verifiedUserId]);
    expect(result.rows[0].password_reset_token).toBeTruthy();
    expect(new Date(result.rows[0].password_reset_expires_at) > new Date()).toBe(true);
  });
});

// ── POST /auth/reset-password ─────────────────────────────────────
describe('POST /auth/reset-password', () => {
  let resetToken;

  beforeEach(async () => {
    resetToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2 WHERE id = $3',
      [resetToken, new Date(Date.now() + 60 * 60 * 1000), verifiedUserId]
    );
  });

  afterEach(async () => {
    const hash = await bcrypt.hash('Senha123', 10);
    await pool.query(
      'UPDATE users SET senha_hash = $1, password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = $2',
      [hash, verifiedUserId]
    );
  });

  it('com token válido atualiza senha', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: resetToken, nova_senha: 'NovaSenha123' });

    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'ev_verified@conduta.dev', senha: 'NovaSenha123' });
    expect(login.status).toBe(200);
  });

  it('com token expirado retorna 400', async () => {
    await pool.query(
      'UPDATE users SET password_reset_expires_at = $1 WHERE id = $2',
      [new Date(Date.now() - 1000), verifiedUserId]
    );

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: resetToken, nova_senha: 'NovaSenha123' });

    expect(res.status).toBe(400);
  });

  it('senha fraca retorna 400', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: resetToken, nova_senha: 'fraca' });

    expect(res.status).toBe(400);
  });

  it('limpa token após reset bem-sucedido', async () => {
    await request(app)
      .post('/auth/reset-password')
      .send({ token: resetToken, nova_senha: 'NovaSenha123' });

    const result = await pool.query('SELECT password_reset_token FROM users WHERE id = $1', [verifiedUserId]);
    expect(result.rows[0].password_reset_token).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar testes — verificar que falham**

```bash
cd conduta/backend && npm test -- --testPathPattern=email-verification --no-coverage
```

Esperado: FAIL — endpoints não existem / comportamento diferente do atual.

- [ ] **Step 3: Commit dos testes**

```bash
git add conduta/backend/src/__tests__/email-verification.test.js
git commit -m "test(auth): testes de verificação de email e reset de senha (red)"
```

---

## Task 4: Atualizar middleware de auth

**Files:**
- Modify: `backend/src/middleware/auth.js`

- [ ] **Step 1: Adicionar verificação de email no middleware**

Substitua o conteúdo completo de `backend/src/middleware/auth.js` por:

```js
// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../db/pg');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    if (payload.sv === undefined) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    const result = await pool.query(
      'SELECT session_version, plan, active, email_verified FROM users WHERE id = $1',
      [payload.sub]
    );

    if (!result.rows.length || result.rows[0].session_version !== payload.sv) {
      return res.status(401).json({
        error: 'Sua sessão foi encerrada pois outro acesso foi iniciado.',
        code: 'SESSION_KICKED',
      });
    }

    if (!result.rows[0].active) {
      return res.status(401).json({ error: 'Conta desativada.' });
    }

    if (!result.rows[0].email_verified) {
      return res.status(403).json({
        error: 'Email não verificado. Verifique sua caixa de entrada.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    req.userId = payload.sub;
    req.userRole = payload.role || 'user';
    req.userPlan = result.rows[0].plan || 'free';
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

module.exports = authMiddleware;
```

- [ ] **Step 2: Commit**

```bash
git add conduta/backend/src/middleware/auth.js
git commit -m "feat(auth): middleware rejeita usuários com email não verificado"
```

---

## Task 5: Atualizar rotas de auth

**Files:**
- Modify: `backend/src/routes/auth.js`

- [ ] **Step 1: Substituir o conteúdo completo de `backend/src/routes/auth.js`**

```js
// backend/src/routes/auth.js
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
```

- [ ] **Step 2: Commit**

```bash
git add conduta/backend/src/routes/auth.js
git commit -m "feat(auth): signup envia email, verify-email, resend, forgot/reset password"
```

---

## Task 6: Rodar testes do backend

- [ ] **Step 1: Rodar apenas os testes novos**

```bash
cd conduta/backend && npm test -- --testPathPattern=email-verification --no-coverage
```

Esperado: todos os testes PASS.

- [ ] **Step 2: Rodar a suite completa para verificar regressões**

```bash
cd conduta/backend && npm test --no-coverage
```

Esperado: todos os testes existentes ainda passam. Se algum teste de `auth.test.js` falhar porque agora o signup não retorna JWT, ajuste o teste de auth conforme indicado abaixo.

> **Nota:** o teste `POST /auth/signup` em `auth.test.js` pode estar esperando um `token` na resposta. Se falhar, localize o teste e substitua a assertion por:
> ```js
> expect(res.status).toBe(201);
> expect(res.body).toHaveProperty('pending', true);
> ```

- [ ] **Step 3: Commit de ajuste se necessário**

```bash
git add conduta/backend/src/__tests__/auth.test.js
git commit -m "test(auth): ajusta expectativa de signup para pending:true"
```

---

## Task 7: Frontend — funções de API

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Adicionar 4 funções no final de `frontend/src/services/api.js`**

```js
export async function verifyEmail(token) {
  const res = await fetch(`${BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Link inválido ou expirado.');
  }
  return res.json();
}

export async function resendVerification(email) {
  const res = await fetch(`${BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao reenviar email.');
  }
  return res.json();
}

export async function forgotPassword(email) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao solicitar redefinição.');
  }
  return res.json();
}

export async function resetPassword(token, nova_senha) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, nova_senha }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao redefinir senha.');
  }
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add conduta/frontend/src/services/api.js
git commit -m "feat(api): verifyEmail, resendVerification, forgotPassword, resetPassword"
```

---

## Task 8: Frontend — novas páginas

**Files:**
- Create: `frontend/src/pages/VerifyEmailPending.jsx`
- Create: `frontend/src/pages/VerifyEmail.jsx`
- Create: `frontend/src/pages/ForgotPassword.jsx`
- Create: `frontend/src/pages/ResetPassword.jsx`

- [ ] **Step 1: Criar `frontend/src/pages/VerifyEmailPending.jsx`**

```jsx
// frontend/src/pages/VerifyEmailPending.jsx
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { resendVerification } from '../services/api';
import styles from './Login.module.scss';

export default function VerifyEmailPending() {
  const location = useLocation();
  const email = location.state?.email || '';
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleReenviar() {
    if (!email || loading) return;
    setErro('');
    setLoading(true);
    try {
      await resendVerification(email);
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <h1>Conduta</h1>
          <p>Verifique seu email</p>
        </div>

        <p style={{ color: '#5a6a7a', lineHeight: 1.6, marginBottom: '20px', fontSize: '14px' }}>
          Enviamos um link de confirmação para <strong>{email || 'seu email'}</strong>.
          Clique no link para ativar sua conta.
        </p>

        {enviado ? (
          <p style={{ color: '#27ae60', fontSize: '14px', textAlign: 'center' }}>
            Email reenviado com sucesso. Verifique sua caixa de entrada.
          </p>
        ) : (
          <button
            className={styles.button}
            onClick={handleReenviar}
            disabled={loading || !email}
          >
            {loading ? 'Enviando...' : 'Reenviar email'}
          </button>
        )}

        {erro && <p className={styles.error}>{erro}</p>}

        <p style={{ marginTop: '20px', fontSize: '13px', textAlign: 'center', color: '#5a6a7a' }}>
          <Link to="/login" style={{ color: '#1a6b73' }}>Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar `frontend/src/pages/VerifyEmail.jsx`**

```jsx
// frontend/src/pages/VerifyEmail.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.scss';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [status, setStatus] = useState('loading');
  const [erro, setErro] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErro('Link inválido.');
      return;
    }

    verifyEmail(token)
      .then((data) => {
        saveAuth(data.token, data.user);
        navigate('/', { replace: true });
      })
      .catch((err) => {
        setStatus('error');
        setErro(err.message);
      });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <h1>Conduta</h1>
          <p>{status === 'loading' ? 'Verificando...' : 'Erro na verificação'}</p>
        </div>

        {status === 'loading' && (
          <p style={{ color: '#5a6a7a', textAlign: 'center', fontSize: '14px' }}>
            Confirmando seu email, aguarde...
          </p>
        )}

        {status === 'error' && (
          <>
            <p className={styles.error}>{erro}</p>
            <p style={{ marginTop: '16px', fontSize: '13px', textAlign: 'center' }}>
              <Link to="/cadastro" style={{ color: '#1a6b73' }}>Criar nova conta</Link>
              {' · '}
              <Link to="/login" style={{ color: '#1a6b73' }}>Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar `frontend/src/pages/ForgotPassword.jsx`**

```jsx
// frontend/src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import styles from './Login.module.scss';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <h1>Conduta</h1>
          <p>Recuperar senha</p>
        </div>

        {enviado ? (
          <p style={{ color: '#5a6a7a', lineHeight: 1.6, fontSize: '14px', textAlign: 'center' }}>
            Se esse email estiver cadastrado, você receberá as instruções em breve.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="medico@exemplo.com"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar instruções'}
            </button>

            {erro && <p className={styles.error}>{erro}</p>}
          </form>
        )}

        <p style={{ marginTop: '20px', fontSize: '13px', textAlign: 'center', color: '#5a6a7a' }}>
          <Link to="/login" style={{ color: '#1a6b73' }}>Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Criar `frontend/src/pages/ResetPassword.jsx`**

```jsx
// frontend/src/pages/ResetPassword.jsx
import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import styles from './Login.module.scss';

const REQUISITOS = [
  { id: 'len',   label: 'Mínimo 8 caracteres',  test: (s) => s.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula',   test: (s) => /[A-Z]/.test(s) },
  { id: 'num',   label: 'Um número',             test: (s) => /[0-9]/.test(s) },
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [senhaFocada, setSenhaFocada] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const senhaValida = REQUISITOS.every((r) => r.test(senha));
  const coincidem = confirmar.length > 0 && senha === confirmar;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!senhaValida || !coincidem) return;
    setErro('');
    setLoading(true);
    try {
      await resetPassword(token, senha);
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.brand}><h1>Conduta</h1></div>
          <p className={styles.error}>Link inválido.</p>
          <p style={{ marginTop: '16px', fontSize: '13px', textAlign: 'center' }}>
            <Link to="/esqueci-senha" style={{ color: '#1a6b73' }}>Solicitar novo link</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <h1>Conduta</h1>
          <p>Nova senha</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="senha">Nova senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onFocus={() => setSenhaFocada(true)}
              placeholder="Mínimo 8 caracteres"
              required
              autoFocus
            />
            {(senhaFocada || senha.length > 0) && (
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '8px' }}>
                {REQUISITOS.map((r) => {
                  const ok = r.test(senha);
                  return (
                    <li key={r.id} style={{ fontSize: '12px', color: ok ? '#27ae60' : '#c0392b' }}>
                      {ok ? '✓' : '✗'} {r.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmar">Confirmar nova senha</label>
            <input
              id="confirmar"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repita a senha"
              required
            />
            {confirmar.length > 0 && (
              <p style={{ fontSize: '12px', marginTop: '4px', color: coincidem ? '#27ae60' : '#c0392b' }}>
                {coincidem ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading || !senhaValida || !coincidem}
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>

          {erro && <p className={styles.error}>{erro}</p>}
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add conduta/frontend/src/pages/VerifyEmailPending.jsx conduta/frontend/src/pages/VerifyEmail.jsx conduta/frontend/src/pages/ForgotPassword.jsx conduta/frontend/src/pages/ResetPassword.jsx
git commit -m "feat(pages): VerifyEmailPending, VerifyEmail, ForgotPassword, ResetPassword"
```

---

## Task 9: Frontend — alterações em arquivos existentes

**Files:**
- Modify: `frontend/src/pages/Register.jsx`
- Modify: `frontend/src/pages/Login.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: Atualizar `Register.jsx` — redirecionar para `/verify-pending`**

No topo do arquivo, garanta que `useNavigate` está importado (já estava). Localize o bloco `try` dentro de `handleSubmit` e substitua o conteúdo:

```jsx
// Antes:
const data = await register(nome, email, senha, new Date().toISOString());
saveAuth(data.token, data.user);
navigate('/');

// Depois:
await register(nome, email, senha, new Date().toISOString());
navigate('/verify-pending', { state: { email } });
```

- [ ] **Step 2: Atualizar `Login.jsx` — adicionar link "Esqueceu a senha?" e tratar EMAIL_NOT_VERIFIED**

Localize o `<button type="submit">` em `Login.jsx`. Logo abaixo dele (após o botão, antes do `{erro &&}`), adicione:

```jsx
<p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
  <Link to="/esqueci-senha" style={{ color: '#1a6b73' }}>Esqueceu a senha?</Link>
</p>
```

Garanta que `Link` está importado de `react-router-dom` (verifique os imports existentes).

Localize a função `handleSubmit` e atualize o bloco `catch`:

```jsx
// Antes:
} catch (err) {
  setErro(err.message);
}

// Depois:
} catch (err) {
  if (err.code === 'EMAIL_NOT_VERIFIED') {
    navigate('/verify-pending', { state: { email } });
    return;
  }
  setErro(err.message);
}
```

Atualize também o `login` em `services/api.js` para propagar o `code` do erro — localize a função `login` em `api.js` e substitua o bloco de erro:

```js
// Antes:
if (!res.ok) throw new Error('Credenciais inválidas.');

// Depois:
if (!res.ok) {
  const data = await res.json().catch(() => ({}));
  const err = new Error(data.error || 'Credenciais inválidas.');
  err.code = data.code;
  throw err;
}
```

- [ ] **Step 3: Atualizar `App.jsx` — registrar 4 novas rotas**

Adicione os imports no topo:

```jsx
import VerifyEmailPending from './pages/VerifyEmailPending';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
```

Dentro do `<Routes>`, adicione as 4 rotas públicas (fora do `PrivateRoute`):

```jsx
<Route path="/verify-pending" element={<VerifyEmailPending />} />
<Route path="/verify-email" element={<VerifyEmail />} />
<Route path="/esqueci-senha" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

- [ ] **Step 4: Atualizar `AuthContext.jsx` — tratar EMAIL_NOT_VERIFIED**

Localize a função `checkUnauthorized` em `api.js`. Já existe o tratamento de 401. Agora adicione antes do `return res`:

```js
if (res.status === 403) {
  let data = {};
  try { data = await res.clone().json(); } catch {}
  if (data.code === 'EMAIL_NOT_VERIFIED') {
    window.dispatchEvent(new CustomEvent('conduta:email-not-verified'));
    throw new Error(data.error || 'Email não verificado.');
  }
}
```

Em `AuthContext.jsx`, dentro do `useEffect` de inicialização (onde já está o listener de `conduta:unauthorized`), adicione um listener para o evento novo:

```jsx
useEffect(() => {
  function handleUnauthorized(e) {
    clearAuth();
    // mensagem opcional: e.detail?.message
  }
  function handleEmailNotVerified() {
    // Não limpa auth (não há token), apenas redireciona
    window.location.href = '/verify-pending';
  }
  window.addEventListener('conduta:unauthorized', handleUnauthorized);
  window.addEventListener('conduta:email-not-verified', handleEmailNotVerified);
  return () => {
    window.removeEventListener('conduta:unauthorized', handleUnauthorized);
    window.removeEventListener('conduta:email-not-verified', handleEmailNotVerified);
  };
}, []);
```

> **Nota:** verifique como o listener de `conduta:unauthorized` já está implementado em `AuthContext.jsx` antes de adicionar. Siga o mesmo padrão existente.

- [ ] **Step 5: Commit**

```bash
git add conduta/frontend/src/pages/Register.jsx conduta/frontend/src/pages/Login.jsx conduta/frontend/src/App.jsx conduta/frontend/src/context/AuthContext.jsx conduta/frontend/src/services/api.js
git commit -m "feat(frontend): fluxo de verificação de email e recuperação de senha"
```

---

## Task 10: Verificação manual do fluxo completo

- [ ] **Step 1: Adicionar `RESEND_API_KEY` e `FRONTEND_URL` no `backend/.env`**

```
RESEND_API_KEY=re_...
FRONTEND_URL=http://localhost:5173
```

- [ ] **Step 2: Subir o ambiente**

```bash
# Terminal 1
cd conduta/backend && npm run dev

# Terminal 2
cd conduta/frontend && npm run dev
```

- [ ] **Step 3: Testar fluxo de cadastro**

1. Abrir `http://localhost:5173/cadastro`
2. Preencher nome, email real, senha válida, aceitar termos
3. Clicar "Criar conta grátis"
4. Verificar redirecionamento para `/verify-pending` com o email exibido
5. Verificar que o email de confirmação chegou na caixa de entrada
6. Clicar no link do email
7. Verificar redirecionamento para `/` (dashboard) já logado

- [ ] **Step 4: Testar fluxo de recuperação de senha**

1. Abrir `http://localhost:5173/login`
2. Verificar que o link "Esqueceu a senha?" está visível
3. Clicar no link → `/esqueci-senha`
4. Inserir email cadastrado e verificado, clicar "Enviar instruções"
5. Verificar mensagem de sucesso
6. Verificar que o email de reset chegou
7. Clicar no link → `/reset-password?token=...`
8. Definir nova senha válida, clicar "Salvar nova senha"
9. Verificar redirecionamento para `/login`
10. Fazer login com a nova senha — deve funcionar

- [ ] **Step 5: Testar bloqueio de login sem verificação**

1. Criar conta com email que você pode ver mas NÃO clicar no link de verificação
2. Tentar fazer login → deve redirecionar para `/verify-pending`

- [ ] **Step 6: Commit final**

```bash
git add conduta/backend/.env.example
git commit -m "chore: documenta RESEND_API_KEY e FRONTEND_URL no .env.example"
```

---

## Checklist de cobertura do spec

| Requisito | Task |
|-----------|------|
| Migration com 5 colunas | Task 1 |
| Existentes marcados como verificados | Task 1 |
| Serviço Resend com 2 funções | Task 2 |
| Signup retorna `{pending: true}` sem JWT | Task 5 |
| Signup envia email de verificação | Task 5 |
| `GET /auth/verify-email` valida token e emite JWT | Task 5 |
| `POST /auth/resend-verification` anti-spam 23h | Task 5 |
| Login bloqueia não verificados com 403 + code | Task 5 |
| `POST /auth/forgot-password` envia email | Task 5 |
| `POST /auth/reset-password` valida + atualiza senha | Task 5 |
| Reset invalida sessões (session_version++) | Task 5 |
| Middleware rejeita tokens de não verificados | Task 4 |
| Admin `/register` cria usuário já verificado | Task 5 |
| `VerifyEmailPending` com reenvio | Task 8 |
| `VerifyEmail` auto-login via token | Task 8 |
| `ForgotPassword` formulário | Task 8 |
| `ResetPassword` com validação de senha | Task 8 |
| Register redireciona para `/verify-pending` | Task 9 |
| Login trata EMAIL_NOT_VERIFIED | Task 9 |
| 4 novas rotas em App.jsx | Task 9 |
| Testes backend com email mockado | Task 3 |

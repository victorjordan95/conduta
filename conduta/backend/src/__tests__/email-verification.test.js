const request = require('supertest');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
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
    const freshToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE users SET email_verified = FALSE, email_verification_token = $1, email_verification_expires_at = $2 WHERE id = $3',
      [freshToken, new Date(Date.now() + 24 * 60 * 60 * 1000), unverifiedUserId]
    );

    const res = await request(app).get(`/auth/verify-email?token=${freshToken}`);

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

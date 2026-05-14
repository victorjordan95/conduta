const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');

jest.mock('../services/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

const app = require('../app');

let testUserId;

beforeAll(async () => {
  const hash = await bcrypt.hash('senha123', 10);
  const res = await pool.query(
    `INSERT INTO users (email, nome, senha_hash, email_verified)
     VALUES ($1, $2, $3, TRUE) RETURNING id`,
    ['test@conduta.dev', 'Dr. Teste', hash]
  );
  testUserId = res.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', ['test@conduta.dev']);
  await pool.end();
});

describe('POST /auth/login', () => {
  it('retorna token JWT com credenciais válidas', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@conduta.dev', senha: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('test@conduta.dev');
  });

  it('retorna 401 com senha errada', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@conduta.dev', senha: 'errada' });

    expect(res.status).toBe(401);
  });

  it('retorna 401 com email inexistente', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'naoexiste@conduta.dev', senha: 'senha123' });

    expect(res.status).toBe(401);
  });
});

describe('POST /auth/login — campos coachmarks', () => {
  it('retorna coachmarks_welcome_seen e coachmarks_session_seen no user', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@conduta.dev', senha: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('coachmarks_welcome_seen', false);
    expect(res.body.user).toHaveProperty('coachmarks_session_seen', false);
  });
});

describe('PATCH /auth/me/coachmarks', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@conduta.dev', senha: 'senha123' });
    token = res.body.token;
  });

  it('marca coachmarks_welcome_seen como true', async () => {
    const res = await request(app)
      .patch('/auth/me/coachmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'welcome' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const db = await pool.query(
      'SELECT coachmarks_welcome_seen FROM users WHERE email = $1',
      ['test@conduta.dev']
    );
    expect(db.rows[0].coachmarks_welcome_seen).toBe(true);
  });

  it('marca coachmarks_session_seen como true', async () => {
    const res = await request(app)
      .patch('/auth/me/coachmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'session' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const db = await pool.query(
      'SELECT coachmarks_session_seen FROM users WHERE email = $1',
      ['test@conduta.dev']
    );
    expect(db.rows[0].coachmarks_session_seen).toBe(true);
  });

  it('retorna 400 com type inválido', async () => {
    const res = await request(app)
      .patch('/auth/me/coachmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'invalido' });

    expect(res.status).toBe(400);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .patch('/auth/me/coachmarks')
      .send({ type: 'welcome' });

    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@conduta.dev', senha: 'senha123' });
    token = res.body.token;
  });

  it('retorna dados do usuário autenticado', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', 'test@conduta.dev');
    expect(res.body).toHaveProperty('plan');
    expect(res.body).not.toHaveProperty('senha_hash');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/signup', () => {
  const email = 'signup-test@conduta.dev';

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
  });

  it('cria usuário e salva terms_accepted_at quando enviado', async () => {
    const termsTs = new Date().toISOString();
    const beforeSignup = Date.now();

    const res = await request(app)
      .post('/auth/signup')
      .send({ nome: 'Dr. Signup', email, senha: 'Senha123', terms_accepted_at: termsTs });

    const afterSignup = Date.now();

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('pending', true);

    const db = await pool.query(
      'SELECT terms_accepted_at FROM users WHERE email = $1',
      [email]
    );
    const storedTs = new Date(db.rows[0].terms_accepted_at);
    expect(storedTs.getTime()).toBeGreaterThanOrEqual(beforeSignup - 100);
    expect(storedTs.getTime()).toBeLessThanOrEqual(afterSignup + 100);
  });

  it('cria usuário com terms_accepted_at null quando não enviado', async () => {
    const email2 = 'signup-noterms@conduta.dev';
    try {
      const res = await request(app)
        .post('/auth/signup')
        .send({ nome: 'Dr. NoTerms', email: email2, senha: 'Senha123' });

      expect(res.status).toBe(201);

      const db = await pool.query(
        'SELECT terms_accepted_at FROM users WHERE email = $1',
        [email2]
      );
      expect(db.rows[0].terms_accepted_at).toBeNull();
    } finally {
      await pool.query('DELETE FROM users WHERE email = $1', [email2]);
    }
  });
});

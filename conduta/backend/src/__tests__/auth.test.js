const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const app = require('../app');

let testUserId;

beforeAll(async () => {
  const hash = await bcrypt.hash('senha123', 10);
  const res = await pool.query(
    `INSERT INTO users (email, nome, senha_hash)
     VALUES ($1, $2, $3) RETURNING id`,
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

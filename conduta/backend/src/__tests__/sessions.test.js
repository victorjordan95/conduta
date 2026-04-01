const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pg');
const app = require('../app');

let token;
let testUserId;

beforeAll(async () => {
  require('dotenv').config();
  const hash = await bcrypt.hash('senha123', 10);
  const res = await pool.query(
    `INSERT INTO users (email, nome, senha_hash)
     VALUES ($1, $2, $3) RETURNING id`,
    ['sessions_test@conduta.dev', 'Dr. Sessao', hash]
  );
  testUserId = res.rows[0].id;
  token = jwt.sign({ sub: testUserId }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', ['sessions_test@conduta.dev']);
  await pool.end();
});

describe('Sessions', () => {
  let sessionId;

  it('POST /sessions cria nova sessão', async () => {
    const res = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Criança com febre' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.titulo).toBe('Criança com febre');
    sessionId = res.body.id;
  });

  it('GET /sessions lista sessões do usuário', async () => {
    const res = await request(app)
      .get('/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /sessions/:id retorna histórico da sessão', async () => {
    const res = await request(app)
      .get(`/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('session');
    expect(res.body).toHaveProperty('messages');
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('GET /sessions sem token retorna 401', async () => {
    const res = await request(app).get('/sessions');
    expect(res.status).toBe(401);
  });
});

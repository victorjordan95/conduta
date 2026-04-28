require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const app = require('../app');

const TEST_EMAIL = 'usage-test@conduta.dev';

let token, userId, sessionId;

beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  const hash = await bcrypt.hash('senha123', 10);
  await pool.query(
    `INSERT INTO users (email, nome, senha_hash, plan) VALUES ($1, $2, $3, 'free')`,
    [TEST_EMAIL, 'Dr. Uso', hash]
  );
  const login = await request(app)
    .post('/auth/login')
    .send({ email: TEST_EMAIL, senha: 'senha123' });
  token = login.body.token;
  userId = login.body.user.id;

  const sess = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Sessão Teste') RETURNING id`,
    [userId]
  );
  sessionId = sess.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await pool.end();
});

beforeEach(async () => {
  await pool.query('DELETE FROM messages WHERE session_id = $1', [sessionId]);
});

describe('GET /usage', () => {
  it('retorna used=0 para usuário sem análises no mês', async () => {
    const res = await request(app)
      .get('/usage')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ used: 0, limit: 15, plan: 'free' });
  });

  it('retorna used=2 após duas mensagens de usuário', async () => {
    await pool.query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', 'Caso 1'), ($1, 'user', 'Caso 2')`,
      [sessionId]
    );
    const res = await request(app)
      .get('/usage')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.used).toBe(2);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/usage');
    expect(res.status).toBe(401);
  });
});

describe('POST /analyze — limite mensal', () => {
  it('retorna 429 com used/limit quando Free user atingiu 15 análises', async () => {
    const values = Array.from({ length: 15 }, (_, i) => `($1, 'user', 'Caso ${i + 1}')`).join(', ');
    await pool.query(`INSERT INTO messages (session_id, role, content) VALUES ${values}`, [sessionId]);

    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ session_id: sessionId, content: 'Caso extra' });

    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({ used: 15, limit: 15, plan: 'free' });
  });
});

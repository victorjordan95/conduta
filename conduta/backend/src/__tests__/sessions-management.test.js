require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const app = require('../app');

const USER_EMAIL  = 'sessions-mgmt-test@conduta.dev';
const OTHER_EMAIL = 'sessions-mgmt-other@conduta.dev';

let userToken, userId, otherId, otherToken, sessionId, sessionWithSummaryId;

beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[USER_EMAIL, OTHER_EMAIL]]);

  const hash = await bcrypt.hash('senha123', 10);
  const userRow = await pool.query(
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, 'User Sessão', $2) RETURNING id`,
    [USER_EMAIL, hash]
  );
  userId = userRow.rows[0].id;

  const otherHash = await bcrypt.hash('senha123', 10);
  const otherRow = await pool.query(
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, 'Outro User', $2) RETURNING id`,
    [OTHER_EMAIL, otherHash]
  );
  otherId = otherRow.rows[0].id;

  const loginRes = await request(app).post('/auth/login').send({ email: USER_EMAIL, senha: 'senha123' });
  userToken = loginRes.body.token;

  const otherLoginRes = await request(app).post('/auth/login').send({ email: OTHER_EMAIL, senha: 'senha123' });
  otherToken = otherLoginRes.body.token;

  const sessRow = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Sessão Original') RETURNING id`,
    [userId]
  );
  sessionId = sessRow.rows[0].id;

  const summaryRow = await pool.query(
    `INSERT INTO sessions (user_id, titulo, summary) VALUES ($1, 'Caso PDF', $2) RETURNING id`,
    [userId, JSON.stringify({ hipotese: 'IAM', conduta: 'AAS + morfina', alertas: ['Risco alto'] })]
  );
  sessionWithSummaryId = summaryRow.rows[0].id;
  await pool.query(
    `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', 'Paciente com dor torácica há 2h')`,
    [sessionWithSummaryId]
  );
});

// ── GET /sessions/:id — inclui summary ────────────────────────

describe('GET /sessions/:id', () => {
  it('inclui summary na resposta quando disponível', async () => {
    const res = await request(app)
      .get(`/sessions/${sessionWithSummaryId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.session.summary).toBeDefined();
    expect(res.body.session.summary.hipotese).toBe('IAM');
  });
});

afterAll(async () => {
  await pool.query('DELETE FROM sessions WHERE user_id = ANY($1)', [[userId, otherId]]);
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[USER_EMAIL, OTHER_EMAIL]]);
  await pool.end();
});

// ── PUT /sessions/:id ──────────────────────────────────────────

describe('PUT /sessions/:id', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).put(`/sessions/${sessionId}`).send({ titulo: 'Novo' });
    expect(res.status).toBe(401);
  });

  it('retorna 400 quando título está vazio', async () => {
    const res = await request(app)
      .put(`/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ titulo: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 404 para sessão de outro usuário', async () => {
    const res = await request(app)
      .put(`/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ titulo: 'Tentativa' });
    expect(res.status).toBe(404);
  });

  it('renomeia sessão com sucesso', async () => {
    const res = await request(app)
      .put(`/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ titulo: 'Sessão Renomeada' });
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Sessão Renomeada');
    expect(res.body.id).toBe(sessionId);
  });
});

// ── DELETE /sessions/:id ───────────────────────────────────────

describe('DELETE /sessions/:id', () => {
  let sessionToDeleteId;

  beforeEach(async () => {
    const row = await pool.query(
      `INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Para Deletar') RETURNING id`,
      [userId]
    );
    sessionToDeleteId = row.rows[0].id;
    await pool.query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', 'msg teste')`,
      [sessionToDeleteId]
    );
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).delete(`/sessions/${sessionToDeleteId}`);
    expect(res.status).toBe(401);
    // cleanup
    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionToDeleteId]);
  });

  it('retorna 404 para sessão de outro usuário', async () => {
    const res = await request(app)
      .delete(`/sessions/${sessionToDeleteId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
    // cleanup
    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionToDeleteId]);
  });

  it('deleta sessão e suas mensagens', async () => {
    const res = await request(app)
      .delete(`/sessions/${sessionToDeleteId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(204);

    const checkSession = await pool.query('SELECT id FROM sessions WHERE id = $1', [sessionToDeleteId]);
    expect(checkSession.rows.length).toBe(0);

    const checkMessages = await pool.query('SELECT id FROM messages WHERE session_id = $1', [sessionToDeleteId]);
    expect(checkMessages.rows.length).toBe(0);
  });
});

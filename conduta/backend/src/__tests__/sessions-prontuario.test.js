const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pg');
const app = require('../app');

jest.mock('../services/stripe', () => ({
  customers: { list: jest.fn(), create: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
}));

jest.mock('../services/prontuario', () => ({
  gerarResumoProntuario: jest.fn().mockResolvedValue('QUEIXA PRINCIPAL: febre.\nCONDUTA: sintomáticos.'),
}));

const { gerarResumoProntuario } = require('../services/prontuario');

let token;
let sessionComResposta;
let sessionVazia;

beforeAll(async () => {
  require('dotenv').config();
  const hash = await bcrypt.hash('senha123', 10);
  const userRes = await pool.query(
    `INSERT INTO users (email, nome, senha_hash, email_verified) VALUES ($1, $2, $3, TRUE) RETURNING id`,
    ['prontuario_test@conduta.dev', 'Dr. Prontuário', hash]
  );
  const userId = userRes.rows[0].id;
  const svRes = await pool.query('SELECT session_version FROM users WHERE id = $1', [userId]);
  token = jwt.sign({ sub: userId, sv: svRes.rows[0].session_version }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const s1 = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Com resposta') RETURNING id`,
    [userId]
  );
  sessionComResposta = s1.rows[0].id;
  await pool.query(`INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', 'caso febre')`, [sessionComResposta]);
  await pool.query(`INSERT INTO messages (session_id, role, content) VALUES ($1, 'assistant', 'análise da febre')`, [sessionComResposta]);

  const s2 = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Vazia') RETURNING id`,
    [userId]
  );
  sessionVazia = s2.rows[0].id;
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = 'prontuario_test@conduta.dev'`);
});

beforeEach(() => {
  jest.clearAllMocks();
  gerarResumoProntuario.mockResolvedValue('QUEIXA PRINCIPAL: febre.\nCONDUTA: sintomáticos.');
});

describe('POST /sessions/:id/prontuario', () => {
  it('404 para sessão inexistente', async () => {
    const res = await request(app)
      .post('/sessions/00000000-0000-0000-0000-000000000000/prontuario')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('400 para sessão sem resposta do assistente', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionVazia}/prontuario`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('gera, salva e retorna cached=false na primeira chamada', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionComResposta}/prontuario`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false);
    expect(res.body.prontuario).toContain('QUEIXA PRINCIPAL');
    expect(gerarResumoProntuario).toHaveBeenCalledTimes(1);
  });

  it('segunda chamada sem mensagens novas retorna cache sem chamar LLM', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionComResposta}/prontuario`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(true);
    expect(gerarResumoProntuario).not.toHaveBeenCalled();
  });

  it('mensagem nova invalida o cache', async () => {
    await pool.query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'assistant', 'nova análise')`,
      [sessionComResposta]
    );
    const res = await request(app)
      .post(`/sessions/${sessionComResposta}/prontuario`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false);
    expect(gerarResumoProntuario).toHaveBeenCalledTimes(1);
  });
});

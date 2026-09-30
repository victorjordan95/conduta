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

jest.mock('../services/declaracao-obito', () => ({
  gerarDeclaracaoObito: jest.fn(),
}));

const { gerarDeclaracaoObito } = require('../services/declaracao-obito');

let token;
let sessionComResposta;
let sessionVazia;

beforeAll(async () => {
  require('dotenv').config();
  const hash = await bcrypt.hash('senha123', 10);
  const userRes = await pool.query(
    `INSERT INTO users (email, nome, senha_hash, email_verified) VALUES ($1, $2, $3, TRUE) RETURNING id`,
    ['do_test@conduta.dev', 'Dr. DO', hash]
  );
  const userId = userRes.rows[0].id;
  const svRes = await pool.query('SELECT session_version FROM users WHERE id = $1', [userId]);
  token = jwt.sign({ sub: userId, sv: svRes.rows[0].session_version }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const s1 = await pool.query(`INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Com resposta') RETURNING id`, [userId]);
  sessionComResposta = s1.rows[0].id;
  await pool.query(`INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', 'paciente evoluiu a óbito')`, [sessionComResposta]);
  await pool.query(`INSERT INTO messages (session_id, role, content) VALUES ($1, 'assistant', 'análise')`, [sessionComResposta]);

  const s2 = await pool.query(`INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Vazia') RETURNING id`, [userId]);
  sessionVazia = s2.rows[0].id;
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = 'do_test@conduta.dev'`);
});

describe('POST /sessions/:id/declaracao-obito', () => {
  const post = (id) => request(app).post(`/sessions/${id}/declaracao-obito`).set('Authorization', `Bearer ${token}`);

  it('404 para sessão inexistente', async () => {
    expect((await post('00000000-0000-0000-0000-000000000000')).status).toBe(404);
  });

  it('400 para sessão sem análise', async () => {
    expect((await post(sessionVazia)).status).toBe(400);
  });

  it('retorna o rascunho gerado', async () => {
    gerarDeclaracaoObito.mockResolvedValueOnce({ sexo: 'feminino', parte1: [], alertas: [] });
    const res = await post(sessionComResposta);
    expect(res.status).toBe(200);
    expect(res.body.declaracao.sexo).toBe('feminino');
  });

  it('502 quando o modelo falha', async () => {
    gerarDeclaracaoObito.mockRejectedValueOnce(new Error('JSON inválido'));
    const res = await post(sessionComResposta);
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/rascunho/);
  });
});

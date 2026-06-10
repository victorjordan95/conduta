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

jest.mock('../services/openrouter', () => ({
  collectAnalysis: jest.fn().mockResolvedValue('analise interna mock'),
  streamReview: jest.fn(async (userCase, firstAnalysis, res) => {
    res.write('data: {"content":"resposta completa mock"}\n\n');
    return 'resposta completa mock';
  }),
  streamQuick: jest.fn(async (history, content, ctx, summary, res) => {
    res.write('data: {"content":"resposta rapida mock"}\n\n');
    return 'resposta rapida mock';
  }),
  buildMessages: jest.fn(),
}));

jest.mock('../services/knowledge-extractor', () => ({
  extractAndPersist: jest.fn().mockResolvedValue(null),
}));
jest.mock('../services/session-summarizer', () => ({
  generateAndSave: jest.fn().mockResolvedValue(null),
}));
jest.mock('../services/embeddings', () => ({
  embed: jest.fn().mockResolvedValue([]),
}));
jest.mock('../services/neo4j-search', () => ({
  searchClinicalContext: jest.fn().mockResolvedValue(null),
  searchFollowUpContext: jest.fn().mockResolvedValue(null),
}));
jest.mock('../services/case-search', () => ({
  searchSimilarCases: jest.fn().mockResolvedValue(null),
}));

const { collectAnalysis, streamReview, streamQuick } = require('../services/openrouter');

let token;
let sessionId;

beforeAll(async () => {
  require('dotenv').config();
  const hash = await bcrypt.hash('senha123', 10);
  const userRes = await pool.query(
    `INSERT INTO users (email, nome, senha_hash, email_verified) VALUES ($1, $2, $3, TRUE) RETURNING id`,
    ['analyze_mode_test@conduta.dev', 'Dr. Mode', hash]
  );
  const userId = userRes.rows[0].id;
  const svRes = await pool.query('SELECT session_version FROM users WHERE id = $1', [userId]);
  token = jwt.sign({ sub: userId, sv: svRes.rows[0].session_version }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const sessRes = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, $2) RETURNING id`,
    [userId, 'Sessão Modo']
  );
  sessionId = sessRes.rows[0].id;
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = 'analyze_mode_test@conduta.dev'`);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /analyze — param mode', () => {
  it('mode inválido retorna 400', async () => {
    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ session_id: sessionId, content: 'caso', mode: 'turbo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/mode/);
  });

  it('mode=rapida usa streamQuick e NÃO chama collectAnalysis', async () => {
    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ session_id: sessionId, content: 'caso rápido', mode: 'rapida' });
    expect(res.status).toBe(200);
    expect(streamQuick).toHaveBeenCalled();
    expect(collectAnalysis).not.toHaveBeenCalled();
    expect(streamReview).not.toHaveBeenCalled();
  });

  it('sem mode usa pipeline completo (collectAnalysis + streamReview)', async () => {
    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ session_id: sessionId, content: 'caso completo' });
    expect(res.status).toBe(200);
    expect(collectAnalysis).toHaveBeenCalled();
    expect(streamReview).toHaveBeenCalled();
    expect(streamQuick).not.toHaveBeenCalled();
  });
});

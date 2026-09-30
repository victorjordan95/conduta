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
    res.write('data: {"content":"resposta mock"}\n\n');
    return 'resposta mock';
  }),
  streamQuick: jest.fn(),
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

let token;
let sessionId;

beforeAll(async () => {
  require('dotenv').config();
  const hash = await bcrypt.hash('senha123', 10);
  const userRes = await pool.query(
    `INSERT INTO users (email, nome, senha_hash, email_verified) VALUES ($1, $2, $3, TRUE) RETURNING id`,
    ['analyze_sse_test@conduta.dev', 'Dr. SSE', hash]
  );
  const userId = userRes.rows[0].id;

  // Ler session_version inicial do usuário para incluir sv no JWT (exigido pelo authMiddleware)
  const svRes = await pool.query('SELECT session_version FROM users WHERE id = $1', [userId]);
  const sv = svRes.rows[0].session_version;
  token = jwt.sign({ sub: userId, sv }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const sessRes = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, $2) RETURNING id`,
    [userId, 'Sessão de Teste SSE']
  );
  sessionId = sessRes.rows[0].id;

  // Inserir 3 pares user/assistant para testar contagem
  for (let i = 0; i < 3; i++) {
    await pool.query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', $2)`,
      [sessionId, `pergunta ${i}`]
    );
    await pool.query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'assistant', $2)`,
      [sessionId, `resposta ${i}`]
    );
  }
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = 'analyze_sse_test@conduta.dev'`);
});

describe('POST /analyze — evento SSE session_msg_count', () => {
  it('emite session_msg_count como primeiro evento SSE antes do conteúdo', async () => {
    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'text/event-stream')
      .send({ session_id: sessionId, content: 'nova pergunta' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);

    const lines = res.text.split('\n').filter((l) => l.startsWith('data: '));
    expect(lines.length).toBeGreaterThan(0);

    const firstEvent = JSON.parse(lines[0].slice(6));
    // 3 mensagens user já no histórico antes desta nova
    expect(firstEvent).toHaveProperty('session_msg_count', 3);

    // segundo evento deve ser conteúdo, não outro metadata
    const secondEvent = JSON.parse(lines[1].slice(6));
    expect(secondEvent).toHaveProperty('content');
  });
});

describe('POST /analyze — falha do modelo após headers SSE', () => {
  it('emite evento error e encerra o stream quando a fase 1 falha', async () => {
    const { collectAnalysis } = require('../services/openrouter');
    collectAnalysis.mockRejectedValueOnce(new Error('timeout upstream'));

    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ session_id: sessionId, content: 'caso que falha' });

    expect(res.status).toBe(200);
    const events = res.text.split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6));
    expect(events.some((e) => e !== '[DONE]' && JSON.parse(e).error)).toBe(true);
    expect(events).toContain('[DONE]');
  });
});

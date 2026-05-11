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
  streamAnalysis: jest.fn(async (history, content, ctx, summary, res) => {
    res.write('data: {"content":"resposta mock"}\n\n');
    res.write('data: [DONE]\n\n');
    res.end();
    return 'resposta mock';
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
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, $2, $3) RETURNING id`,
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

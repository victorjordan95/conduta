const request = require('supertest');
const jwt = require('jsonwebtoken');
const pool = require('../db/pg');
const app = require('../app');

jest.mock('../services/stripe', () => ({
  customers: { list: jest.fn(), create: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
}));
jest.mock('../services/knowledge-feedback', () => ({
  recordKnowledgeFeedback: jest.fn().mockResolvedValue(null),
}));

let token;
let messageId;

beforeAll(async () => {
  require('dotenv').config();
  const u = await pool.query(
    `INSERT INTO users (email, nome, senha_hash, email_verified) VALUES ('feedback_partial@conduta.dev', 'Dr. F', 'x', TRUE)
     RETURNING id, session_version`
  );
  token = jwt.sign({ sub: u.rows[0].id, sv: u.rows[0].session_version }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const s = await pool.query(`INSERT INTO sessions (user_id, titulo) VALUES ($1, 'F') RETURNING id`, [u.rows[0].id]);
  const m = await pool.query(
    `INSERT INTO messages (session_id, role, content) VALUES ($1, 'assistant', 'análise') RETURNING id`,
    [s.rows[0].id]
  );
  messageId = m.rows[0].id;
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = 'feedback_partial@conduta.dev'`);
});

it("POST /feedback aceita 'partial' (constraint do banco alinhada à API)", async () => {
  const res = await request(app)
    .post('/feedback')
    .set('Authorization', `Bearer ${token}`)
    .send({ message_id: messageId, feedback: 'partial', note: 'faltou dose' });
  expect(res.status).toBe(200);
});

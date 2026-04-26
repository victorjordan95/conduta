const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockRun = jest.fn();
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockRun, close: mockClose })),
}));

jest.mock('../db/pg', () => ({
  query: jest.fn(),
}));

const pool = require('../db/pg');
const app = require('../app');

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

function makeAdminToken() {
  return jwt.sign({ sub: 'admin-user-id', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
}

beforeEach(() => {
  mockRun.mockReset();
  pool.query.mockReset();
  // adminMiddleware faz SELECT role FROM users WHERE id = $1
  pool.query.mockResolvedValue({ rows: [{ role: 'admin' }] });
});

describe('GET /admin/knowledge/pending', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/admin/knowledge/pending');
    expect(res.status).toBe(401);
  });

  it('retorna 403 com token de user comum', async () => {
    const userToken = jwt.sign({ sub: 'user-id', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    pool.query.mockResolvedValueOnce({ rows: [{ role: 'user' }] });
    const res = await request(app)
      .get('/admin/knowledge/pending')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('retorna lista de itens pendentes', async () => {
    mockRun.mockResolvedValueOnce({
      records: [
        {
          get: (k) => ({
            tipo: 'Diagnostico',
            elementId: 'elem-1',
            nome: 'Diagnóstico Novo',
            cid: 'X01',
            sourceSessionId: 'sess-1',
            createdAt: '2026-04-05T10:00:00.000Z',
          }[k]),
        },
      ],
    });

    const res = await request(app)
      .get('/admin/knowledge/pending')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ tipo: 'Diagnostico', nome: 'Diagnóstico Novo' });
  });
});

describe('POST /admin/knowledge/:elementId/approve', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/admin/knowledge/elem-1/approve');
    expect(res.status).toBe(401);
  });

  it('aprova o item e retorna 200', async () => {
    mockRun.mockResolvedValueOnce({ records: [{ get: () => 'Diagnostico' }] });
    mockRun.mockResolvedValueOnce({ summary: { counters: { updates: () => ({ propertiesSet: 3 }) } } });

    const res = await request(app)
      .post('/admin/knowledge/elem-abc/approve')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ approvedBy: 'user-1' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ approved: true });
  });
});

describe('DELETE /admin/knowledge/:elementId', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).delete('/admin/knowledge/elem-1');
    expect(res.status).toBe(401);
  });

  it('rejeita (remove) o item e retorna 200', async () => {
    mockRun.mockResolvedValueOnce({ summary: {} });

    const res = await request(app)
      .delete('/admin/knowledge/elem-abc')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ rejected: true });
  });
});

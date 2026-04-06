const request = require('supertest');

const mockRun = jest.fn();
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockRun, close: mockClose })),
}));

const app = require('../app');

const ADMIN_SECRET = 'test-admin-secret';
process.env.ADMIN_SECRET = ADMIN_SECRET;

beforeEach(() => {
  mockRun.mockReset();
});

describe('GET /admin/knowledge/pending', () => {
  it('retorna 403 sem header de admin', async () => {
    const res = await request(app).get('/admin/knowledge/pending');
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
      .set('x-admin-secret', ADMIN_SECRET);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ tipo: 'Diagnostico', nome: 'Diagnóstico Novo' });
  });
});

describe('POST /admin/knowledge/:elementId/approve', () => {
  it('retorna 403 sem header de admin', async () => {
    const res = await request(app).post('/admin/knowledge/elem-1/approve');
    expect(res.status).toBe(403);
  });

  it('aprova o item e retorna 200', async () => {
    mockRun.mockResolvedValueOnce({ records: [{ get: () => 'Diagnostico' }] });
    mockRun.mockResolvedValueOnce({ summary: { counters: { updates: () => ({ propertiesSet: 3 }) } } });

    const res = await request(app)
      .post('/admin/knowledge/elem-abc/approve')
      .set('x-admin-secret', ADMIN_SECRET)
      .send({ approvedBy: 'user-1' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ approved: true });
  });
});

describe('DELETE /admin/knowledge/:elementId', () => {
  it('retorna 403 sem header de admin', async () => {
    const res = await request(app).delete('/admin/knowledge/elem-1');
    expect(res.status).toBe(403);
  });

  it('rejeita (remove) o item e retorna 200', async () => {
    mockRun.mockResolvedValueOnce({ summary: {} });

    const res = await request(app)
      .delete('/admin/knowledge/elem-abc')
      .set('x-admin-secret', ADMIN_SECRET);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ rejected: true });
  });
});

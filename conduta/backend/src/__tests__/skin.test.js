const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const app = require('../app');

jest.mock('../services/skin-classifier', () => ({
  classificar: jest.fn(),
}));

const { classificar } = require('../services/skin-classifier');

let tokenFree;
let tokenPro;
let tokenAdmin;

beforeAll(async () => {
  const hash = await bcrypt.hash('senha123', 10);

  await pool.query(
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, $2, $3)`,
    ['skin-free@conduta.dev', 'Dr. Free', hash]
  );

  await pool.query(
    `INSERT INTO users (email, nome, senha_hash, plan) VALUES ($1, $2, $3, $4)`,
    ['skin-pro@conduta.dev', 'Dr. Pro', hash, 'pro']
  );

  await pool.query(
    `INSERT INTO users (email, nome, senha_hash, role) VALUES ($1, $2, $3, $4)`,
    ['skin-admin@conduta.dev', 'Dr. Admin', hash, 'admin']
  );

  const loginFree = await request(app)
    .post('/auth/login')
    .send({ email: 'skin-free@conduta.dev', senha: 'senha123' });
  tokenFree = loginFree.body.token;

  const loginPro = await request(app)
    .post('/auth/login')
    .send({ email: 'skin-pro@conduta.dev', senha: 'senha123' });
  tokenPro = loginPro.body.token;

  const loginAdmin = await request(app)
    .post('/auth/login')
    .send({ email: 'skin-admin@conduta.dev', senha: 'senha123' });
  tokenAdmin = loginAdmin.body.token;
});

afterAll(async () => {
  await pool.query(
    'DELETE FROM users WHERE email = ANY($1)',
    [['skin-free@conduta.dev', 'skin-pro@conduta.dev', 'skin-admin@conduta.dev']]
  );
  await pool.end();
});

beforeEach(() => jest.clearAllMocks());

describe('POST /skin/classificar', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/skin/classificar');
    expect(res.status).toBe(401);
  });

  it('retorna 403 para usuário free', async () => {
    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenFree}`)
      .attach('imagem', Buffer.from('fake-img'), {
        filename: 'lesao.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/fase de testes/i);
  });

  it('retorna 403 para usuário pro (feature oculta)', async () => {
    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenPro}`)
      .attach('imagem', Buffer.from('fake-img'), {
        filename: 'lesao.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/fase de testes/i);
  });

  it('retorna 400 sem imagem', async () => {
    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatória/i);
  });

  it('retorna 400 para formato inválido', async () => {
    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('imagem', Buffer.from('fake'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JPEG ou PNG/i);
  });

  it('retorna 200 com classificação para admin', async () => {
    classificar.mockResolvedValue(
      'Classificação de lesão cutânea (IA): Melanoma (87%)\n⚠️ Esta classificação é suporte.'
    );

    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('imagem', Buffer.from('fake-img'), {
        filename: 'lesao.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(200);
    expect(res.body.classificacao).toContain('Melanoma');
  });

  it('retorna 400 para imagem maior que 5MB', async () => {
    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('imagem', Buffer.alloc(6 * 1024 * 1024), {
        filename: 'grande.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5MB/i);
  });

  it('retorna 503 quando HF está indisponível', async () => {
    classificar.mockRejectedValue(
      Object.assign(new Error('HF down'), { status: 503 })
    );

    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('imagem', Buffer.from('fake-img'), {
        filename: 'lesao.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(503);
  });
});

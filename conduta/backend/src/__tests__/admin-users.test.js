require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const app = require('../app');

const ADMIN_EMAIL = 'admin-mgmt-test@conduta.dev';
const USER_EMAIL  = 'user-mgmt-test@conduta.dev';

let adminToken, adminId, userId, userToken;

beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[ADMIN_EMAIL, USER_EMAIL]]);

  const adminHash = await bcrypt.hash('senha123', 10);
  const adminRow = await pool.query(
    `INSERT INTO users (email, nome, senha_hash, role) VALUES ($1, 'Admin Teste', $2, 'admin') RETURNING id`,
    [ADMIN_EMAIL, adminHash]
  );
  adminId = adminRow.rows[0].id;

  const userHash = await bcrypt.hash('senha123', 10);
  const userRow = await pool.query(
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, 'Usuário Teste', $2) RETURNING id`,
    [USER_EMAIL, userHash]
  );
  userId = userRow.rows[0].id;

  const adminLogin = await request(app)
    .post('/auth/login')
    .send({ email: ADMIN_EMAIL, senha: 'senha123' });
  adminToken = adminLogin.body.token;

  const userLogin = await request(app)
    .post('/auth/login')
    .send({ email: USER_EMAIL, senha: 'senha123' });
  userToken = userLogin.body.token;
});

describe('GET /admin/users', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(401);
  });

  it('retorna 403 para usuário comum', async () => {
    const res = await request(app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('retorna lista de usuários para admin', async () => {
    const res = await request(app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((u) => u.email === USER_EMAIL)).toBe(true);
    expect(res.body[0]).toMatchObject({
      id: expect.any(String),
      email: expect.any(String),
      nome: expect.any(String),
      role: expect.any(String),
      plan: expect.any(String),
      active: expect.any(Boolean),
    });
  });

  it('filtra usuários por search', async () => {
    const res = await request(app)
      .get('/admin/users?search=Usuário Teste')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.every((u) => u.nome.includes('Usuário') || u.email.includes('Usuário'))).toBe(true);
  });

  it('retorna array vazio para search sem correspondência', async () => {
    const res = await request(app)
      .get('/admin/users?search=xyzabc_inexistente')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[ADMIN_EMAIL, USER_EMAIL]]);
  await pool.end();
});

describe('authMiddleware — active check', () => {
  it('retorna 401 com "Conta desativada." quando active=false', async () => {
    await pool.query('UPDATE users SET active = false WHERE id = $1', [userId]);

    const res = await request(app)
      .get('/usage')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Conta desativada.');

    // Restaurar para não quebrar outros testes
    await pool.query('UPDATE users SET active = true WHERE id = $1', [userId]);
  });
});

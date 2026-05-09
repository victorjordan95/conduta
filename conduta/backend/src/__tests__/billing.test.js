const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const app = require('../app');

jest.mock('../services/stripe', () => ({
  customers: {
    list: jest.fn(),
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
}));

const stripe = require('../services/stripe');

let token;
let userId;

beforeAll(async () => {
  const hash = await bcrypt.hash('senha123', 10);
  const res = await pool.query(
    `INSERT INTO users (email, nome, senha_hash)
     VALUES ($1, $2, $3) RETURNING id`,
    ['billing@conduta.dev', 'Dr. Billing', hash]
  );
  userId = res.rows[0].id;

  const login = await request(app)
    .post('/auth/login')
    .send({ email: 'billing@conduta.dev', senha: 'senha123' });
  token = login.body.token;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', ['billing@conduta.dev']);
  await pool.end();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /billing/checkout', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/billing/checkout');
    expect(res.status).toBe(401);
  });

  it('cria customer novo e retorna URL de checkout', async () => {
    stripe.customers.list.mockResolvedValue({ data: [] });
    stripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
    stripe.checkout.sessions.create.mockResolvedValue({
      url: 'https://checkout.stripe.com/test',
    });

    const res = await request(app)
      .post('/billing/checkout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url', 'https://checkout.stripe.com/test');
    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: 'billing@conduta.dev',
      metadata: { userId },
    });
  });

  it('reutiliza customer existente se stripe_customer_id já salvo', async () => {
    await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [
      'cus_existing',
      userId,
    ]);
    stripe.checkout.sessions.create.mockResolvedValue({
      url: 'https://checkout.stripe.com/test2',
    });

    const res = await request(app)
      .post('/billing/checkout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(stripe.customers.create).not.toHaveBeenCalled();
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' })
    );

    await pool.query('UPDATE users SET stripe_customer_id = NULL WHERE id = $1', [userId]);
  });
});

describe('POST /billing/portal', () => {
  it('retorna 400 se usuário não tem stripe_customer_id', async () => {
    const res = await request(app)
      .post('/billing/portal')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('retorna URL do portal quando customer existe', async () => {
    await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [
      'cus_portal',
      userId,
    ]);
    stripe.billingPortal.sessions.create.mockResolvedValue({
      url: 'https://billing.stripe.com/portal',
    });

    const res = await request(app)
      .post('/billing/portal')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url', 'https://billing.stripe.com/portal');

    await pool.query('UPDATE users SET stripe_customer_id = NULL WHERE id = $1', [userId]);
  });
});

describe('POST /billing/webhook', () => {
  it('retorna 400 com assinatura inválida', async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const res = await request(app)
      .post('/billing/webhook')
      .set('stripe-signature', 'invalid')
      .send(Buffer.from('{}'));

    expect(res.status).toBe(400);
  });

  it('checkout.session.completed — atualiza plan para pro', async () => {
    await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [
      'cus_webhook',
      userId,
    ]);

    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_webhook',
          subscription: 'sub_test123',
          payment_status: 'paid',
        },
      },
    });

    const res = await request(app)
      .post('/billing/webhook')
      .set('stripe-signature', 'valid_mock')
      .set('content-type', 'application/json')
      .send(Buffer.from('{}'));

    expect(res.status).toBe(200);

    const db = await pool.query('SELECT plan FROM users WHERE id = $1', [userId]);
    expect(db.rows[0].plan).toBe('pro');

    await pool.query('UPDATE users SET plan = $1, stripe_customer_id = NULL WHERE id = $2', [
      'free',
      userId,
    ]);
  });

  it('customer.subscription.deleted — reverte plan para free', async () => {
    await pool.query(
      'UPDATE users SET plan = $1, stripe_customer_id = $2 WHERE id = $3',
      ['pro', 'cus_deleted', userId]
    );

    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_deleted' } },
    });

    const res = await request(app)
      .post('/billing/webhook')
      .set('stripe-signature', 'valid_mock')
      .set('content-type', 'application/json')
      .send(Buffer.from('{}'));

    expect(res.status).toBe(200);

    const db = await pool.query('SELECT plan FROM users WHERE id = $1', [userId]);
    expect(db.rows[0].plan).toBe('free');

    await pool.query('UPDATE users SET stripe_customer_id = NULL WHERE id = $1', [userId]);
  });
});

# Stripe Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar Stripe para cobrar a mensalidade Pro (R$39,90/mês) com checkout hosted, portal de autoatendimento e webhooks que atualizam o campo `plan` no PostgreSQL automaticamente.

**Architecture:** O backend expõe três endpoints em `/billing`: `POST /checkout` (cria sessão de pagamento), `POST /portal` (cria sessão do Customer Portal), e `POST /webhook` (recebe eventos Stripe). O webhook é registrado com `express.raw()` antes do `express.json()` global para que a assinatura Stripe possa ser verificada. O `plan` do usuário é atualizado no PostgreSQL diretamente pelos eventos `checkout.session.completed` (free→pro) e `customer.subscription.deleted`/`updated` (pro→free). O frontend redireciona o usuário para o Stripe Checkout e, ao voltar com `?success=true`, chama `GET /auth/me` para atualizar o plano em localStorage.

**Tech Stack:** `stripe` npm SDK (backend), Stripe Checkout hosted, Stripe Customer Portal, Stripe webhooks, PostgreSQL migration, React + AuthContext (frontend).

---

## File Map

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `backend/src/services/stripe.js` | Instância singleton do Stripe SDK |
| Criar | `backend/src/routes/billing.js` | POST /checkout, POST /portal + webhookHandler exportado |
| Criar | `backend/src/db/migrations/011_stripe_customer.sql` | Coluna `stripe_customer_id` em users |
| Criar | `backend/src/__tests__/billing.test.js` | Testes com Stripe mockado |
| Modificar | `backend/src/app.js` | Registrar webhook (raw body) antes de express.json(), registrar /billing |
| Modificar | `backend/src/routes/auth.js` | GET /auth/me — retorna user atual do DB |
| Modificar | `frontend/src/services/api.js` | createCheckoutSession, getBillingPortalUrl, getMe |
| Modificar | `frontend/src/context/AuthContext.jsx` | refreshUser() — chama getMe e atualiza localStorage |
| Modificar | `frontend/src/components/Sidebar.jsx` | Botão "Assinar Pro" (free) e "Gerenciar assinatura" (pro) |
| Modificar | `frontend/src/pages/Dashboard.jsx` | Detectar ?success=true e chamar refreshUser |

---

## Variáveis de Ambiente Necessárias

```
# Backend (.env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...        # ID do preço mensal Pro no Stripe Dashboard
FRONTEND_URL=http://localhost:5173  # em prod: https://app.conduta.med.br
```

---

## Task 1: Migração — coluna stripe_customer_id

**Files:**
- Create: `backend/src/db/migrations/011_stripe_customer.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
```

- [ ] **Step 2: Executar a migration**

```bash
cd backend && npm run migrate
```

Expected output: `Migration executada: 011_stripe_customer.sql`

- [ ] **Step 3: Commit**

```bash
git add backend/src/db/migrations/011_stripe_customer.sql
git commit -m "feat(db): adiciona coluna stripe_customer_id em users"
```

---

## Task 2: Instalar Stripe SDK

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Instalar**

```bash
cd backend && npm install stripe
```

Expected: `stripe` aparece em `dependencies` no `package.json`.

- [ ] **Step 2: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "feat(deps): adiciona stripe SDK"
```

---

## Task 3: Serviço Stripe

**Files:**
- Create: `backend/src/services/stripe.js`

- [ ] **Step 1: Escrever o teste (falha esperada)**

Crie `backend/src/__tests__/billing.test.js` com apenas o import para verificar se o módulo carrega:

```js
// billing.test.js — apenas verifica que o módulo não explode sem STRIPE_SECRET_KEY
describe('stripe service', () => {
  it('carrega sem lançar erro quando STRIPE_SECRET_KEY está definida', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    expect(() => require('../services/stripe')).not.toThrow();
    delete process.env.STRIPE_SECRET_KEY;
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar falha**

```bash
cd backend && npm test -- --testPathPattern=billing --no-coverage
```

Expected: FAIL — `Cannot find module '../services/stripe'`

- [ ] **Step 3: Criar o serviço**

```js
// backend/src/services/stripe.js
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

module.exports = stripe;
```

- [ ] **Step 4: Rodar o teste**

```bash
cd backend && npm test -- --testPathPattern=billing --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/stripe.js backend/src/__tests__/billing.test.js
git commit -m "feat(billing): serviço Stripe singleton"
```

---

## Task 4: Rotas de billing (checkout + portal + webhook)

**Files:**
- Create: `backend/src/routes/billing.js`

- [ ] **Step 1: Expandir o arquivo de testes**

Substitua o conteúdo de `backend/src/__tests__/billing.test.js` por:

```js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const app = require('../app');

// Mock do módulo Stripe — nunca chama API real nos testes
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

// ── POST /billing/checkout ──────────────────────────────────────
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

    // limpa para próximos testes
    await pool.query('UPDATE users SET stripe_customer_id = NULL WHERE id = $1', [userId]);
  });
});

// ── POST /billing/portal ───────────────────────────────────────
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

// ── POST /billing/webhook ──────────────────────────────────────
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

    // reset
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
```

- [ ] **Step 2: Rodar testes para confirmar falha**

```bash
cd backend && npm test -- --testPathPattern=billing --no-coverage
```

Expected: FAIL — `Cannot find module '../routes/billing'` (app.js não registra a rota ainda, mas o erro vem do app.js não do teste)

- [ ] **Step 3: Criar as rotas**

```js
// backend/src/routes/billing.js
const express = require('express');
const pool = require('../db/pg');
const stripe = require('../services/stripe');

const router = express.Router();

// POST /billing/checkout — cria Stripe Checkout Session
router.post('/checkout', async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT email, stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const { email, stripe_customer_id } = userRes.rows[0];

    let customerId = stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId: req.userId },
      });
      customerId = customer.id;
      await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [
        customerId,
        req.userId,
      ]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/?canceled=true`,
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[billing] checkout error:', err.message);
    res.status(500).json({ error: 'Erro ao criar sessão de pagamento.' });
  }
});

// POST /billing/portal — abre Customer Portal do Stripe
router.post('/portal', async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );
    const { stripe_customer_id } = userRes.rows[0] || {};

    if (!stripe_customer_id) {
      return res.status(400).json({ error: 'Nenhuma assinatura ativa encontrada.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: process.env.FRONTEND_URL,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[billing] portal error:', err.message);
    res.status(500).json({ error: 'Erro ao abrir portal de assinatura.' });
  }
});

// Exportado separadamente — registrado em app.js com express.raw() antes do express.json()
async function webhookHandler(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[billing] webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        await pool.query(
          'UPDATE users SET plan = $1 WHERE stripe_customer_id = $2',
          ['pro', session.customer]
        );
        console.log(`[billing] plan→pro para customer=${session.customer}`);
      }
    }

    if (
      event.type === 'customer.subscription.deleted' ||
      (event.type === 'customer.subscription.updated' &&
        event.data.object.status === 'canceled')
    ) {
      const sub = event.data.object;
      await pool.query(
        'UPDATE users SET plan = $1 WHERE stripe_customer_id = $2',
        ['free', sub.customer]
      );
      console.log(`[billing] plan→free para customer=${sub.customer}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[billing] webhook handler error:', err.message);
    res.status(500).json({ error: 'Erro interno no webhook.' });
  }
}

module.exports = router;
module.exports.webhookHandler = webhookHandler;
```

- [ ] **Step 4: Commit intermediário**

```bash
git add backend/src/routes/billing.js
git commit -m "feat(billing): rotas checkout, portal e webhookHandler"
```

---

## Task 5: Registrar billing em app.js

**Files:**
- Modify: `backend/src/app.js`

- [ ] **Step 1: Aplicar as mudanças**

No topo do arquivo, após os demais `require` de routes, adicione:

```js
const billingRoutes = require('./routes/billing');
const { webhookHandler } = require('./routes/billing');
```

Logo após `app.set('trust proxy', 1)` e **antes** de `app.use(express.json())`, adicione:

```js
// Webhook Stripe — raw body obrigatório para verificar assinatura
app.post('/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);
```

Após o bloco de middlewares globais (depois de `app.use(express.json())`), adicione:

```js
app.use('/billing', authMiddleware, billingRoutes);
```

O arquivo final relevante (apenas as linhas que mudam) fica assim:

```js
// ... requires existentes ...
const billingRoutes = require('./routes/billing');
const { webhookHandler } = require('./routes/billing');

// ...
app.set('trust proxy', 1);

// Webhook Stripe — raw body obrigatório para verificar assinatura (antes do express.json global)
app.post('/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);

// ... cors, helmet, express.json() existentes ...
app.use(express.json());

// ... health, auth, admin, sessions, analyze, usage, feedback existentes ...
app.use('/billing', authMiddleware, billingRoutes);

module.exports = app;
```

- [ ] **Step 2: Rodar os testes de billing**

```bash
cd backend && npm test -- --testPathPattern=billing --no-coverage
```

Expected: todos PASS

- [ ] **Step 3: Rodar toda a suite para detectar regressões**

```bash
cd backend && npm test --no-coverage
```

Expected: todos PASS (ou apenas falhas de DB unreachable se sem serviços)

- [ ] **Step 4: Commit**

```bash
git add backend/src/app.js
git commit -m "feat(billing): registra rotas billing em app.js com webhook raw body"
```

---

## Task 6: GET /auth/me

**Files:**
- Modify: `backend/src/routes/auth.js`

- [ ] **Step 1: Escrever o teste**

No arquivo `backend/src/__tests__/auth.test.js`, adicione no final:

```js
describe('GET /auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@conduta.dev', senha: 'senha123' });
    token = res.body.token;
  });

  it('retorna dados do usuário autenticado', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', 'test@conduta.dev');
    expect(res.body).toHaveProperty('plan');
    expect(res.body).not.toHaveProperty('senha_hash');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
cd backend && npm test -- --testPathPattern=auth --no-coverage
```

Expected: FAIL — `GET /auth/me` retorna 404

- [ ] **Step 3: Adicionar o endpoint em auth.js**

No arquivo `backend/src/routes/auth.js`, antes de `module.exports = router`, adicione:

```js
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, nome, role, plan, coachmarks_welcome_seen, coachmarks_session_seen
       FROM users WHERE id = $1`,
      [req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[AUTH] GET /me error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

- [ ] **Step 4: Rodar o teste**

```bash
cd backend && npm test -- --testPathPattern=auth --no-coverage
```

Expected: todos PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/auth.js backend/src/__tests__/auth.test.js
git commit -m "feat(auth): GET /auth/me retorna dados do usuário autenticado"
```

---

## Task 7: Frontend — funções de API

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Adicionar as três funções no final de api.js**

```js
export async function getMe() {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar usuário.');
  return res.json();
}

export async function createCheckoutSession() {
  const res = await fetch(`${BASE_URL}/billing/checkout`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao criar sessão de pagamento.');
  return res.json();
}

export async function getBillingPortalUrl() {
  const res = await fetch(`${BASE_URL}/billing/portal`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao abrir portal.');
  }
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/api.js
git commit -m "feat(api): adiciona getMe, createCheckoutSession, getBillingPortalUrl"
```

---

## Task 8: AuthContext — refreshUser

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: Adicionar import e função**

No topo do arquivo, adicione o import:

```js
import { getMe } from '../services/api';
```

Dentro de `AuthProvider`, após a função `clearAuth`, adicione:

```js
async function refreshUser() {
  if (!token) return;
  try {
    const data = await getMe();
    const updatedUser = { ...user, ...data };
    localStorage.setItem('conduta_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  } catch {}
}
```

No `return` do `AuthContext.Provider`, inclua `refreshUser` no value:

```js
<AuthContext.Provider value={{ token, user, kickMessage, saveAuth, clearAuth, refreshUser }}>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/context/AuthContext.jsx
git commit -m "feat(auth): refreshUser atualiza plan do usuário via GET /auth/me"
```

---

## Task 9: Sidebar — botões de upgrade e gerenciamento

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`

- [ ] **Step 1: Adicionar import e estado**

No topo do arquivo, adicione:

```js
import { createCheckoutSession, getBillingPortalUrl } from '../services/api';
```

Dentro do componente `Sidebar`, após as declarações de estado existentes, adicione:

```js
const [billingLoading, setBillingLoading] = useState(false);

async function handleUpgrade() {
  setBillingLoading(true);
  try {
    const { url } = await createCheckoutSession();
    window.location.href = url;
  } catch (err) {
    window.alert('Erro ao abrir pagamento. Tente novamente.');
  } finally {
    setBillingLoading(false);
  }
}

async function handleManageSubscription() {
  setBillingLoading(true);
  try {
    const { url } = await getBillingPortalUrl();
    window.location.href = url;
  } catch (err) {
    window.alert('Erro ao abrir portal. Tente novamente.');
  } finally {
    setBillingLoading(false);
  }
}
```

- [ ] **Step 2: Adicionar os botões no JSX**

No `<div className={styles.footer}>` (última seção do `aside`), substitua o conteúdo por:

```jsx
<div className={styles.footer}>
  {user?.plan === 'free' && (
    <button
      className={styles.upgradeBtn}
      onClick={handleUpgrade}
      disabled={billingLoading}
    >
      {billingLoading ? '...' : '⭐ Assinar Pro'}
    </button>
  )}
  {user?.plan === 'pro' && (
    <button
      className={styles.manageBtn}
      onClick={handleManageSubscription}
      disabled={billingLoading}
    >
      {billingLoading ? '...' : 'Gerenciar assinatura'}
    </button>
  )}
  <div className={styles.footerUser}>
    <span className={styles.userName}>{user?.nome}</span>
    <button className={styles.logoutBtn} onClick={clearAuth}>
      Sair
    </button>
  </div>
</div>
```

- [ ] **Step 3: Adicionar estilos em Sidebar.module.scss**

Abra `frontend/src/components/Sidebar.module.scss` e adicione ao final:

```scss
.upgradeBtn {
  width: 100%;
  padding: 0.55rem 1rem;
  background: $color-accent;
  color: #fff;
  border-radius: $border-radius;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0.5rem;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: $color-accent-hover; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.manageBtn {
  width: 100%;
  padding: 0.5rem 1rem;
  background: transparent;
  color: $color-text-sidebar;
  border: 1px solid rgba(176, 196, 204, 0.3);
  border-radius: $border-radius;
  font-size: 0.78rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
  transition: border-color 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    border-color: $color-text-sidebar;
    color: #fff;
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.footerUser {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

- [ ] **Step 4: Verificar que o footer existente no SCSS já tem os estilos base**

Abra `frontend/src/components/Sidebar.module.scss` e confirme que `.footer`, `.userName` e `.logoutBtn` existem. Se existirem, os estilos acima complementam sem conflito.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Sidebar.jsx frontend/src/components/Sidebar.module.scss
git commit -m "feat(sidebar): botões Assinar Pro e Gerenciar assinatura"
```

---

## Task 10: Dashboard — detectar retorno do Stripe

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`

- [ ] **Step 1: Importar refreshUser e adicionar useEffect**

Em `Dashboard.jsx`, o `useAuth` já importa. Adicione `refreshUser` na desestruturação:

```js
const { user, token, saveAuth, refreshUser } = useAuth();
```

Após os `useEffect` existentes, adicione:

```js
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('success') === 'true') {
    refreshUser();
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat(dashboard): detecta ?success=true e atualiza plano via refreshUser"
```

---

## Task 11: Configurar env vars e testar localmente

**Files:** nenhum arquivo de código

- [ ] **Step 1: No Stripe Dashboard, criar um produto**

1. Acesse https://dashboard.stripe.com/test/products
2. Crie produto "Conduta Pro" com preço R$39,90/mês recorrente
3. Copie o `price_xxx` gerado

- [ ] **Step 2: Adicionar env vars no backend/.env**

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
FRONTEND_URL=http://localhost:5173
```

(O `STRIPE_WEBHOOK_SECRET` vem do passo seguinte)

- [ ] **Step 3: Instalar Stripe CLI e iniciar listener local**

```bash
stripe listen --forward-to localhost:3000/billing/webhook
```

O comando imprime `whsec_...` — copie para `.env` como `STRIPE_WEBHOOK_SECRET`.

- [ ] **Step 4: Subir o ambiente local**

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev

# Terminal 3 — Stripe CLI (do passo anterior)
stripe listen --forward-to localhost:3000/billing/webhook
```

- [ ] **Step 5: Testar o fluxo completo**

1. Login com usuário `free`
2. Clique em "⭐ Assinar Pro" na sidebar
3. Preencha com cartão de teste `4242 4242 4242 4242`, qualquer data futura, qualquer CVC
4. Conclua o pagamento
5. Verifique que o terminal do Stripe CLI mostra `checkout.session.completed` → `200`
6. Verifique que o banco tem `plan = 'pro'` para o usuário
7. A página deve recarregar e mostrar "Gerenciar assinatura" na sidebar

- [ ] **Step 6: Configurar env vars em produção**

No Railway (backend):
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (do webhook registrado no Stripe Dashboard)
STRIPE_PRICE_ID=price_...
FRONTEND_URL=https://app.conduta.med.br
```

Na Vercel (frontend): nenhuma variável Stripe — tudo no backend.

No Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://<railway-url>/billing/webhook`
- Eventos: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`

- [ ] **Step 7: Push final**

```bash
git push
```

---

## Checklist de cobertura

| Requisito | Task |
|-----------|------|
| Checkout hosted Stripe | Task 4, 5 |
| Customer Portal (cancelar, trocar cartão) | Task 4, 5 |
| Webhook atualiza plan→pro na compra | Task 4, 5 |
| Webhook reverte plan→free no cancelamento | Task 4, 5 |
| Reutiliza stripe_customer_id existente | Task 4 |
| Botão "Assinar Pro" para plano free | Task 9 |
| Botão "Gerenciar assinatura" para plano pro | Task 9 |
| Atualiza plano no frontend após retorno | Task 8, 10 |
| GET /auth/me para refresh | Task 6, 7, 8 |
| Testes com Stripe mockado | Task 3, 4 |
| Env vars documentadas | Task 11 |

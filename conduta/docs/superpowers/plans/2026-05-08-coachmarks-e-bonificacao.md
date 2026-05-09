# Coachmarks e Bonificação por Feedback — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar tour de onboarding (coachmarks) ao dashboard e sistema de bonificação com +2 créditos de análise para feedbacks negativos validados pelo admin.

**Architecture:** Migration adiciona 3 colunas a `users` (`coachmarks_welcome_seen`, `coachmarks_session_seen`, `bonus_credits`). Backend expõe `PATCH /auth/me/coachmarks` e rotas admin de validação/crédito. Frontend usa um componente `Coachmark` com spotlight posicionado via `data-coachmark` attributes e `getBoundingClientRect`.

**Tech Stack:** Node.js/Express (backend), React 18 + SCSS Modules (frontend), PostgreSQL (dados), Neo4j (Correcao nodes), Supertest (testes backend), Vitest + Testing Library (testes frontend)

---

## Mapa de Arquivos

| Operação | Arquivo |
|---|---|
| CREATE | `conduta/backend/src/db/migrations/010_coachmarks_bonus_credits.sql` |
| CREATE | `conduta/frontend/src/components/Coachmark.jsx` |
| CREATE | `conduta/frontend/src/components/Coachmark.module.scss` |
| MODIFY | `conduta/backend/src/middleware/usageCheck.js` |
| MODIFY | `conduta/backend/src/routes/usage.js` |
| MODIFY | `conduta/backend/src/routes/auth.js` |
| MODIFY | `conduta/backend/src/routes/feedback.js` |
| MODIFY | `conduta/backend/src/routes/admin-feedback.js` |
| MODIFY | `conduta/backend/src/routes/admin.js` |
| MODIFY | `conduta/frontend/src/services/api.js` |
| MODIFY | `conduta/frontend/src/components/Sidebar.jsx` |
| MODIFY | `conduta/frontend/src/pages/Dashboard.jsx` |
| MODIFY | `conduta/frontend/src/pages/AdminKnowledge.jsx` |
| MODIFY | `conduta/backend/src/__tests__/auth.test.js` |
| MODIFY | `conduta/backend/src/__tests__/usage.test.js` |

---

## Task 1: Migration — colunas coachmarks e bonus_credits

**Files:**
- Create: `conduta/backend/src/db/migrations/010_coachmarks_bonus_credits.sql`

- [ ] **Step 1: Criar arquivo de migration**

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS coachmarks_welcome_seen BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS coachmarks_session_seen  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bonus_credits            INT     NOT NULL DEFAULT 0;
```

- [ ] **Step 2: Executar migration**

```bash
cd conduta/backend && node src/db/migrate.js
```

Esperado: `Migration executada: 010_coachmarks_bonus_credits.sql`

- [ ] **Step 3: Verificar no banco**

```bash
cd conduta/backend && node -e "
const pool = require('./src/db/pg');
pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = ANY($2)', ['users', ['coachmarks_welcome_seen','coachmarks_session_seen','bonus_credits']]).then(r => { console.log(r.rows); pool.end(); });
"
```

Esperado: 3 linhas listando as colunas.

- [ ] **Step 4: Commit**

```bash
git add conduta/backend/src/db/migrations/010_coachmarks_bonus_credits.sql
git commit -m "feat: migration — coachmarks_seen e bonus_credits em users"
```

---

## Task 2: Backend — usageCheck.js e usage.js com bonus_credits

**Files:**
- Modify: `conduta/backend/src/middleware/usageCheck.js`
- Modify: `conduta/backend/src/routes/usage.js`
- Modify: `conduta/backend/src/__tests__/usage.test.js`

- [ ] **Step 1: Escrever teste que falha — bonus_credits expande limite**

Adicionar ao final de `conduta/backend/src/__tests__/usage.test.js`:

```js
describe('bonus_credits', () => {
  it('GET /usage retorna bonus_credits do usuário', async () => {
    await pool.query('UPDATE users SET bonus_credits = 3 WHERE email = $1', [TEST_EMAIL]);
    const res = await request(app)
      .get('/usage')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.bonus_credits).toBe(3);
    await pool.query('UPDATE users SET bonus_credits = 0 WHERE email = $1', [TEST_EMAIL]);
  });

  it('POST /analyze não bloqueia quando used < limit + bonus_credits', async () => {
    // Preenche exatamente 15 mensagens (atingiria o limite normal)
    const values = Array.from({ length: 15 }, (_, i) => `($1, 'user', 'Caso ${i + 1}')`).join(', ');
    await pool.query(`INSERT INTO messages (session_id, role, content) VALUES ${values}`, [sessionId]);
    // Concede 2 créditos extras
    await pool.query('UPDATE users SET bonus_credits = 2 WHERE email = $1', [TEST_EMAIL]);

    // Sem chamar LLM real, apenas verifica que usageCheck passa (a rota /analyze pode falhar por outros motivos,
    // mas não deve retornar 429)
    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ session_id: sessionId, content: 'Caso extra com crédito' });

    expect(res.status).not.toBe(429);
    await pool.query('UPDATE users SET bonus_credits = 0 WHERE email = $1', [TEST_EMAIL]);
  });
});
```

- [ ] **Step 2: Rodar e verificar que falha**

```bash
cd conduta/backend && npx jest src/__tests__/usage.test.js --no-coverage 2>&1 | tail -20
```

Esperado: falha em `retorna bonus_credits` e `não bloqueia`.

- [ ] **Step 3: Atualizar usageCheck.js**

Substituir o conteúdo de `conduta/backend/src/middleware/usageCheck.js`:

```js
const pool = require('../db/pg');
const plans = require('../config/plans');

async function getMonthlyUsed(userId) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM messages m
     JOIN sessions s ON s.id = m.session_id
     WHERE s.user_id = $1
       AND m.role = 'user'
       AND m.created_at >= date_trunc('month', NOW())
       AND m.created_at < date_trunc('month', NOW()) + interval '1 month'`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

async function getBonusCredits(userId) {
  const result = await pool.query('SELECT bonus_credits FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.bonus_credits ?? 0;
}

async function usageCheck(req, res, next) {
  if (req.userRole === 'admin' || req.userPlan === 'pro') return next();

  try {
    const limit = plans.free.analysesPerMonth;
    const [used, bonusCredits] = await Promise.all([
      getMonthlyUsed(req.userId),
      getBonusCredits(req.userId),
    ]);

    if (used >= limit + bonusCredits) {
      return res.status(429).json({
        error: 'Você atingiu seu limite de análises este mês.',
        used,
        limit,
        bonus_credits: bonusCredits,
        plan: req.userPlan,
      });
    }

    next();
  } catch (err) {
    console.error('[usageCheck] Erro:', err.message);
    next();
  }
}

module.exports = { usageCheck, getMonthlyUsed, getBonusCredits };
```

- [ ] **Step 4: Atualizar usage.js para retornar bonus_credits**

Substituir o conteúdo de `conduta/backend/src/routes/usage.js`:

```js
const express = require('express');
const plans = require('../config/plans');
const { getMonthlyUsed, getBonusCredits } = require('../middleware/usageCheck');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const plan = req.userPlan;
    const planConfig = plans[plan] || plans.free;
    const planLimit = planConfig.analysesPerMonth;

    const [used, bonusCredits] = await Promise.all([
      getMonthlyUsed(req.userId),
      getBonusCredits(req.userId),
    ]);

    const effectiveLimit = planLimit === Infinity ? null : planLimit + bonusCredits;

    res.json({ used, limit: effectiveLimit, plan, bonus_credits: bonusCredits });
  } catch (err) {
    console.error('[usage] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao buscar uso.' });
  }
});

module.exports = router;
```

- [ ] **Step 5: Rodar testes e verificar aprovação**

```bash
cd conduta/backend && npx jest src/__tests__/usage.test.js --no-coverage 2>&1 | tail -20
```

Esperado: todos passam.

- [ ] **Step 6: Commit**

```bash
git add conduta/backend/src/middleware/usageCheck.js conduta/backend/src/routes/usage.js conduta/backend/src/__tests__/usage.test.js
git commit -m "feat: usageCheck e usage route incluem bonus_credits no limite efetivo"
```

---

## Task 3: Backend — auth.js: PATCH /auth/me/coachmarks + campos no login/signup

**Files:**
- Modify: `conduta/backend/src/routes/auth.js`
- Modify: `conduta/backend/src/__tests__/auth.test.js`

- [ ] **Step 1: Escrever testes que falham**

Adicionar ao final de `conduta/backend/src/__tests__/auth.test.js`:

```js
describe('POST /auth/login — campos coachmarks', () => {
  it('retorna coachmarks_welcome_seen e coachmarks_session_seen no user', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@conduta.dev', senha: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('coachmarks_welcome_seen', false);
    expect(res.body.user).toHaveProperty('coachmarks_session_seen', false);
  });
});

describe('PATCH /auth/me/coachmarks', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@conduta.dev', senha: 'senha123' });
    token = res.body.token;
  });

  it('marca coachmarks_welcome_seen como true', async () => {
    const res = await request(app)
      .patch('/auth/me/coachmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'welcome' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const db = await pool.query(
      'SELECT coachmarks_welcome_seen FROM users WHERE email = $1',
      ['test@conduta.dev']
    );
    expect(db.rows[0].coachmarks_welcome_seen).toBe(true);
  });

  it('marca coachmarks_session_seen como true', async () => {
    const res = await request(app)
      .patch('/auth/me/coachmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'session' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const db = await pool.query(
      'SELECT coachmarks_session_seen FROM users WHERE email = $1',
      ['test@conduta.dev']
    );
    expect(db.rows[0].coachmarks_session_seen).toBe(true);
  });

  it('retorna 400 com type inválido', async () => {
    const res = await request(app)
      .patch('/auth/me/coachmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'invalido' });

    expect(res.status).toBe(400);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .patch('/auth/me/coachmarks')
      .send({ type: 'welcome' });

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Rodar e verificar que falha**

```bash
cd conduta/backend && npx jest src/__tests__/auth.test.js --no-coverage 2>&1 | tail -30
```

Esperado: falha nos novos testes.

- [ ] **Step 3: Atualizar auth.js**

Adicionar `const authMiddleware = require('../middleware/auth');` no topo de `auth.js` (após os outros requires).

Atualizar a query de login (linha 22) para incluir os campos:

```js
// substituir:
'SELECT id, email, nome, senha_hash, role, plan FROM users WHERE email = $1'
// por:
'SELECT id, email, nome, senha_hash, role, plan, coachmarks_welcome_seen, coachmarks_session_seen FROM users WHERE email = $1'
```

Atualizar o objeto `user` retornado no login (linha 60):

```js
res.json({
  token,
  user: {
    id: user.id,
    email: user.email,
    nome: user.nome,
    role: user.role,
    plan: user.plan,
    coachmarks_welcome_seen: user.coachmarks_welcome_seen,
    coachmarks_session_seen: user.coachmarks_session_seen,
  },
});
```

Atualizar a query de signup (linha 116) para incluir os campos no RETURNING:

```js
// substituir:
'RETURNING id, email, nome, role, plan'
// por:
'RETURNING id, email, nome, role, plan, coachmarks_welcome_seen, coachmarks_session_seen'
```

Adicionar a nova rota ao final do router (antes de `module.exports`):

```js
router.patch('/me/coachmarks', authMiddleware, async (req, res) => {
  const { type } = req.body;

  if (!['welcome', 'session'].includes(type)) {
    return res.status(400).json({ error: 'type deve ser "welcome" ou "session".' });
  }

  const column = type === 'welcome' ? 'coachmarks_welcome_seen' : 'coachmarks_session_seen';

  try {
    await pool.query(
      `UPDATE users SET ${column} = TRUE WHERE id = $1`,
      [req.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[AUTH] coachmarks update error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

- [ ] **Step 4: Rodar testes e verificar aprovação**

```bash
cd conduta/backend && npx jest src/__tests__/auth.test.js --no-coverage 2>&1 | tail -30
```

Esperado: todos passam.

- [ ] **Step 5: Commit**

```bash
git add conduta/backend/src/routes/auth.js conduta/backend/src/__tests__/auth.test.js
git commit -m "feat: PATCH /auth/me/coachmarks; login e signup retornam campos coachmarks"
```

---

## Task 4: Backend — feedback.js: status pending_validation

**Files:**
- Modify: `conduta/backend/src/routes/feedback.js`

- [ ] **Step 1: Alterar status da Correcao de 'active' para 'pending_validation'**

Em `conduta/backend/src/routes/feedback.js`, dentro da função `applyKnowledgeFeedback`, localizar o bloco `CREATE (c:Correcao {...})` e alterar:

```js
// substituir a propriedade status no CREATE:
// DE:
//   status: 'active',
// PARA:
             status: 'pending_validation',
```

O bloco completo do CREATE deve ficar assim:

```js
await session.run(
  `CREATE (c:Correcao {
     sessionId: $sessionId,
     nota: $nota,
     keywords: $keywords,
     status: 'pending_validation',
     createdAt: $now
   })`,
  { sessionId, nota: notaFinal, keywords, now: new Date().toISOString() }
);
console.log(`[feedback] Correcao pendente criada para session ${sessionId}: "${notaFinal.slice(0, 60)}..."`);
```

- [ ] **Step 2: Verificar manualmente que a mudança está correta**

```bash
grep -n "pending_validation\|status:" conduta/backend/src/routes/feedback.js
```

Esperado: ver `status: 'pending_validation'` e nenhum `status: 'active'` no bloco CREATE.

- [ ] **Step 3: Commit**

```bash
git add conduta/backend/src/routes/feedback.js
git commit -m "feat: Correcao criada com status pending_validation (requer validação admin)"
```

---

## Task 5: Backend — admin-feedback.js: rotas validate e reject

**Files:**
- Modify: `conduta/backend/src/routes/admin-feedback.js`

- [ ] **Step 1: Atualizar GET /admin/feedbacks para ordenar pending_validation primeiro**

Substituir a query Cypher do GET:

```js
// DE:
`MATCH (c:Correcao)
 RETURN elementId(c) AS nodeId,
        c.nota       AS nota,
        c.keywords   AS keywords,
        c.status     AS status,
        c.sessionId  AS sessionId,
        c.createdAt  AS createdAt
 ORDER BY c.createdAt DESC
 LIMIT 100`

// PARA:
`MATCH (c:Correcao)
 RETURN elementId(c) AS nodeId,
        c.nota       AS nota,
        c.keywords   AS keywords,
        c.status     AS status,
        c.sessionId  AS sessionId,
        c.createdAt  AS createdAt
 ORDER BY
   CASE c.status WHEN 'pending_validation' THEN 0 ELSE 1 END ASC,
   c.createdAt DESC
 LIMIT 100`
```

- [ ] **Step 2: Adicionar rota PUT /:nodeId/validate**

Adicionar antes de `module.exports` em `conduta/backend/src/routes/admin-feedback.js`:

```js
// PUT /admin/feedbacks/:nodeId/validate — aprova Correcao e credita +2 análises ao usuário
router.put('/:nodeId/validate', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j indisponível.' });
  const { nodeId } = req.params;
  const neo4jSession = driver.session();
  try {
    // Ativa Correcao no grafo
    const neo4jResult = await neo4jSession.run(
      `MATCH (c:Correcao)
       WHERE elementId(c) = $nodeId AND c.status = 'pending_validation'
       SET c.status = 'active', c.validatedAt = $now
       RETURN c.sessionId AS sessionId`,
      { nodeId, now: new Date().toISOString() }
    );

    if (neo4jResult.records.length === 0) {
      return res.status(404).json({ error: 'Correção não encontrada ou não está pendente.' });
    }

    const sessionId = neo4jResult.records[0].get('sessionId');

    // Credita +2 ao dono da sessão
    const pgResult = await pool.query(
      `UPDATE users SET bonus_credits = bonus_credits + 2
       WHERE id = (SELECT user_id FROM sessions WHERE id = $1)
       RETURNING id, bonus_credits`,
      [sessionId]
    );

    const creditsGranted = pgResult.rows.length > 0 ? 2 : 0;
    res.json({ ok: true, creditsGranted });
  } catch (err) {
    console.error('[admin-feedback] validate error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await neo4jSession.close();
  }
});
```

- [ ] **Step 3: Adicionar rota PUT /:nodeId/reject**

Adicionar após a rota de validate, antes de `module.exports`:

```js
// PUT /admin/feedbacks/:nodeId/reject — rejeita Correcao (sem crédito)
router.put('/:nodeId/reject', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j indisponível.' });
  const { nodeId } = req.params;
  const neo4jSession = driver.session();
  try {
    const result = await neo4jSession.run(
      `MATCH (c:Correcao)
       WHERE elementId(c) = $nodeId AND c.status = 'pending_validation'
       SET c.status = 'inactive', c.rejectedAt = $now
       RETURN elementId(c) AS nodeId`,
      { nodeId, now: new Date().toISOString() }
    );
    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Correção não encontrada ou não está pendente.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin-feedback] reject error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await neo4jSession.close();
  }
});
```

- [ ] **Step 4: Adicionar import do pool no topo do arquivo**

O arquivo `admin-feedback.js` não importa `pool`. Adicionar após os requires existentes:

```js
const pool = require('../db/pg');
```

- [ ] **Step 5: Verificar estrutura do arquivo**

```bash
grep -n "router\.\|require\|module.exports" conduta/backend/src/routes/admin-feedback.js
```

Esperado: ver GET, DELETE, PUT validate, PUT reject e module.exports.

- [ ] **Step 6: Commit**

```bash
git add conduta/backend/src/routes/admin-feedback.js
git commit -m "feat: rotas PUT validate/reject em admin-feedback; credita +2 ao validar"
```

---

## Task 6: Backend — admin.js: rota grant-credits

**Files:**
- Modify: `conduta/backend/src/routes/admin.js`

- [ ] **Step 1: Adicionar rota POST /admin/users/:id/grant-credits**

Adicionar antes de `module.exports` em `conduta/backend/src/routes/admin.js`:

```js
router.post('/users/:id/grant-credits', adminMiddleware, async (req, res) => {
  const { amount } = req.body;

  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    return res.status(400).json({ error: 'amount deve ser um inteiro entre 1 e 100.' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET bonus_credits = bonus_credits + $1
       WHERE id = $2 AND role != 'admin'
       RETURNING id, bonus_credits`,
      [amount, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({ ok: true, bonusCredits: result.rows[0].bonus_credits });
  } catch (err) {
    console.error('[admin] grant-credits:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

- [ ] **Step 2: Verificar**

```bash
grep -n "grant-credits" conduta/backend/src/routes/admin.js
```

Esperado: a rota aparece.

- [ ] **Step 3: Commit**

```bash
git add conduta/backend/src/routes/admin.js
git commit -m "feat: POST /admin/users/:id/grant-credits para creditar análises manualmente"
```

---

## Task 7: Frontend — api.js: novas funções

**Files:**
- Modify: `conduta/frontend/src/services/api.js`

- [ ] **Step 1: Adicionar função markCoachmarks**

Adicionar após a função `getUsage` em `api.js`:

```js
export async function markCoachmarks(type) {
  const res = await fetch(`${BASE_URL}/auth/me/coachmarks`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ type }),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao marcar coachmark.');
  return res.json();
}
```

- [ ] **Step 2: Adicionar funções de admin feedback (validate/reject)**

Adicionar após `deactivateAdminFeedback`:

```js
export async function validateAdminFeedback(nodeId) {
  const res = await fetch(`${BASE_URL}/admin/feedbacks/${encodeURIComponent(nodeId)}/validate`, {
    method: 'PUT',
    headers: { ...authHeaders() },
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao validar correção.');
  return res.json();
}

export async function rejectAdminFeedback(nodeId) {
  const res = await fetch(`${BASE_URL}/admin/feedbacks/${encodeURIComponent(nodeId)}/reject`, {
    method: 'PUT',
    headers: { ...authHeaders() },
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao rejeitar correção.');
  return res.json();
}
```

- [ ] **Step 3: Adicionar função grantUserCredits**

Adicionar após `updateUserStatus`:

```js
export async function grantUserCredits(id, amount) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}/grant-credits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ amount }),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao conceder créditos.');
  }
  return res.json();
}
```

- [ ] **Step 4: Commit**

```bash
git add conduta/frontend/src/services/api.js
git commit -m "feat: markCoachmarks, validateAdminFeedback, rejectAdminFeedback, grantUserCredits em api.js"
```

---

## Task 8: Frontend — Coachmark.jsx + Coachmark.module.scss

**Files:**
- Create: `conduta/frontend/src/components/Coachmark.jsx`
- Create: `conduta/frontend/src/components/Coachmark.module.scss`

O componente usa `data-coachmark` attributes no DOM para localizar cada elemento alvo. O spotlight é posicionado via `getBoundingClientRect` e atualizado ao redimensionar a janela.

- [ ] **Step 1: Criar Coachmark.module.scss**

```scss
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  pointer-events: none;
}

.spotlight {
  position: fixed;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
  z-index: 9001;
  pointer-events: none;
  transition: all 0.25s ease;
}

.tooltip {
  position: fixed;
  z-index: 9002;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 14px 18px;
  max-width: 300px;
  min-width: 220px;
  pointer-events: all;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.tooltipTitle {
  font-size: 0.92rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 6px;
}

.tooltipText {
  font-size: 0.82rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0 0 14px;
}

.tooltipActions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.stepIndicator {
  font-size: 0.75rem;
  color: #475569;
}

.btnSkip {
  background: none;
  border: none;
  color: #475569;
  font-size: 0.78rem;
  cursor: pointer;
  padding: 4px 0;

  &:hover { color: #94a3b8; }
}

.btnNext {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;

  &:hover { background: #4f46e5; }
}
```

- [ ] **Step 2: Criar Coachmark.jsx**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { markCoachmarks } from '../services/api';
import styles from './Coachmark.module.scss';

const PADDING = 8;

export default function Coachmark({ type, steps, onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);

  const currentStep = steps[stepIndex];

  const updateRect = useCallback(() => {
    const el = document.querySelector(`[data-coachmark="${currentStep.target}"]`);
    if (el) setRect(el.getBoundingClientRect());
  }, [currentStep.target]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  async function handleDone() {
    try { await markCoachmarks(type); } catch {}
    onDone();
  }

  function handleNext() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      handleDone();
    }
  }

  if (!rect) return null;

  const spotlightStyle = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };

  // Posiciona tooltip abaixo do spotlight; se não couber, posiciona acima
  const viewportHeight = window.innerHeight;
  const tooltipTop = rect.bottom + PADDING + 12;
  const fitsBelow = tooltipTop + 160 < viewportHeight;
  const tooltipStyle = fitsBelow
    ? { top: tooltipTop, left: Math.max(8, rect.left) }
    : { bottom: viewportHeight - rect.top + PADDING + 12, left: Math.max(8, rect.left) };

  return (
    <>
      <div className={styles.overlay} />
      <div className={styles.spotlight} style={spotlightStyle} />
      <div className={styles.tooltip} style={tooltipStyle}>
        <p className={styles.tooltipTitle}>{currentStep.title}</p>
        <p className={styles.tooltipText}>{currentStep.text}</p>
        <div className={styles.tooltipActions}>
          <span className={styles.stepIndicator}>{stepIndex + 1} / {steps.length}</span>
          <button className={styles.btnSkip} onClick={handleDone}>Pular</button>
          <button className={styles.btnNext} onClick={handleNext}>
            {stepIndex < steps.length - 1 ? 'Próximo →' : 'Concluir'}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add conduta/frontend/src/components/Coachmark.jsx conduta/frontend/src/components/Coachmark.module.scss
git commit -m "feat: componente Coachmark com spotlight e tour passo a passo"
```

---

## Task 9: Frontend — Sidebar.jsx: callback onNewSession

**Files:**
- Modify: `conduta/frontend/src/components/Sidebar.jsx`

- [ ] **Step 1: Adicionar prop onNewSession e usá-la em handleNewCase**

Alterar a assinatura do componente:

```jsx
// DE:
export default function Sidebar({ activeSessionId, onSelectSession, onSessionDeleted, isOpen, onClose }) {

// PARA:
export default function Sidebar({ activeSessionId, onSelectSession, onNewSession, onSessionDeleted, isOpen, onClose }) {
```

Alterar `handleNewCase` para chamar `onNewSession` em vez de `onSelectSession`:

```jsx
async function handleNewCase() {
  try {
    const session = await createSession('Novo caso');
    setSessions((prev) => [session, ...prev]);
    onNewSession(session.id);
  } catch (err) {
    console.error(err);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add conduta/frontend/src/components/Sidebar.jsx
git commit -m "feat: Sidebar expõe onNewSession para distinguir criação de seleção de sessão"
```

---

## Task 10: Frontend — Dashboard.jsx: integração dos coachmarks

**Files:**
- Modify: `conduta/frontend/src/pages/Dashboard.jsx`

- [ ] **Step 1: Adicionar data-coachmark attributes nos elementos alvo**

Em `Dashboard.jsx`, localizar o `<Sidebar ...>` e o `<main>` e adicionar os atributos:

No componente `Sidebar` (já existente no JSX do Dashboard), adicionar `data-coachmark` na tag `<aside>` dentro de `Sidebar.jsx`:

Em `conduta/frontend/src/components/Sidebar.jsx`, alterar:
```jsx
// DE:
<aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>

// PARA:
<aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} data-coachmark="sidebar">
```

Em `conduta/frontend/src/components/CaseInput.jsx`, alterar:
```jsx
// DE:
<div className={styles.container}>

// PARA:
<div className={styles.container} data-coachmark="case-input">
```

Em `conduta/frontend/src/components/AnalysisResult.jsx`, alterar:
```jsx
// DE (a div principal do return):
<div className={styles.container}>

// PARA:
<div className={styles.container} data-coachmark="results">
```

Em `conduta/frontend/src/pages/Dashboard.jsx`, dentro do componente `EntitiesPanel`, alterar:
```jsx
// DE:
<div className={styles.entitiesPanel}>

// PARA:
<div className={styles.entitiesPanel} data-coachmark="entities">
```

- [ ] **Step 2: Atualizar Dashboard.jsx para gerenciar os coachmarks**

Adicionar import do Coachmark no topo:
```jsx
import Coachmark from '../components/Coachmark';
```

Adicionar estado para os tours:
```jsx
const [showWelcomeTour, setShowWelcomeTour] = useState(false);
const [showSessionTour, setShowSessionTour] = useState(false);
```

Adicionar efeito para Tour 1 (após a declaração dos estados existentes):
```jsx
useEffect(() => {
  if (user && user.coachmarks_welcome_seen === false) {
    setShowWelcomeTour(true);
  }
}, [user]);
```

Substituir o callback `onSelectSession` da Sidebar e adicionar `handleNewSession`:

```jsx
async function handleNewSession(id) {
  await handleSelectSession(id);
  if (user && user.coachmarks_session_seen === false) {
    setShowSessionTour(true);
  }
  setSidebarOpen(false);
}
```

Alterar a prop do `<Sidebar>`:
```jsx
// DE:
onSelectSession={(id) => {
  handleSelectSession(id);
  setSidebarOpen(false);
}}

// PARA:
onSelectSession={(id) => {
  handleSelectSession(id);
  setSidebarOpen(false);
}}
onNewSession={handleNewSession}
```

Adicionar os dois tours ao JSX (dentro do `return`, após `{sidebarOpen && ...}` e antes de `<main>`):

```jsx
{showWelcomeTour && (
  <Coachmark
    type="welcome"
    steps={[
      {
        target: 'sidebar',
        title: 'Painel lateral',
        text: 'Crie um novo caso clínico pelo botão "+ Novo caso" ou retome um anterior.',
      },
    ]}
    onDone={() => setShowWelcomeTour(false)}
  />
)}

{showSessionTour && (
  <Coachmark
    type="session"
    steps={[
      {
        target: 'case-input',
        title: 'Campo do caso clínico',
        text: 'Descreva o caso como em um prontuário — idade, queixa, sinais vitais, evolução.',
      },
      {
        target: 'results',
        title: 'Resultado da análise',
        text: 'Após cada resposta, avalie com 👍 ou 👎. Feedbacks negativos corretos e validados pelo time rendem +2 análises extras.',
      },
      {
        target: 'entities',
        title: 'Entidades extraídas',
        text: 'Clique para ver diagnósticos e medicamentos detectados automaticamente no caso.',
      },
    ]}
    onDone={() => setShowSessionTour(false)}
  />
)}
```

- [ ] **Step 3: Verificar que não há erros de lint**

```bash
cd conduta/frontend && npm run build 2>&1 | tail -20
```

Esperado: build bem-sucedido sem erros.

- [ ] **Step 4: Commit**

```bash
git add conduta/frontend/src/pages/Dashboard.jsx conduta/frontend/src/components/Sidebar.jsx conduta/frontend/src/components/CaseInput.jsx conduta/frontend/src/components/AnalysisResult.jsx
git commit -m "feat: tours de onboarding no Dashboard; data-coachmark attributes nos elementos alvo"
```

---

## Task 11: Frontend — AdminKnowledge.jsx: validar/rejeitar correções + grant-credits

**Files:**
- Modify: `conduta/frontend/src/pages/AdminKnowledge.jsx`

- [ ] **Step 1: Adicionar imports das novas funções**

No topo de `AdminKnowledge.jsx`, adicionar `validateAdminFeedback`, `rejectAdminFeedback` e `grantUserCredits` ao import existente:

```jsx
// DE:
import { getPendingKnowledge, approveKnowledge, rejectKnowledge, listDocuments, uploadDocument, getFeedbackStats, getAdminFeedbacks, deactivateAdminFeedback, getAdminUsers, updateUserPlan, updateUserStatus } from '../services/api';

// PARA:
import { getPendingKnowledge, approveKnowledge, rejectKnowledge, listDocuments, uploadDocument, getFeedbackStats, getAdminFeedbacks, deactivateAdminFeedback, validateAdminFeedback, rejectAdminFeedback, getAdminUsers, updateUserPlan, updateUserStatus, grantUserCredits } from '../services/api';
```

- [ ] **Step 2: Adicionar handlers handleValidate e handleReject no componente AdminKnowledge**

Adicionar após `handleDeactivate`:

```jsx
async function handleValidate(nodeId) {
  try {
    const result = await validateAdminFeedback(nodeId);
    setCorrections((prev) =>
      prev.map((c) => (c.nodeId === nodeId ? { ...c, status: 'active' } : c))
    );
    if (result.creditsGranted > 0) {
      alert(`Correção validada. +${result.creditsGranted} análises creditadas ao usuário.`);
    }
  } catch (err) {
    alert(err.message);
  }
}

async function handleRejectCorrection(nodeId) {
  if (!confirm('Rejeitar esta correção?')) return;
  try {
    await rejectAdminFeedback(nodeId);
    setCorrections((prev) =>
      prev.map((c) => (c.nodeId === nodeId ? { ...c, status: 'inactive' } : c))
    );
  } catch (err) {
    alert(err.message);
  }
}
```

- [ ] **Step 3: Atualizar a tabela de Correções Registradas no JSX**

Localizar o bloco da tabela de correções. Substituir a coluna de Ação:

```jsx
// DE:
<td>
  {c.status === 'active' && (
    <button className={styles.rejectBtn} onClick={() => handleDeactivate(c.nodeId)}>
      Desativar
    </button>
  )}
</td>

// PARA:
<td>
  {c.status === 'pending_validation' && (
    <>
      <button className={styles.approveBtn} onClick={() => handleValidate(c.nodeId)}>
        Validar ✓
      </button>
      <button className={styles.rejectBtn} onClick={() => handleRejectCorrection(c.nodeId)}>
        Rejeitar ✗
      </button>
    </>
  )}
  {c.status === 'active' && (
    <button className={styles.rejectBtn} onClick={() => handleDeactivate(c.nodeId)}>
      Desativar
    </button>
  )}
</td>
```

Atualizar o badge de status para incluir `pending_validation`:

```jsx
// DE:
<span className={c.status === 'active' ? styles.badgeActive : styles.badgeInactive}>
  {c.status}
</span>

// PARA:
<span className={
  c.status === 'active' ? styles.badgeActive :
  c.status === 'pending_validation' ? styles.badgePending :
  styles.badgeInactive
}>
  {c.status === 'pending_validation' ? 'pendente' : c.status}
</span>
```

- [ ] **Step 4: Adicionar .badgePending ao AdminKnowledge.module.scss**

Verificar o arquivo de estilos:
```bash
ls conduta/frontend/src/pages/AdminKnowledge.module.scss
```

Adicionar no final do arquivo SCSS:

```scss
.badgePending {
  background: rgba(234, 179, 8, 0.15);
  color: #ca8a04;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 5: Adicionar grant-credits na UsersPanel**

Dentro da função `UsersPanel`, adicionar estado para o input de créditos:

```jsx
const [creditInputId, setCreditInputId] = useState(null);
const [creditAmount, setCreditAmount] = useState('');
```

Adicionar handler `handleGrantCredits`:

```jsx
async function handleGrantCredits(u) {
  const amount = parseInt(creditAmount, 10);
  if (!amount || amount < 1 || amount > 100) {
    setRowMessage(u.id, 'error', 'Valor inválido (1–100).');
    return;
  }
  setActionLoading((prev) => ({ ...prev, [u.id]: 'credits' }));
  try {
    const result = await grantUserCredits(u.id, amount);
    setRowMessage(u.id, 'success', `+${amount} créditos. Total: ${result.bonusCredits}.`);
    setCreditInputId(null);
    setCreditAmount('');
  } catch (err) {
    setRowMessage(u.id, 'error', err.message);
  } finally {
    setActionLoading((prev) => ({ ...prev, [u.id]: null }));
  }
}
```

Na tabela de usuários, dentro da coluna de Ações, adicionar após o botão de status existente:

```jsx
{!isSelf && (
  creditInputId === u.id ? (
    <>
      <input
        type="number"
        min="1"
        max="100"
        value={creditAmount}
        onChange={(e) => setCreditAmount(e.target.value)}
        style={{ width: 50, marginRight: 4, padding: '2px 4px', fontSize: '0.78rem' }}
        autoFocus
      />
      <button
        className={styles.approveBtn}
        onClick={() => handleGrantCredits(u)}
        disabled={!!busy}
      >
        {busy === 'credits' ? '...' : 'OK'}
      </button>
      <button
        className={styles.rejectBtn}
        onClick={() => { setCreditInputId(null); setCreditAmount(''); }}
      >
        ✕
      </button>
    </>
  ) : (
    <button
      className={styles.planBtn}
      onClick={() => { setCreditInputId(u.id); setCreditAmount(''); }}
      disabled={!!busy}
    >
      + Créditos
    </button>
  )
)}
```

- [ ] **Step 6: Build para verificar sem erros**

```bash
cd conduta/frontend && npm run build 2>&1 | tail -20
```

Esperado: build sem erros.

- [ ] **Step 7: Commit**

```bash
git add conduta/frontend/src/pages/AdminKnowledge.jsx conduta/frontend/src/pages/AdminKnowledge.module.scss
git commit -m "feat: admin — validar/rejeitar correções pendentes e conceder créditos manualmente"
```

---

## Self-Review

**Spec coverage:**
- ✅ Task 1: Migration com 3 colunas
- ✅ Tasks 2–3: bonus_credits no usageCheck e usage
- ✅ Task 3: PATCH /auth/me/coachmarks + campos no login/signup
- ✅ Task 4: Correcao com status pending_validation
- ✅ Task 5: validate/reject em admin-feedback; credita +2
- ✅ Task 6: grant-credits manual
- ✅ Tasks 7–10: Coachmark component + triggers no Dashboard
- ✅ Task 11: Admin UI com validação e grant-credits
- ✅ Reset de coachmarks: documentado no spec como operação direta no banco

**Verificações de consistência:**
- `markCoachmarks` declarado em Task 7 e usado em Task 8 — OK
- `validateAdminFeedback`/`rejectAdminFeedback`/`grantUserCredits` declarados em Task 7, usados em Task 11 — OK
- `onNewSession` adicionado em Task 9 (Sidebar) e consumido em Task 10 (Dashboard) — OK
- `data-coachmark` attributes adicionados em Task 10 e lidos pelo Coachmark via `querySelector` — OK
- `getBonusCredits` exportado em Task 2 e importado em usage.js na mesma Task — OK
- `badgePending` adicionado ao SCSS (Task 11 Step 4) antes de ser referenciado no JSX (Task 11 Step 3) — OK

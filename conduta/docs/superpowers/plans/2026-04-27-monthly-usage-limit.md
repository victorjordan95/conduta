# Monthly Usage Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limitar usuários Free a 15 análises/mês, exibir contador no Dashboard e bloquear com CTA de upgrade ao esgotar.

**Architecture:** Coluna `plan` na tabela `users` (free/pro). Middleware `usageCheck` conta mensagens `role='user'` do mês via JOIN sessions→messages antes de cada /analyze. Endpoint `GET /usage` serve o contador pro frontend. Dashboard exibe `UsageCounter` para Free users e bloqueia `CaseInput` ao atingir limite.

**Tech Stack:** Node.js/Express, PostgreSQL, React, SCSS Modules

---

## File Map

**Criar:**
- `backend/src/db/migrations/008_user_plan.sql`
- `backend/src/config/plans.js`
- `backend/src/middleware/usageCheck.js`
- `backend/src/routes/usage.js`
- `backend/src/__tests__/usage.test.js`
- `frontend/src/components/UsageCounter.jsx`
- `frontend/src/components/UsageCounter.module.scss`

**Modificar:**
- `backend/src/middleware/auth.js` — adicionar `req.userPlan`
- `backend/src/routes/auth.js` — incluir `plan` nas respostas de login/signup
- `backend/src/routes/admin.js` — adicionar `PUT /users/:id/plan`
- `backend/src/app.js` — montar `/usage`, adicionar `usageCheck` no pipeline de `/analyze`
- `frontend/src/services/api.js` — adicionar `getUsage()`, tratar 429 em `analyzeCase`
- `frontend/src/components/CaseInput.jsx` — receber prop `usage`, mostrar banner de upgrade
- `frontend/src/components/CaseInput.module.scss` — estilos do banner
- `frontend/src/pages/Dashboard.jsx` — buscar usage, passar para CaseInput, montar UsageCounter

---

### Task 1: Migration e plans config

**Files:**
- Create: `backend/src/db/migrations/008_user_plan.sql`
- Create: `backend/src/config/plans.js`

- [ ] **Step 1: Criar migration**

`backend/src/db/migrations/008_user_plan.sql`:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(10) NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro'));

CREATE INDEX IF NOT EXISTS idx_messages_session_created_user
  ON messages(session_id, created_at)
  WHERE role = 'user';
```

- [ ] **Step 2: Criar config de planos**

`backend/src/config/plans.js`:
```js
module.exports = {
  free: { analysesPerMonth: 15 },
  pro:  { analysesPerMonth: Infinity },
};
```

- [ ] **Step 3: Rodar a migration**

```bash
cd conduta/backend && npm run migrate
```

Expected: `Migration executada: 008_user_plan.sql` nos logs, sem erros.

- [ ] **Step 4: Commit**

```bash
git add conduta/backend/src/db/migrations/008_user_plan.sql conduta/backend/src/config/plans.js
git commit -m "feat: migration coluna plan e config de limites por plano"
```

---

### Task 2: Expor req.userPlan no authMiddleware

**Files:**
- Modify: `backend/src/middleware/auth.js`

- [ ] **Step 1: Alterar query para incluir plan**

Em `backend/src/middleware/auth.js`, substituir:
```js
const result = await pool.query('SELECT session_version FROM users WHERE id = $1', [payload.sub]);
if (!result.rows.length || result.rows[0].session_version !== payload.sv) {
  return res.status(401).json({
    error: 'Sua sessão foi encerrada pois outro acesso foi iniciado.',
    code: 'SESSION_KICKED',
  });
}

req.userId = payload.sub;
req.userRole = payload.role || 'user';
```

por:
```js
const result = await pool.query('SELECT session_version, plan FROM users WHERE id = $1', [payload.sub]);
if (!result.rows.length || result.rows[0].session_version !== payload.sv) {
  return res.status(401).json({
    error: 'Sua sessão foi encerrada pois outro acesso foi iniciado.',
    code: 'SESSION_KICKED',
  });
}

req.userId = payload.sub;
req.userRole = payload.role || 'user';
req.userPlan = result.rows[0].plan || 'free';
```

- [ ] **Step 2: Commit**

```bash
git add conduta/backend/src/middleware/auth.js
git commit -m "feat: expor req.userPlan no authMiddleware"
```

---

### Task 3: usageCheck middleware com getMonthlyUsed

**Files:**
- Create: `backend/src/middleware/usageCheck.js`

- [ ] **Step 1: Criar middleware**

`backend/src/middleware/usageCheck.js`:
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

async function usageCheck(req, res, next) {
  if (req.userRole === 'admin' || req.userPlan === 'pro') return next();

  try {
    const limit = plans.free.analysesPerMonth;
    const used = await getMonthlyUsed(req.userId);

    if (used >= limit) {
      return res.status(429).json({
        error: 'Você atingiu seu limite de 15 análises este mês.',
        used,
        limit,
        plan: req.userPlan,
      });
    }

    next();
  } catch (err) {
    console.error('[usageCheck] Erro:', err.message);
    next();
  }
}

module.exports = { usageCheck, getMonthlyUsed };
```

- [ ] **Step 2: Commit**

```bash
git add conduta/backend/src/middleware/usageCheck.js
git commit -m "feat: middleware usageCheck com getMonthlyUsed"
```

---

### Task 4: GET /usage route

**Files:**
- Create: `backend/src/routes/usage.js`

- [ ] **Step 1: Criar rota**

`backend/src/routes/usage.js`:
```js
const express = require('express');
const plans = require('../config/plans');
const { getMonthlyUsed } = require('../middleware/usageCheck');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const plan = req.userPlan;
    const planConfig = plans[plan] || plans.free;
    const limit = planConfig.analysesPerMonth;
    const used = await getMonthlyUsed(req.userId);

    res.json({ used, limit: limit === Infinity ? null : limit, plan });
  } catch (err) {
    console.error('[usage] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao buscar uso.' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add conduta/backend/src/routes/usage.js
git commit -m "feat: rota GET /usage"
```

---

### Task 5: Escrever testes de integração (falham agora)

**Files:**
- Create: `backend/src/__tests__/usage.test.js`

- [ ] **Step 1: Criar arquivo de testes**

`backend/src/__tests__/usage.test.js`:
```js
require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const app = require('../app');

const TEST_EMAIL = 'usage-test@conduta.dev';

let token, userId, sessionId;

beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  const hash = await bcrypt.hash('senha123', 10);
  await pool.query(
    `INSERT INTO users (email, nome, senha_hash, plan) VALUES ($1, $2, $3, 'free')`,
    [TEST_EMAIL, 'Dr. Uso', hash]
  );
  const login = await request(app)
    .post('/auth/login')
    .send({ email: TEST_EMAIL, senha: 'senha123' });
  token = login.body.token;
  userId = login.body.user.id;

  const sess = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Sessão Teste') RETURNING id`,
    [userId]
  );
  sessionId = sess.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await pool.end();
});

beforeEach(async () => {
  await pool.query('DELETE FROM messages WHERE session_id = $1', [sessionId]);
});

describe('GET /usage', () => {
  it('retorna used=0 para usuário sem análises no mês', async () => {
    const res = await request(app)
      .get('/usage')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ used: 0, limit: 15, plan: 'free' });
  });

  it('retorna used=2 após duas mensagens de usuário', async () => {
    await pool.query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', 'Caso 1'), ($1, 'user', 'Caso 2')`,
      [sessionId]
    );
    const res = await request(app)
      .get('/usage')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.used).toBe(2);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/usage');
    expect(res.status).toBe(401);
  });
});

describe('POST /analyze — limite mensal', () => {
  it('retorna 429 com used/limit quando Free user atingiu 15 análises', async () => {
    const values = Array.from({ length: 15 }, (_, i) => `($1, 'user', 'Caso ${i + 1}')`).join(', ');
    await pool.query(`INSERT INTO messages (session_id, role, content) VALUES ${values}`, [sessionId]);

    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ session_id: sessionId, content: 'Caso extra' });

    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({ used: 15, limit: 15, plan: 'free' });
  });
});
```

- [ ] **Step 2: Rodar testes e confirmar que falham**

```bash
cd conduta/backend && npm test -- --testPathPattern=usage
```

Expected: falha em `/usage` (rota não montada) e no teste de 429 (`usageCheck` não no pipeline).

- [ ] **Step 3: Commit**

```bash
git add conduta/backend/src/__tests__/usage.test.js
git commit -m "test: testes de integração para /usage e limite mensal"
```

---

### Task 6: Montar rotas e pipeline no app.js

**Files:**
- Modify: `backend/src/app.js`

- [ ] **Step 1: Atualizar app.js**

Em `backend/src/app.js`, adicionar os imports após os existentes:
```js
const { usageCheck } = require('./middleware/usageCheck');
const usageRoutes = require('./routes/usage');
```

Substituir:
```js
app.use('/analyze', authMiddleware, analyzeLimiter, analyzeRoutes);
```
por:
```js
app.use('/analyze', authMiddleware, usageCheck, analyzeLimiter, analyzeRoutes);
```

Adicionar antes de `app.use('/feedback', feedbackRoutes)`:
```js
app.use('/usage', authMiddleware, usageRoutes);
```

- [ ] **Step 2: Rodar testes e confirmar que passam**

```bash
cd conduta/backend && npm test -- --testPathPattern=usage
```

Expected: todos os 4 testes passam.

- [ ] **Step 3: Rodar suite completa para checar regressões**

```bash
cd conduta/backend && npm test
```

Expected: todos os testes passam.

- [ ] **Step 4: Commit**

```bash
git add conduta/backend/src/app.js
git commit -m "feat: montar /usage e usageCheck no pipeline de /analyze"
```

---

### Task 7: Incluir plan nas respostas de auth

**Files:**
- Modify: `backend/src/routes/auth.js`

- [ ] **Step 1: Atualizar query de login para retornar plan**

Em `backend/src/routes/auth.js`, substituir:
```js
'SELECT id, email, nome, senha_hash, role FROM users WHERE email = $1',
```
por:
```js
'SELECT id, email, nome, senha_hash, role, plan FROM users WHERE email = $1',
```

Substituir o objeto `user` na resposta do login:
```js
res.json({
  token,
  user: { id: user.id, email: user.email, nome: user.nome, role: user.role },
});
```
por:
```js
res.json({
  token,
  user: { id: user.id, email: user.email, nome: user.nome, role: user.role, plan: user.plan },
});
```

- [ ] **Step 2: Atualizar signup para retornar plan**

Substituir a query do signup:
```js
`INSERT INTO users (email, nome, senha_hash, role)
 VALUES ($1, $2, $3, 'user')
 RETURNING id, email, nome, role`,
```
por:
```js
`INSERT INTO users (email, nome, senha_hash, role)
 VALUES ($1, $2, $3, 'user')
 RETURNING id, email, nome, role, plan`,
```

- [ ] **Step 3: Rodar testes de auth para checar regressões**

```bash
cd conduta/backend && npm test -- --testPathPattern=auth
```

Expected: todos os testes passam.

- [ ] **Step 4: Commit**

```bash
git add conduta/backend/src/routes/auth.js
git commit -m "feat: incluir plan nas respostas de login e signup"
```

---

### Task 8: Endpoint PUT /admin/users/:id/plan

**Files:**
- Modify: `backend/src/routes/admin.js`

- [ ] **Step 1: Adicionar endpoint de upgrade de plano**

Em `backend/src/routes/admin.js`, adicionar antes de `module.exports = router`:
```js
router.put('/users/:id/plan', adminMiddleware, async (req, res) => {
  const { plan } = req.body;

  if (!['free', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Plano inválido. Use "free" ou "pro".' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET plan = $1 WHERE id = $2 RETURNING id, email, nome, role, plan',
      [plan, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar plano:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

- [ ] **Step 2: Rodar suite completa**

```bash
cd conduta/backend && npm test
```

Expected: todos os testes passam.

- [ ] **Step 3: Commit**

```bash
git add conduta/backend/src/routes/admin.js
git commit -m "feat: endpoint PUT /admin/users/:id/plan para upgrade de plano"
```

---

### Task 9: Frontend — api.js: getUsage e 429 em analyzeCase

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Adicionar getUsage**

Em `frontend/src/services/api.js`, adicionar antes do bloco `// ── Admin Knowledge`:
```js
export async function getUsage() {
  const res = await fetch(`${BASE_URL}/usage`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar uso.');
  return res.json();
}
```

- [ ] **Step 2: Tratar 429 em analyzeCase**

Em `frontend/src/services/api.js`, substituir em `analyzeCase`:
```js
await checkUnauthorized(res);
if (!res.ok) throw new Error('Erro ao processar análise.');
```
por:
```js
await checkUnauthorized(res);
if (res.status === 429) {
  const data = await res.json().catch(() => ({}));
  const err = new Error(data.error || 'Limite de análises atingido.');
  err.code = 'USAGE_LIMIT';
  err.usage = { used: data.used, limit: data.limit, plan: data.plan };
  throw err;
}
if (!res.ok) throw new Error('Erro ao processar análise.');
```

- [ ] **Step 3: Commit**

```bash
git add conduta/frontend/src/services/api.js
git commit -m "feat: getUsage e tratamento de 429 em analyzeCase"
```

---

### Task 10: Componente UsageCounter

**Files:**
- Create: `frontend/src/components/UsageCounter.jsx`
- Create: `frontend/src/components/UsageCounter.module.scss`

- [ ] **Step 1: Criar componente**

`frontend/src/components/UsageCounter.jsx`:
```jsx
import styles from './UsageCounter.module.scss';

export default function UsageCounter({ used, limit }) {
  if (limit === null) return null;

  const pct = Math.min((used / limit) * 100, 100);
  const danger = used >= limit - 2;

  return (
    <div className={styles.container}>
      <span className={styles.label}>
        {used} / {limit} análises este mês
      </span>
      <div className={styles.track}>
        <div
          className={`${styles.bar} ${danger ? styles.barDanger : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar estilos**

`frontend/src/components/UsageCounter.module.scss`:
```scss
@use '../styles/variables' as *;

.container {
  padding: 10px 16px;
  border-bottom: 1px solid $color-border;
  background: $color-surface;
}

.label {
  display: block;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  margin-bottom: 6px;
}

.track {
  height: 4px;
  background: $color-border;
  border-radius: 2px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: $color-accent;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.barDanger {
  background: $color-danger;
}
```

- [ ] **Step 3: Commit**

```bash
git add conduta/frontend/src/components/UsageCounter.jsx conduta/frontend/src/components/UsageCounter.module.scss
git commit -m "feat: componente UsageCounter com barra de progresso"
```

---

### Task 11: CaseInput — banner de upgrade e prop usage

**Files:**
- Modify: `frontend/src/components/CaseInput.jsx`
- Modify: `frontend/src/components/CaseInput.module.scss`

- [ ] **Step 1: Atualizar CaseInput.jsx**

Substituir o conteúdo completo de `frontend/src/components/CaseInput.jsx`:
```jsx
import { useState } from 'react';
import { analyzeCase } from '../services/api';
import styles from './CaseInput.module.scss';

export default function CaseInput({ sessionId, usage, onAnalysisStart, onChunk, onAnalysisDone, onUsageUpdate }) {
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const limitReached = usage && usage.limit !== null && usage.used >= usage.limit;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || analyzing || limitReached) return;

    setError('');
    setAnalyzing(true);

    try {
      onAnalysisStart(content.trim());
      await analyzeCase(sessionId, content.trim(), onChunk);
      setContent('');
    } catch (err) {
      if (err.code === 'USAGE_LIMIT' && err.usage) {
        onUsageUpdate(err.usage);
      } else {
        setError('Erro ao processar análise. Verifique a conexão e tente novamente.');
      }
    } finally {
      setAnalyzing(false);
      onAnalysisDone();
    }
  }

  return (
    <div className={styles.container}>
      {limitReached && (
        <div className={styles.limitBanner}>
          <span>Você atingiu seu limite de {usage.limit} análises este mês.</span>
          <a href="/#precos" className={styles.upgradeLink}>
            Assinar Pro — R$39,90/mês
          </a>
        </div>
      )}
      <div className={styles.label}>Caso clínico</div>
      <form onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Descreva o caso como escreveria num prontuário — idade, queixa principal, sinais vitais, tempo de evolução, comorbidades..."
          disabled={analyzing || limitReached}
        />
        <div className={styles.footer}>
          <span className={styles.hint}>
            {error ? (
              <span style={{ color: '#c0392b' }}>{error}</span>
            ) : analyzing ? (
              <span className={styles.progress}>Processando análise...</span>
            ) : (
              'Texto livre — descreva com os dados que você tem'
            )}
          </span>
          <button
            type="submit"
            className={styles.button}
            disabled={!content.trim() || analyzing || limitReached}
          >
            {analyzing ? 'Analisando...' : 'Analisar'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Adicionar estilos do banner em CaseInput.module.scss**

Ao final de `frontend/src/components/CaseInput.module.scss`, adicionar:
```scss
.limitBanner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 12px;
  background: #fff5f5;
  border: 1px solid #f5c6c6;
  border-radius: $border-radius;
  font-size: $font-size-sm;
  color: $color-danger;
}

.upgradeLink {
  flex-shrink: 0;
  font-weight: 600;
  color: $color-accent;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add conduta/frontend/src/components/CaseInput.jsx conduta/frontend/src/components/CaseInput.module.scss
git commit -m "feat: banner de upgrade e bloqueio de input ao atingir limite"
```

---

### Task 12: Dashboard — integrar UsageCounter e usage state

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`

- [ ] **Step 1: Atualizar Dashboard.jsx**

Substituir o conteúdo completo de `frontend/src/pages/Dashboard.jsx`:
```jsx
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CaseInput from '../components/CaseInput';
import AnalysisResult from '../components/AnalysisResult';
import UsageCounter from '../components/UsageCounter';
import { getSession, submitFeedback, getUsage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.scss';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    if (user?.plan === 'free') {
      getUsage().then(setUsage).catch(() => {});
    }
  }, [user]);

  async function refreshUsage() {
    if (user?.plan === 'free') {
      getUsage().then(setUsage).catch(() => {});
    }
  }

  async function handleSelectSession(id) {
    setActiveSessionId(id);
    setMessages([]);
    setStreaming(false);
    setLoadingHistory(true);
    try {
      const data = await getSession(id);
      setMessages(data.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, feedback: m.feedback })));
    } catch (err) {
      console.error('Erro ao carregar histórico:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          handleSelectSession(id);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <main className={styles.main}>
        <header className={styles.mobileHeader}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <span />
            <span />
            <span />
          </button>
          <span className={styles.mobileBrand}>Conduta</span>
        </header>

        {usage && <UsageCounter used={usage.used} limit={usage.limit} />}

        {!activeSessionId ? (
          <div className={styles.empty}>
            <p>Selecione ou inicie um caso</p>
            <span>Use o painel lateral para criar um novo caso ou retomar um anterior</span>
          </div>
        ) : (
          <>
            <AnalysisResult
              messages={messages}
              streaming={streaming}
              loading={loadingHistory}
              onFeedback={async (messageId, feedback) => {
                await submitFeedback(messageId, feedback);
                setMessages((prev) =>
                  prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
                );
              }}
            />
            <CaseInput
              sessionId={activeSessionId}
              usage={usage}
              onUsageUpdate={(updatedUsage) => setUsage(updatedUsage)}
              onAnalysisStart={(userContent) => {
                setMessages((prev) => [
                  ...prev,
                  { role: 'user', content: userContent },
                  { role: 'assistant', content: '', id: null },
                ]);
                setStreaming(true);
              }}
              onChunk={(chunk) => {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = { ...last, content: last.content + chunk };
                  return updated;
                });
              }}
              onAnalysisDone={() => {
                setStreaming(false);
                refreshUsage();
                getSession(activeSessionId)
                  .then((data) => {
                    const msgs = data.messages;
                    if (msgs.length > 0) {
                      const last = msgs[msgs.length - 1];
                      setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { ...updated[updated.length - 1], id: last.id };
                        return updated;
                      });
                    }
                  })
                  .catch(console.error);
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Rodar a aplicação e verificar o fluxo completo**

```bash
cd conduta && bash dev.sh
```

Abrir o browser e verificar:
- Usuário Free vê o contador "0 / 15 análises este mês" acima do conteúdo
- Após análises, contador atualiza
- Com 15 análises, barra fica vermelha, input desabilita e banner de upgrade aparece
- Usuário Pro não vê contador

- [ ] **Step 3: Commit final**

```bash
git add conduta/frontend/src/pages/Dashboard.jsx
git commit -m "feat: integrar UsageCounter e limite mensal no Dashboard"
```

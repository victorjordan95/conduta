# Bloco B — Experiência do Médico: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ao médico as funcionalidades de renomear/excluir sessões, buscar por título, exportar análise em PDF e visualizar diagnósticos/medicamentos extraídos por sessão.

**Architecture:** Backend recebe 4 novas rotas em `sessions.js` (PUT, DELETE, GET entities, GET pdf). Frontend: Sidebar ganha busca + menu kebab; Dashboard ganha header de sessão com botão PDF e painel colapsável de entidades. pdfkit move de devDependencies para dependencies.

**Tech Stack:** Node.js/Express, PostgreSQL (pg), Neo4j (neo4j-driver), pdfkit, React 18, SCSS Modules, Vitest

---

## Mapa de Arquivos

**Backend — modificar:**
- `backend/src/routes/sessions.js` — 4 novas rotas
- `backend/package.json` — pdfkit de devDependencies para dependencies

**Backend — criar:**
- `backend/src/__tests__/sessions-management.test.js`

**Frontend — modificar:**
- `frontend/src/services/api.js` — 3 novas funções + corrigir deleteSession
- `frontend/src/components/Sidebar.jsx` — busca + menu kebab
- `frontend/src/components/Sidebar.module.scss` — novos estilos
- `frontend/src/pages/Dashboard.jsx` — header de sessão, PDF, EntitiesPanel
- `frontend/src/pages/Dashboard.module.scss` — novos estilos

---

## Task 1: Backend — PUT /sessions/:id e DELETE /sessions/:id

**Files:**
- Create: `backend/src/__tests__/sessions-management.test.js`
- Modify: `backend/src/routes/sessions.js`

- [ ] **Step 1: Criar arquivo de testes com beforeAll/afterAll e testes de PUT e DELETE**

Criar `backend/src/__tests__/sessions-management.test.js` com o conteúdo abaixo:

```js
require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const app = require('../app');

const USER_EMAIL  = 'sessions-mgmt-test@conduta.dev';
const OTHER_EMAIL = 'sessions-mgmt-other@conduta.dev';

let userToken, userId, otherId, otherToken, sessionId, sessionWithSummaryId;

beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[USER_EMAIL, OTHER_EMAIL]]);

  const hash = await bcrypt.hash('senha123', 10);
  const userRow = await pool.query(
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, 'User Sessão', $2) RETURNING id`,
    [USER_EMAIL, hash]
  );
  userId = userRow.rows[0].id;

  const otherHash = await bcrypt.hash('senha123', 10);
  const otherRow = await pool.query(
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, 'Outro User', $2) RETURNING id`,
    [OTHER_EMAIL, otherHash]
  );
  otherId = otherRow.rows[0].id;

  const loginRes = await request(app).post('/auth/login').send({ email: USER_EMAIL, senha: 'senha123' });
  userToken = loginRes.body.token;

  const otherLoginRes = await request(app).post('/auth/login').send({ email: OTHER_EMAIL, senha: 'senha123' });
  otherToken = otherLoginRes.body.token;

  const sessRow = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Sessão Original') RETURNING id`,
    [userId]
  );
  sessionId = sessRow.rows[0].id;

  const summaryRow = await pool.query(
    `INSERT INTO sessions (user_id, titulo, summary) VALUES ($1, 'Caso PDF', $2) RETURNING id`,
    [userId, JSON.stringify({ hipotese: 'IAM', conduta: 'AAS + morfina', alertas: ['Risco alto'] })]
  );
  sessionWithSummaryId = summaryRow.rows[0].id;
  await pool.query(
    `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', 'Paciente com dor torácica há 2h')`,
    [sessionWithSummaryId]
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM sessions WHERE user_id = ANY($1)', [[userId, otherId]]);
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[USER_EMAIL, OTHER_EMAIL]]);
  await pool.end();
});

// ── PUT /sessions/:id ──────────────────────────────────────────

describe('PUT /sessions/:id', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).put(`/sessions/${sessionId}`).send({ titulo: 'Novo' });
    expect(res.status).toBe(401);
  });

  it('retorna 400 quando título está vazio', async () => {
    const res = await request(app)
      .put(`/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ titulo: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 404 para sessão de outro usuário', async () => {
    const res = await request(app)
      .put(`/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ titulo: 'Tentativa' });
    expect(res.status).toBe(404);
  });

  it('renomeia sessão com sucesso', async () => {
    const res = await request(app)
      .put(`/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ titulo: 'Sessão Renomeada' });
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Sessão Renomeada');
    expect(res.body.id).toBe(sessionId);
  });
});

// ── DELETE /sessions/:id ───────────────────────────────────────

describe('DELETE /sessions/:id', () => {
  let sessionToDeleteId;

  beforeEach(async () => {
    const row = await pool.query(
      `INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Para Deletar') RETURNING id`,
      [userId]
    );
    sessionToDeleteId = row.rows[0].id;
    await pool.query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', 'msg teste')`,
      [sessionToDeleteId]
    );
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).delete(`/sessions/${sessionToDeleteId}`);
    expect(res.status).toBe(401);
    // cleanup
    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionToDeleteId]);
  });

  it('retorna 404 para sessão de outro usuário', async () => {
    const res = await request(app)
      .delete(`/sessions/${sessionToDeleteId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
    // cleanup
    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionToDeleteId]);
  });

  it('deleta sessão e suas mensagens', async () => {
    const res = await request(app)
      .delete(`/sessions/${sessionToDeleteId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(204);

    const checkSession = await pool.query('SELECT id FROM sessions WHERE id = $1', [sessionToDeleteId]);
    expect(checkSession.rows.length).toBe(0);

    const checkMessages = await pool.query('SELECT id FROM messages WHERE session_id = $1', [sessionToDeleteId]);
    expect(checkMessages.rows.length).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```
cd backend && npm test -- --testPathPattern=sessions-management
```

Esperado: FAIL — "Cannot PUT /sessions/..." e "Cannot DELETE /sessions/..."

- [ ] **Step 3: Corrigir GET /:id para incluir `summary` na resposta**

Em `backend/src/routes/sessions.js`, dentro do `router.get('/:id', ...)` existente, localizar a query para usuário comum:

```js
: await pool.query(
    'SELECT id, titulo, created_at FROM sessions WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
```

Substituir por:

```js
: await pool.query(
    'SELECT id, titulo, created_at, summary FROM sessions WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
```

Isso garante que `data.session.summary` chegue ao frontend e o botão "Exportar PDF" apareça após a primeira análise.

- [ ] **Step 4: Implementar PUT e DELETE em sessions.js**

Adicionar após `router.get('/:id', ...)` e antes de `module.exports = router`:

```js
router.put('/:id', async (req, res) => {
  const { titulo } = req.body;
  if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
    return res.status(400).json({ error: 'Título é obrigatório.' });
  }
  if (titulo.trim().length > 100) {
    return res.status(400).json({ error: 'Título deve ter no máximo 100 caracteres.' });
  }
  try {
    const result = await pool.query(
      `UPDATE sessions SET titulo = $1 WHERE id = $2 AND user_id = $3 RETURNING id, titulo, created_at`,
      [titulo.trim(), req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sessão não encontrada.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[sessions] renomear:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT id FROM sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Sessão não encontrada.' });
    await pool.query('DELETE FROM messages WHERE session_id = $1', [req.params.id]);
    await pool.query('DELETE FROM sessions WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('[sessions] excluir:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

- [ ] **Step 5: Rodar testes novamente**

```
cd backend && npm test -- --testPathPattern=sessions-management
```

Esperado: testes de PUT e DELETE passando (os de entities e pdf ainda falharão — isso é esperado, ainda não foram implementados).

- [ ] **Step 6: Commit**

```
git add backend/src/routes/sessions.js backend/src/__tests__/sessions-management.test.js
git commit -m "feat: PUT e DELETE /sessions/:id com testes; GET /:id inclui summary"
```

---

## Task 2: Backend — GET /sessions/:id/entities

**Files:**
- Modify: `backend/src/__tests__/sessions-management.test.js`
- Modify: `backend/src/routes/sessions.js`

- [ ] **Step 1: Adicionar testes de GET /sessions/:id/entities no arquivo de testes**

Adicionar ao final de `sessions-management.test.js`, antes do fechamento do arquivo (antes do `afterAll` que já está no topo — não mover o afterAll):

> Nota: inserir o describe abaixo antes do `afterAll`. O `afterAll` deve permanecer como o último bloco do arquivo.

```js
// ── GET /sessions/:id/entities ────────────────────────────────

describe('GET /sessions/:id/entities', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get(`/sessions/${sessionId}/entities`);
    expect(res.status).toBe(401);
  });

  it('retorna 404 para sessão de outro usuário', async () => {
    const res = await request(app)
      .get(`/sessions/${sessionId}/entities`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });

  it('retorna estrutura { diagnosticos, medicamentos } (Neo4j indisponível → arrays vazios)', async () => {
    const res = await request(app)
      .get(`/sessions/${sessionId}/entities`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.diagnosticos)).toBe(true);
    expect(Array.isArray(res.body.medicamentos)).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar testes para confirmar que o novo describe falha**

```
cd backend && npm test -- --testPathPattern=sessions-management
```

Esperado: FAIL em "GET /sessions/:id/entities" — rota não existe ainda.

- [ ] **Step 3: Implementar GET /:id/entities em sessions.js**

Adicionar no topo do arquivo, após `const authMiddleware = require('../middleware/auth')`:

```js
const driver = require('../db/neo4j');
```

Adicionar a rota após `router.delete('/:id', ...)` e antes de `module.exports`:

```js
router.get('/:id/entities', async (req, res) => {
  try {
    const sessionCheck = await pool.query(
      'SELECT id FROM sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }
  } catch (err) {
    console.error('[sessions] entities — pg:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }

  if (!driver) {
    return res.json({ diagnosticos: [], medicamentos: [] });
  }

  const neo4jSession = driver.session();
  try {
    const diagResult = await neo4jSession.run(
      `MATCH (d:Diagnostico) WHERE d.sourceSessionId = $sessionId AND d.status IN ['pending', 'verified']
       RETURN d.nome AS nome, d.cid AS cid, d.status AS status`,
      { sessionId: req.params.id }
    );
    const medResult = await neo4jSession.run(
      `MATCH (m:Medicamento) WHERE m.sourceSessionId = $sessionId AND m.status IN ['pending', 'verified']
       RETURN m.nome AS nome, m.classe AS classe, m.viaAdmin AS viaAdmin, m.status AS status`,
      { sessionId: req.params.id }
    );

    const diagnosticos = diagResult.records.map(r => ({
      nome: r.get('nome'),
      cid: r.get('cid'),
      status: r.get('status'),
    }));
    const medicamentos = medResult.records.map(r => ({
      nome: r.get('nome'),
      classe: r.get('classe'),
      viaAdmin: r.get('viaAdmin'),
      status: r.get('status'),
    }));

    res.json({ diagnosticos, medicamentos });
  } catch (err) {
    console.error('[sessions] entities — neo4j:', err.message);
    res.json({ diagnosticos: [], medicamentos: [] });
  } finally {
    await neo4jSession.close();
  }
});
```

- [ ] **Step 4: Rodar testes**

```
cd backend && npm test -- --testPathPattern=sessions-management
```

Esperado: todos os describes de PUT, DELETE e entities passando.

- [ ] **Step 5: Commit**

```
git add backend/src/routes/sessions.js backend/src/__tests__/sessions-management.test.js
git commit -m "feat: GET /sessions/:id/entities com degradação graciosa se Neo4j indisponível"
```

---

## Task 3: Backend — GET /sessions/:id/pdf + pdfkit

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/src/routes/sessions.js`
- Modify: `backend/src/__tests__/sessions-management.test.js`

- [ ] **Step 1: Mover pdfkit de devDependencies para dependencies**

Em `backend/package.json`, remover `"pdfkit": "^0.18.0"` de `devDependencies` e adicionar em `dependencies`:

```json
"dependencies": {
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.18.2",
  "express-rate-limit": "^8.3.2",
  "helmet": "^8.1.0",
  "jsonwebtoken": "^9.0.2",
  "multer": "^2.1.1",
  "neo4j-driver": "^5.18.0",
  "openai": "^4.47.1",
  "pdf-parse": "^2.4.5",
  "pdfkit": "^0.18.0",
  "pg": "^8.11.5"
},
"devDependencies": {
  "jest": "^29.7.0",
  "supertest": "^7.0.0"
}
```

Rodar:

```
cd backend && npm install
```

- [ ] **Step 2: Adicionar testes de GET /sessions/:id/pdf**

Adicionar ao `sessions-management.test.js`, após o describe de entities (e antes do `afterAll`):

```js
// ── GET /sessions/:id/pdf ─────────────────────────────────────

describe('GET /sessions/:id/pdf', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get(`/sessions/${sessionWithSummaryId}/pdf`);
    expect(res.status).toBe(401);
  });

  it('retorna 404 para sessão de outro usuário', async () => {
    const res = await request(app)
      .get(`/sessions/${sessionWithSummaryId}/pdf`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });

  it('retorna 400 quando sessão não tem summary', async () => {
    const res = await request(app)
      .get(`/sessions/${sessionId}/pdf`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna PDF com Content-Type correto quando summary existe', async () => {
    const res = await request(app)
      .get(`/sessions/${sessionWithSummaryId}/pdf`)
      .set('Authorization', `Bearer ${userToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Confirmar que novo teste falha**

```
cd backend && npm test -- --testPathPattern=sessions-management
```

Esperado: FAIL em "GET /sessions/:id/pdf" — rota não existe.

- [ ] **Step 4: Implementar GET /:id/pdf em sessions.js**

Adicionar no topo do arquivo (logo após `const driver = require('../db/neo4j')`):

```js
const PDFDocument = require('pdfkit');
```

Adicionar a rota após `router.get('/:id/entities', ...)` e antes de `module.exports`:

```js
router.get('/:id/pdf', async (req, res) => {
  try {
    const sessionResult = await pool.query(
      'SELECT id, titulo, summary FROM sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    const sessao = sessionResult.rows[0];
    if (!sessao.summary) {
      return res.status(400).json({ error: 'Resumo ainda não gerado para esta sessão.' });
    }

    const msgResult = await pool.query(
      `SELECT content FROM messages WHERE session_id = $1 AND role = 'user' ORDER BY created_at ASC LIMIT 1`,
      [req.params.id]
    );

    const primeiraMensagem = msgResult.rows[0]?.content || '';
    const { hipotese, conduta, alertas = [] } = sessao.summary;
    const safeTitulo = sessao.titulo.replace(/[^\w\sÀ-ɏ-]/g, '').trim() || 'caso';
    const filename = `caso-${safeTitulo}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text(sessao.titulo, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
       .text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
    doc.fillColor('#000000').moveDown(1.5);

    doc.fontSize(13).font('Helvetica-Bold').text('Caso Clínico');
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica').text(primeiraMensagem || 'Não registrado.', { lineGap: 4 });
    doc.moveDown(1.5);

    doc.fontSize(13).font('Helvetica-Bold').text('Hipótese Diagnóstica');
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica').text(hipotese || 'Não disponível.', { lineGap: 4 });
    doc.moveDown(1.5);

    doc.fontSize(13).font('Helvetica-Bold').text('Conduta Proposta');
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica').text(conduta || 'Não disponível.', { lineGap: 4 });

    if (alertas.length > 0) {
      doc.moveDown(1.5);
      doc.fontSize(13).font('Helvetica-Bold').text('Alertas');
      doc.moveDown(0.3);
      for (const alerta of alertas) {
        doc.fontSize(11).font('Helvetica').text(`• ${alerta}`, { lineGap: 4 });
      }
    }

    doc.end();
  } catch (err) {
    console.error('[sessions] pdf:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro interno.' });
    }
  }
});
```

- [ ] **Step 5: Rodar testes**

```
cd backend && npm test -- --testPathPattern=sessions-management
```

Esperado: todos os describes passando (PUT, DELETE, entities, pdf).

- [ ] **Step 6: Commit**

```
git add backend/src/routes/sessions.js backend/src/__tests__/sessions-management.test.js backend/package.json backend/package-lock.json
git commit -m "feat: GET /sessions/:id/pdf; pdfkit movido para dependencies"
```

---

## Task 4: Frontend api.js — novas funções e correção de deleteSession

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Corrigir deleteSession para lidar com 204 No Content**

Localizar a função `deleteSession` existente em `api.js` (linhas 79–87) e substituir por:

```js
export async function deleteSession(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao deletar sessão.');
  // 204 No Content — sem corpo para parsear
}
```

- [ ] **Step 2: Adicionar renameSession, getSessionEntities e downloadSessionPdf**

Adicionar ao final de `api.js`, após a função `updateUserStatus`:

```js
// ─────── SESSIONS ──────────────
export async function renameSession(id, titulo) {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ titulo }),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao renomear sessão.');
  }
  return res.json();
}

export async function getSessionEntities(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}/entities`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar entidades.');
  return res.json();
}

export async function downloadSessionPdf(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}/pdf`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao gerar PDF.');
  }
  return res.blob();
}
```

- [ ] **Step 3: Verificar build sem erros**

```
cd frontend && npm run build
```

Esperado: `✓ built in X.XXs` sem erros.

- [ ] **Step 4: Commit**

```
git add frontend/src/services/api.js
git commit -m "feat: renameSession, getSessionEntities, downloadSessionPdf em api.js; corrige deleteSession para 204"
```

---

## Task 5: Frontend Sidebar — busca + menu kebab

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`
- Modify: `frontend/src/components/Sidebar.module.scss`

- [ ] **Step 1: Adicionar novos estilos em Sidebar.module.scss**

Adicionar ao final do arquivo `Sidebar.module.scss`:

```scss
// ── Search ─────────────────────────────────────────────────────
.searchInput {
  margin: 8px 8px 4px;
  width: calc(100% - 16px);
  padding: 7px 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: $border-radius;
  color: white;
  font-size: $font-size-sm;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(176, 196, 204, 0.45);
  }

  &:focus {
    border-color: rgba(255, 255, 255, 0.25);
  }
}

// ── Item com menu ───────────────────────────────────────────────
.itemInner {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  position: relative;
}

.itemTitle {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.menuBtn {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.55);
  padding: 2px 5px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 15px;
  line-height: 1;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 2px);
  z-index: 200;
  background: #1e2d3d;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  min-width: 130px;

  button {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.45rem 0.75rem;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.85);
    background: transparent;
    border: none;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    &:last-child {
      color: #fca5a5;

      &:hover {
        background: rgba(220, 38, 38, 0.15);
      }
    }
  }
}

.editInput {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  color: white;
  font-size: $font-size-sm;
  padding: 2px 6px;
  outline: none;
  min-width: 0;
}
```

Também modificar `.item` existente para suportar o layout flex interno — substituir o `.item` atual por:

```scss
.item {
  padding: 9px 12px;
  border-radius: $border-radius;
  cursor: pointer;
  font-size: $font-size-sm;
  color: $color-text-sidebar;
  display: flex;
  align-items: center;
  transition: background 0.1s, color 0.1s;
  margin-bottom: 1px;
  position: relative;

  &:hover {
    background: $color-sidebar-hover;
    color: white;
  }

  &.active {
    background: $color-sidebar-hover;
    color: white;
  }
}
```

- [ ] **Step 2: Reescrever Sidebar.jsx**

Substituir o conteúdo completo de `frontend/src/components/Sidebar.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSessions, createSession, renameSession, deleteSession } from '../services/api';
import styles from './Sidebar.module.scss';

export default function Sidebar({ activeSessionId, onSelectSession, onSessionDeleted, isOpen, onClose }) {
  const { user, clearAuth } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingTitulo, setEditingTitulo] = useState('');

  useEffect(() => {
    getSessions().then(setSessions).catch(console.error);
  }, []);

  useEffect(() => {
    getSessions().then(setSessions).catch(console.error);
  }, [activeSessionId]);

  useEffect(() => {
    if (!menuOpenId) return;
    function handleClick() { setMenuOpenId(null); }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpenId]);

  async function handleNewCase() {
    try {
      const session = await createSession('Novo caso');
      setSessions((prev) => [session, ...prev]);
      onSelectSession(session.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRename(id) {
    const titulo = editingTitulo.trim();
    setEditingId(null);
    if (!titulo) return;
    try {
      const updated = await renameSession(id, titulo);
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, titulo: updated.titulo } : s)));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este caso? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      onSessionDeleted?.(id);
    } catch (err) {
      console.error(err);
    }
  }

  const sessoesFiltradas = search.trim()
    ? sessions.filter((s) => s.titulo.toLowerCase().includes(search.trim().toLowerCase()))
    : sessions;

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>Conduta</h1>
            <p>Apoio clínico</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar menu">
            &#x2715;
          </button>
        </div>
      </div>

      <button className={styles.newCase} onClick={handleNewCase}>
        + Novo caso
      </button>

      <input
        className={styles.searchInput}
        type="text"
        placeholder="Buscar caso..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className={styles.sectionLabel}>Casos anteriores</div>

      <div className={styles.list}>
        {sessoesFiltradas.map((s) => (
          <div
            key={s.id}
            className={`${styles.item} ${s.id === activeSessionId ? styles.active : ''}`}
            onClick={() => { if (editingId !== s.id) onSelectSession(s.id); }}
          >
            <div className={styles.itemInner}>
              {editingId === s.id ? (
                <input
                  className={styles.editInput}
                  value={editingTitulo}
                  autoFocus
                  onChange={(e) => setEditingTitulo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(s.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={() => handleRename(s.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className={styles.itemTitle} title={s.titulo}>{s.titulo}</span>
                  {(s.id === activeSessionId || s.id === menuOpenId) && (
                    <button
                      className={styles.menuBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === s.id ? null : s.id);
                      }}
                      title="Opções"
                    >
                      ⋯
                    </button>
                  )}
                  {menuOpenId === s.id && (
                    <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          setEditingId(s.id);
                          setEditingTitulo(s.titulo);
                        }}
                      >
                        ✏️ Renomear
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          handleDelete(s.id);
                        }}
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {sessoesFiltradas.length === 0 && search.trim() && (
          <p style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: 'rgba(176,196,204,0.5)' }}>
            Nenhum caso encontrado.
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.userName}>{user?.nome}</span>
        <button className={styles.logoutBtn} onClick={clearAuth}>
          Sair
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Verificar build**

```
cd frontend && npm run build
```

Esperado: `✓ built in X.XXs` sem erros.

- [ ] **Step 4: Commit**

```
git add frontend/src/components/Sidebar.jsx frontend/src/components/Sidebar.module.scss
git commit -m "feat: busca por título e menu kebab (renomear/excluir) na Sidebar"
```

---

## Task 6: Frontend Dashboard — session header, PDF e EntitiesPanel

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`
- Modify: `frontend/src/pages/Dashboard.module.scss`

- [ ] **Step 1: Adicionar novos estilos em Dashboard.module.scss**

Adicionar ao final de `Dashboard.module.scss`:

```scss
// ── Session Header ──────────────────────────────────────────────
.sessionHeader {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid $color-border;
  gap: 1rem;
  flex-shrink: 0;
  background: $color-surface;
}

.sessionTitle {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: $color-text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pdfBtn {
  flex-shrink: 0;
  padding: 0.3rem 0.85rem;
  border: 1px solid $color-border;
  border-radius: 4px;
  background: white;
  font-size: 0.78rem;
  cursor: pointer;
  color: $color-text-secondary;
  white-space: nowrap;

  &:hover {
    background: #f3f4f6;
    color: $color-text-primary;
  }
}

// ── Entities Panel ──────────────────────────────────────────────
.entitiesPanel {
  flex-shrink: 0;
  border-top: 1px solid $color-border;
  background: #fafafa;
}

.entitiesToggle {
  width: 100%;
  text-align: left;
  padding: 0.45rem 1.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.78rem;
  color: $color-text-secondary;

  &:hover {
    color: $color-text-primary;
  }
}

.entitiesBody {
  padding: 0 1.25rem 0.75rem;
}

.entitiesGroup {
  margin-bottom: 0.5rem;
}

.entitiesLabel {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  margin-bottom: 0.3rem;
}

.entitiesTags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.tagDiag {
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  cursor: default;
}

.tagMed {
  background: #d1fae5;
  color: #065f46;
  border-radius: 4px;
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  cursor: default;
}

.entitiesInfo {
  font-size: 0.78rem;
  color: #9ca3af;
}

.entitiesError {
  font-size: 0.78rem;
  color: #991b1b;
}
```

- [ ] **Step 2: Reescrever Dashboard.jsx**

Substituir o conteúdo completo de `frontend/src/pages/Dashboard.jsx`:

```jsx
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CaseInput from '../components/CaseInput';
import AnalysisResult from '../components/AnalysisResult';
import UsageCounter from '../components/UsageCounter';
import { getSession, submitFeedback, getUsage, downloadSessionPdf, getSessionEntities } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.scss';

function EntitiesPanel({ sessionId }) {
  const [open, setOpen] = useState(false);
  const [entities, setEntities] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setOpen(false);
    setEntities(null);
    setError(null);
  }, [sessionId]);

  async function handleToggle() {
    if (!open && entities === null) {
      setLoading(true);
      try {
        const data = await getSessionEntities(sessionId);
        setEntities(data);
      } catch (err) {
        setError('Erro ao carregar entidades.');
      } finally {
        setLoading(false);
      }
    }
    setOpen((prev) => !prev);
  }

  const total = entities ? entities.diagnosticos.length + entities.medicamentos.length : 0;

  return (
    <div className={styles.entitiesPanel}>
      <button className={styles.entitiesToggle} onClick={handleToggle}>
        {open ? '▴' : '▾'} Entidades extraídas{entities !== null ? ` (${total})` : ''}
      </button>
      {open && (
        <div className={styles.entitiesBody}>
          {loading && <span className={styles.entitiesInfo}>Carregando...</span>}
          {error && <span className={styles.entitiesError}>{error}</span>}
          {entities !== null && total === 0 && !loading && (
            <span className={styles.entitiesInfo}>Nenhuma entidade encontrada.</span>
          )}
          {entities && entities.diagnosticos.length > 0 && (
            <div className={styles.entitiesGroup}>
              <span className={styles.entitiesLabel}>Diagnósticos</span>
              <div className={styles.entitiesTags}>
                {entities.diagnosticos.map((d, i) => (
                  <span
                    key={i}
                    className={styles.tagDiag}
                    title={d.status === 'pending' ? 'Aguardando revisão' : 'Verificado'}
                  >
                    {d.nome}{d.cid ? ` (${d.cid})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
          {entities && entities.medicamentos.length > 0 && (
            <div className={styles.entitiesGroup}>
              <span className={styles.entitiesLabel}>Medicamentos</span>
              <div className={styles.entitiesTags}>
                {entities.medicamentos.map((m, i) => (
                  <span
                    key={i}
                    className={styles.tagMed}
                    title={m.status === 'pending' ? 'Aguardando revisão' : 'Verificado'}
                  >
                    {m.nome}{m.classe ? ` · ${m.classe}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
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
    setActiveSession(null);
    setMessages([]);
    setStreaming(false);
    setLoadingHistory(true);
    try {
      const data = await getSession(id);
      setMessages(data.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, feedback: m.feedback })));
      setActiveSession(data.session);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  function handleSessionDeleted(deletedId) {
    if (deletedId === activeSessionId) {
      setActiveSessionId(null);
      setActiveSession(null);
      setMessages([]);
    }
  }

  async function handleDownloadPdf() {
    try {
      const blob = await downloadSessionPdf(activeSessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caso-${activeSession?.titulo || 'caso'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err.message);
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
        onSessionDeleted={handleSessionDeleted}
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
            <div className={styles.sessionHeader}>
              <span className={styles.sessionTitle}>{activeSession?.titulo || ''}</span>
              {activeSession?.summary && (
                <button className={styles.pdfBtn} onClick={handleDownloadPdf}>
                  ↓ Exportar PDF
                </button>
              )}
            </div>
            <AnalysisResult
              messages={messages}
              streaming={streaming}
              loading={loadingHistory}
              onFeedback={async (messageId, feedback, note) => {
                await submitFeedback(messageId, feedback, note);
                setMessages((prev) =>
                  prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
                );
              }}
            />
            <EntitiesPanel sessionId={activeSessionId} />
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
                    setActiveSession(data.session);
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

> **Nota:** O `onAnalysisDone` foi atualizado para também chamar `setActiveSession(data.session)` — isso garante que o botão PDF apareça após a primeira análise, quando o summary é gerado.

- [ ] **Step 3: Verificar build**

```
cd frontend && npm run build
```

Esperado: `✓ built in X.XXs` sem erros de tipo ou import.

- [ ] **Step 4: Commit**

```
git add frontend/src/pages/Dashboard.jsx frontend/src/pages/Dashboard.module.scss
git commit -m "feat: session header, exportar PDF e painel de entidades no Dashboard"
```

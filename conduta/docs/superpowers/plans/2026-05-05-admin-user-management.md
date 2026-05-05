# Admin — Gestão de Usuários: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar listagem, alteração de plano e ativação/desativação de usuários ao painel admin.

**Architecture:** Migration adiciona `active` ao schema. Backend ganha `GET /admin/users` e `PATCH /admin/users/:id/status`. `authMiddleware` passa a verificar `active`. Frontend adiciona `UsersPanel` como seção no topo de `AdminKnowledge.jsx`.

**Tech Stack:** Node.js/Express, PostgreSQL (`pg`), React 18, Vite, SCSS Modules.

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `backend/src/db/migrations/009_user_active.sql` | Criar |
| `backend/src/middleware/auth.js` | Modificar — adiciona verificação `active` |
| `backend/src/routes/admin.js` | Modificar — adiciona GET /users e PATCH /users/:id/status |
| `backend/src/__tests__/admin-users.test.js` | Criar |
| `frontend/src/services/api.js` | Modificar — adiciona getAdminUsers, updateUserPlan, updateUserStatus |
| `frontend/src/pages/AdminKnowledge.jsx` | Modificar — adiciona UsersPanel e importa useAuth |
| `frontend/src/pages/AdminKnowledge.module.scss` | Modificar — adiciona estilos do painel de usuários |

---

## Task 1: Migration — coluna `active` em `users`

**Files:**
- Create: `backend/src/db/migrations/009_user_active.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
```

Salvar em `backend/src/db/migrations/009_user_active.sql`.

- [ ] **Step 2: Executar a migration localmente**

```bash
cd conduta/backend && node src/db/migrate.js
```

Saída esperada:
```
Migration executada: 009_user_active.sql
```

- [ ] **Step 3: Commit**

```bash
git add conduta/backend/src/db/migrations/009_user_active.sql
git commit -m "feat: migration — coluna active em users"
```

---

## Task 2: authMiddleware verifica `active`

**Files:**
- Modify: `backend/src/middleware/auth.js`
- Create: `backend/src/__tests__/admin-users.test.js` (setup inicial + teste de active)

- [ ] **Step 1: Escrever o teste que vai falhar**

Criar `backend/src/__tests__/admin-users.test.js`:

```js
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
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
cd conduta/backend && npx jest admin-users --no-coverage 2>&1 | tail -20
```

Esperado: FAIL — `Expected: 401, Received: 200` (authMiddleware ainda não verifica active).

- [ ] **Step 3: Atualizar `authMiddleware` para verificar `active`**

Substituir em `backend/src/middleware/auth.js` a query de verificação:

```js
// antes:
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
next();
```

```js
// depois:
const result = await pool.query('SELECT session_version, plan, active FROM users WHERE id = $1', [payload.sub]);
if (!result.rows.length || result.rows[0].session_version !== payload.sv) {
  return res.status(401).json({
    error: 'Sua sessão foi encerrada pois outro acesso foi iniciado.',
    code: 'SESSION_KICKED',
  });
}

if (!result.rows[0].active) {
  return res.status(401).json({ error: 'Conta desativada.' });
}

req.userId = payload.sub;
req.userRole = payload.role || 'user';
req.userPlan = result.rows[0].plan || 'free';
next();
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
cd conduta/backend && npx jest admin-users --no-coverage 2>&1 | tail -10
```

Esperado: `PASS — 1 passed`.

- [ ] **Step 5: Commit**

```bash
git add conduta/backend/src/middleware/auth.js conduta/backend/src/__tests__/admin-users.test.js
git commit -m "feat: authMiddleware verifica active; teste base de admin-users"
```

---

## Task 3: Backend — GET /admin/users

**Files:**
- Modify: `backend/src/__tests__/admin-users.test.js` — adicionar bloco describe
- Modify: `backend/src/routes/admin.js` — adicionar rota

- [ ] **Step 1: Adicionar testes para GET /admin/users no arquivo de testes**

Adicionar ao final de `backend/src/__tests__/admin-users.test.js`, antes do `afterAll`:

```js
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
```

- [ ] **Step 2: Rodar e confirmar que os novos testes falham**

```bash
cd conduta/backend && npx jest admin-users --no-coverage 2>&1 | tail -15
```

Esperado: FAIL — `Expected: 200, Received: 404` para GET /admin/users.

- [ ] **Step 3: Adicionar `GET /admin/users` em `backend/src/routes/admin.js`**

Adicionar logo após os `require`s e antes de `router.post('/users', ...)`:

```js
router.get('/users', adminMiddleware, async (req, res) => {
  const { search } = req.query;
  try {
    let query, params;
    if (search && search.trim()) {
      query = `SELECT id, email, nome, role, plan, active, created_at
               FROM users
               WHERE nome ILIKE $1 OR email ILIKE $1
               ORDER BY created_at DESC`;
      params = [`%${search.trim()}%`];
    } else {
      query = `SELECT id, email, nome, role, plan, active, created_at
               FROM users
               ORDER BY created_at DESC`;
      params = [];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[admin] listar usuários:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

- [ ] **Step 4: Rodar e confirmar que todos os testes passam**

```bash
cd conduta/backend && npx jest admin-users --no-coverage 2>&1 | tail -10
```

Esperado: `PASS — 6 passed`.

- [ ] **Step 5: Commit**

```bash
git add conduta/backend/src/routes/admin.js conduta/backend/src/__tests__/admin-users.test.js
git commit -m "feat: GET /admin/users com busca opcional"
```

---

## Task 4: Backend — PATCH /admin/users/:id/status

**Files:**
- Modify: `backend/src/__tests__/admin-users.test.js` — adicionar bloco describe
- Modify: `backend/src/routes/admin.js` — adicionar rota

- [ ] **Step 1: Adicionar testes para PATCH /admin/users/:id/status**

Adicionar ao final de `backend/src/__tests__/admin-users.test.js`:

```js
describe('PATCH /admin/users/:id/status', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .patch(`/admin/users/${userId}/status`)
      .send({ active: false });
    expect(res.status).toBe(401);
  });

  it('retorna 403 para usuário comum', async () => {
    const res = await request(app)
      .patch(`/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ active: false });
    expect(res.status).toBe(403);
  });

  it('retorna 400 quando active não é boolean', async () => {
    const res = await request(app)
      .patch(`/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('desativa usuário e incrementa session_version', async () => {
    const svBefore = await pool.query('SELECT session_version FROM users WHERE id = $1', [userId]);
    const svAntes = svBefore.rows[0].session_version;

    const res = await request(app)
      .patch(`/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);

    const svAfter = await pool.query('SELECT session_version FROM users WHERE id = $1', [userId]);
    expect(svAfter.rows[0].session_version).toBe(svAntes + 1);

    // Restaurar
    await pool.query('UPDATE users SET active = true WHERE id = $1', [userId]);
  });

  it('retorna 403 ao tentar desativar outro admin', async () => {
    const res = await request(app)
      .patch(`/admin/users/${adminId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });
    expect(res.status).toBe(403);
  });

  it('reativa usuário sem incrementar session_version', async () => {
    await pool.query('UPDATE users SET active = false WHERE id = $1', [userId]);
    const svBefore = await pool.query('SELECT session_version FROM users WHERE id = $1', [userId]);
    const svAntes = svBefore.rows[0].session_version;

    const res = await request(app)
      .patch(`/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: true });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(true);

    const svAfter = await pool.query('SELECT session_version FROM users WHERE id = $1', [userId]);
    expect(svAfter.rows[0].session_version).toBe(svAntes);
  });

  it('retorna 404 para userId inexistente', async () => {
    const res = await request(app)
      .patch('/admin/users/00000000-0000-0000-0000-000000000000/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que os novos testes falham**

```bash
cd conduta/backend && npx jest admin-users --no-coverage 2>&1 | tail -15
```

Esperado: FAIL — `Expected: 200, Received: 404` para PATCH /admin/users/:id/status.

- [ ] **Step 3: Adicionar `PATCH /admin/users/:id/status` em `backend/src/routes/admin.js`**

Adicionar após o `router.get('/users', ...)` que foi criado na Task 3:

```js
router.patch('/users/:id/status', adminMiddleware, async (req, res) => {
  const { active } = req.body;

  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'active deve ser boolean.' });
  }

  try {
    const targetResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.params.id]
    );
    if (targetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    if (targetResult.rows[0].role === 'admin') {
      return res.status(403).json({ error: 'Não é possível alterar o status de um admin.' });
    }

    const query = active
      ? `UPDATE users SET active = $1 WHERE id = $2 RETURNING id, email, nome, role, plan, active`
      : `UPDATE users SET active = $1, session_version = session_version + 1 WHERE id = $2 RETURNING id, email, nome, role, plan, active`;

    const result = await pool.query(query, [active, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[admin] alterar status:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

- [ ] **Step 4: Rodar toda a suite de admin-users e confirmar que todos passam**

```bash
cd conduta/backend && npx jest admin-users --no-coverage 2>&1 | tail -10
```

Esperado: `PASS — 13 passed`.

- [ ] **Step 5: Rodar a suite completa do backend para garantir que não quebrou nada**

```bash
cd conduta/backend && npx jest --no-coverage 2>&1 | tail -15
```

Esperado: todos os testes passam (exceto os que já falhavam por falta de DB — isso é esperado em CI sem serviços).

- [ ] **Step 6: Commit**

```bash
git add conduta/backend/src/routes/admin.js conduta/backend/src/__tests__/admin-users.test.js
git commit -m "feat: PATCH /admin/users/:id/status com invalidação de sessão"
```

---

## Task 5: Frontend — funções da API

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Adicionar as 3 funções ao final de `frontend/src/services/api.js`**

Adicionar ao final do arquivo, após `getFeedbackStats`:

```js
// ─────── ADMIN USERS ──────────────
export async function getAdminUsers(search) {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${BASE_URL}/admin/users${params}`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao listar usuários.');
  return res.json();
}

export async function updateUserPlan(id, plan) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}/plan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ plan }),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao alterar plano.');
  }
  return res.json();
}

export async function updateUserStatus(id, active) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ active }),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao alterar status.');
  }
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add conduta/frontend/src/services/api.js
git commit -m "feat: funções de API para gestão de usuários admin"
```

---

## Task 6: Frontend — UsersPanel

**Files:**
- Modify: `frontend/src/pages/AdminKnowledge.jsx`
- Modify: `frontend/src/pages/AdminKnowledge.module.scss`

- [ ] **Step 1: Adicionar o import de `useAuth` e das novas funções de API em `AdminKnowledge.jsx`**

Substituir a linha 1 do arquivo:

```js
// antes:
import { useEffect, useState } from 'react';
import { getPendingKnowledge, approveKnowledge, rejectKnowledge, listDocuments, uploadDocument, getFeedbackStats, getAdminFeedbacks, deactivateAdminFeedback } from '../services/api';
import styles from './AdminKnowledge.module.scss';
```

```js
// depois:
import { useEffect, useRef, useState } from 'react';
import { getPendingKnowledge, approveKnowledge, rejectKnowledge, listDocuments, uploadDocument, getFeedbackStats, getAdminFeedbacks, deactivateAdminFeedback, getAdminUsers, updateUserPlan, updateUserStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './AdminKnowledge.module.scss';
```

- [ ] **Step 2: Adicionar o componente `UsersPanel` antes de `DocumentsPanel` em `AdminKnowledge.jsx`**

Inserir o bloco abaixo logo após os imports e antes de `function DocumentsPanel()`:

```js
function UsersPanel({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [rowMessages, setRowMessages] = useState({});
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchUsers('');
  }, []);

  function fetchUsers(q) {
    setLoading(true);
    getAdminUsers(q)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function handleSearchChange(e) {
    const q = e.target.value;
    setSearch(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(q), 300);
  }

  function setRowMessage(userId, type, text) {
    setRowMessages((prev) => ({ ...prev, [userId]: { type, text } }));
    setTimeout(() => {
      setRowMessages((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }, 3000);
  }

  async function handleTogglePlan(u) {
    const novoPlan = u.plan === 'free' ? 'pro' : 'free';
    setActionLoading((prev) => ({ ...prev, [u.id]: 'plan' }));
    try {
      const updated = await updateUserPlan(u.id, novoPlan);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, plan: updated.plan } : x)));
      setRowMessage(u.id, 'success', `Plano alterado para ${updated.plan}.`);
    } catch (err) {
      setRowMessage(u.id, 'error', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [u.id]: null }));
    }
  }

  async function handleToggleStatus(u) {
    if (!u.active) {
      setActionLoading((prev) => ({ ...prev, [u.id]: 'status' }));
      try {
        const updated = await updateUserStatus(u.id, true);
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active: updated.active } : x)));
        setRowMessage(u.id, 'success', 'Usuário reativado.');
      } catch (err) {
        setRowMessage(u.id, 'error', err.message);
      } finally {
        setActionLoading((prev) => ({ ...prev, [u.id]: null }));
      }
      return;
    }

    if (!confirm(`Desativar ${u.nome}? O acesso será bloqueado imediatamente.`)) return;
    setActionLoading((prev) => ({ ...prev, [u.id]: 'status' }));
    try {
      const updated = await updateUserStatus(u.id, false);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active: updated.active } : x)));
      setRowMessage(u.id, 'success', 'Usuário desativado.');
    } catch (err) {
      setRowMessage(u.id, 'error', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [u.id]: null }));
    }
  }

  return (
    <section className={styles.usersPanel}>
      <h2 className={styles.sectionTitle}>Usuários ({users.length})</h2>

      <input
        className={styles.searchInput}
        type="text"
        placeholder="Buscar por nome ou email"
        value={search}
        onChange={handleSearchChange}
      />

      {loading ? (
        <p className={styles.info}>Carregando usuários...</p>
      ) : users.length === 0 ? (
        <p className={styles.info}>Nenhum usuário encontrado.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const busy = actionLoading[u.id];
              const msg = rowMessages[u.id];
              return (
                <tr key={u.id} className={!u.active ? styles.rowInactive : ''}>
                  <td className={styles.nome}>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={u.plan === 'pro' ? styles.badgeActive : styles.badgePlan}>
                      {u.plan}
                    </span>
                  </td>
                  <td>
                    <span className={u.active ? styles.badgeActive : styles.badgeInactive}>
                      {u.active ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td className={styles.date}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className={styles.actions}>
                    {msg && (
                      <span className={msg.type === 'error' ? styles.rowError : styles.rowSuccess}>
                        {msg.text}
                      </span>
                    )}
                    <button
                      className={styles.planBtn}
                      onClick={() => handleTogglePlan(u)}
                      disabled={isSelf || !!busy}
                      title={isSelf ? 'Não é possível alterar o próprio plano' : ''}
                    >
                      {busy === 'plan' ? '...' : u.plan === 'free' ? '→ pro' : '→ free'}
                    </button>
                    <button
                      className={u.active ? styles.rejectBtn : styles.approveBtn}
                      onClick={() => handleToggleStatus(u)}
                      disabled={isSelf || !!busy}
                      title={isSelf ? 'Não é possível alterar o próprio status' : ''}
                    >
                      {busy === 'status' ? '...' : u.active ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Adicionar `useAuth` e `UsersPanel` ao componente `AdminKnowledge`**

No `export default function AdminKnowledge()`, adicionar `useAuth` logo no início:

```js
// antes:
export default function AdminKnowledge() {
  const [items, setItems] = useState([]);
```

```js
// depois:
export default function AdminKnowledge() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
```

E no JSX retornado, adicionar `<UsersPanel>` como primeira seção dentro de `<div className={styles.page}>`, logo após o `<header>`:

```jsx
// adicionar após o bloco de header e antes do loading/error check:
<UsersPanel currentUserId={user?.id} />
```

O bloco `return` completo do componente `AdminKnowledge` fica assim (somente o trecho alterado, logo após `</header>`):

```jsx
      <UsersPanel currentUserId={user?.id} />

      {loading && <p className={styles.info}>Carregando...</p>}
      {error && <p className={styles.error}>{error}</p>}
```

- [ ] **Step 4: Adicionar os estilos em `AdminKnowledge.module.scss`**

Adicionar ao final do arquivo:

```scss
// ── Users Panel ────────────────────────────────────────────────
.usersPanel {
  margin-bottom: 2.5rem;
}

.searchInput {
  width: 100%;
  max-width: 380px;
  padding: 0.45rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  outline: none;

  &:focus {
    border-color: #1a56db;
    box-shadow: 0 0 0 2px #e8f0fe;
  }
}

.planBtn {
  padding: 0.3rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  margin-right: 0.4rem;

  &:hover:not(:disabled) {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.badgePlan {
  background: #f3f4f6;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.rowSuccess {
  font-size: 0.75rem;
  color: #166534;
  margin-right: 0.5rem;
}

.rowError {
  font-size: 0.75rem;
  color: #991b1b;
  margin-right: 0.5rem;
}
```

- [ ] **Step 5: Verificar que o frontend compila sem erros**

```bash
cd conduta/frontend && npm run build 2>&1 | tail -20
```

Esperado: sem erros de TypeScript/Vite. Pode haver warnings de lint, mas não erros.

- [ ] **Step 6: Commit**

```bash
git add conduta/frontend/src/pages/AdminKnowledge.jsx conduta/frontend/src/pages/AdminKnowledge.module.scss
git commit -m "feat: UsersPanel no painel admin com busca, plano e status"
```

---

## Self-review

**Cobertura do spec:**
- ✅ Migration `active` → Task 1
- ✅ authMiddleware verifica `active` → Task 2
- ✅ `GET /admin/users` com `?search=` → Task 3
- ✅ `PATCH /admin/users/:id/status` + invalidação de sessão → Task 4
- ✅ Frontend: `getAdminUsers`, `updateUserPlan`, `updateUserStatus` → Task 5
- ✅ UsersPanel com busca debounced, feedback por linha, proteção própria linha → Task 6
- ✅ 403 para desativar admin (backend + frontend disabled) → Tasks 4 e 6
- ✅ `window.confirm` antes de desativar → Task 6
- ✅ Styles para novo painel → Task 6

**Placeholders:** nenhum.

**Consistência de tipos:**
- `updateUserPlan` retorna `{ id, email, nome, role, plan }` — usado como `updated.plan` ✅
- `updateUserStatus` retorna `{ id, email, nome, role, plan, active }` — usado como `updated.active` ✅
- `getAdminUsers` retorna `[{ id, email, nome, role, plan, active, created_at }]` — todos os campos acessados no JSX ✅

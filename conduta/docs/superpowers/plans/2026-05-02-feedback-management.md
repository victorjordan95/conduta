# Feedback Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar gestão completa de feedbacks — admin pode ver e desativar correções, stats de feedback por período, e feedback negativo sem nota ainda gera aprendizado a partir do conteúdo da resposta da IA.

**Architecture:** Três melhorias independentes no sistema de feedback existente. Backend: novos endpoints em `admin-feedback.js` (admin routes) e ajustes em `feedback.js` (stats + Correcao genérica). Frontend: nova seção "Correções" e "Estatísticas" adicionadas ao `AdminKnowledge.jsx` existente.

**Tech Stack:** Node.js/Express, PostgreSQL (pool pg), Neo4j (driver neo4j), React, CSS Modules (.module.scss)

---

## File Map

| Ação | Arquivo |
|------|---------|
| **Create** | `backend/src/routes/admin-feedback.js` |
| **Modify** | `backend/src/routes/feedback.js` |
| **Modify** | `backend/src/app.js` |
| **Modify** | `frontend/src/services/api.js` |
| **Modify** | `frontend/src/pages/AdminKnowledge.jsx` |
| **Modify** | `frontend/src/pages/AdminKnowledge.module.scss` |

---

## Task 1: Backend — Listar e desativar correções (admin)

**Files:**
- Create: `backend/src/routes/admin-feedback.js`

- [ ] **Step 1: Criar o arquivo com os dois endpoints**

```javascript
// backend/src/routes/admin-feedback.js
const express = require('express');
const driver = require('../db/neo4j');
const pool = require('../db/pg');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// GET /admin/feedbacks — lista Correcao nodes (ativas e inativas)
router.get('/', adminMiddleware, async (req, res) => {
  if (!driver) return res.json({ corrections: [] });
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (c:Correcao)
       RETURN elementId(c) AS nodeId,
              c.nota       AS nota,
              c.keywords   AS keywords,
              c.status     AS status,
              c.sessionId  AS sessionId,
              c.createdAt  AS createdAt
       ORDER BY c.createdAt DESC
       LIMIT 100`
    );
    const corrections = result.records.map((r) => ({
      nodeId:    r.get('nodeId'),
      nota:      r.get('nota'),
      keywords:  r.get('keywords') || [],
      status:    r.get('status'),
      sessionId: r.get('sessionId'),
      createdAt: r.get('createdAt'),
    }));
    res.json({ corrections });
  } catch (err) {
    console.error('[admin-feedback] list error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

// DELETE /admin/feedbacks/:nodeId — desativa Correcao node
router.delete('/:nodeId', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j indisponível.' });
  const { nodeId } = req.params;
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (c:Correcao)
       WHERE elementId(c) = $nodeId
       SET c.status = 'inactive', c.deactivatedAt = $now
       RETURN elementId(c) AS nodeId`,
      { nodeId, now: new Date().toISOString() }
    );
    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Correção não encontrada.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin-feedback] delete error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

module.exports = router;
```

- [ ] **Step 2: Registrar a rota em app.js**

Abrir `backend/src/app.js` e adicionar após as outras rotas admin:

```javascript
const adminFeedbackRouter = require('./routes/admin-feedback');
// ...depois das outras rotas:
app.use('/admin/feedbacks', adminFeedbackRouter);
```

- [ ] **Step 3: Verificar manualmente que o endpoint responde**

```bash
# no backend rodando:
curl -H "Authorization: Bearer <admin-token>" http://localhost:3001/admin/feedbacks
# Esperado: { corrections: [...] }
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/admin-feedback.js backend/src/app.js
git commit -m "feat: admin endpoints para listar e desativar correções de feedback"
```

---

## Task 2: Backend — Stats de feedback (`GET /feedback/stats`)

**Files:**
- Modify: `backend/src/routes/feedback.js`

- [ ] **Step 1: Adicionar endpoint de stats antes do `module.exports`**

Abrir `backend/src/routes/feedback.js` e adicionar antes de `module.exports = router;`:

```javascript
// GET /feedback/stats — resumo e breakdown diário (admin only)
const adminMiddleware = require('../middleware/admin');

router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [summary, daily] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE feedback = 'positive') AS positive,
           COUNT(*) FILTER (WHERE feedback = 'negative') AS negative,
           COUNT(*) FILTER (WHERE feedback = 'negative' AND feedback_note IS NOT NULL AND feedback_note != '') AS negative_with_note
         FROM messages
         WHERE feedback IS NOT NULL`
      ),
      pool.query(
        `SELECT
           DATE_TRUNC('day', created_at)::date AS day,
           COUNT(*) FILTER (WHERE feedback = 'positive') AS positive,
           COUNT(*) FILTER (WHERE feedback = 'negative') AS negative
         FROM messages
         WHERE feedback IS NOT NULL
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE_TRUNC('day', created_at)
         ORDER BY day DESC`
      ),
    ]);

    res.json({
      summary: {
        positive:           Number(summary.rows[0].positive),
        negative:           Number(summary.rows[0].negative),
        negativeWithNote:   Number(summary.rows[0].negative_with_note),
      },
      daily: daily.rows.map((r) => ({
        day:      r.day,
        positive: Number(r.positive),
        negative: Number(r.negative),
      })),
    });
  } catch (err) {
    console.error('[feedback] stats error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

- [ ] **Step 2: Verificar que o `require` de adminMiddleware não conflita**

O arquivo já importa `authMiddleware`. O `adminMiddleware` deve ser adicionado no topo do arquivo:

```javascript
const adminMiddleware = require('../middleware/admin');
```

Verificar se já existe essa linha. Se não, adicionar logo após as outras declarações `require`.

- [ ] **Step 3: Testar o endpoint**

```bash
curl -H "Authorization: Bearer <admin-token>" http://localhost:3001/feedback/stats
# Esperado:
# {
#   "summary": { "positive": 12, "negative": 5, "negativeWithNote": 3 },
#   "daily": [{ "day": "2026-05-02", "positive": 1, "negative": 0 }, ...]
# }
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/feedback.js
git commit -m "feat: endpoint GET /feedback/stats para admins"
```

---

## Task 3: Backend — Correcao genérica quando nota está vazia

**Files:**
- Modify: `backend/src/routes/feedback.js`

Quando o médico clica "Pular explicação", `note` chega vazia. O sistema atualmente não cria nenhum `Correcao` node. A correção: buscar o conteúdo da mensagem da IA e criar uma Correcao genérica com ele.

- [ ] **Step 1: Adicionar `content` ao `RETURNING` do UPDATE**

Localizar o `pool.query` do UPDATE em `feedback.js` e alterar o `RETURNING`:

```javascript
// ANTES:
const result = await pool.query(
  `UPDATE messages SET feedback = $1, feedback_note = $2
   WHERE id = $3
     AND session_id IN (SELECT id FROM sessions WHERE user_id = $4)
   RETURNING session_id`,
  [feedback, note || null, message_id, req.userId]
);

// DEPOIS:
const result = await pool.query(
  `UPDATE messages SET feedback = $1, feedback_note = $2
   WHERE id = $3
     AND session_id IN (SELECT id FROM sessions WHERE user_id = $4)
   RETURNING session_id, content`,
  [feedback, note || null, message_id, req.userId]
);
```

- [ ] **Step 2: Passar `messageContent` para `applyKnowledgeFeedback`**

Logo após o query, ajustar a chamada:

```javascript
const sessionId = result.rows[0].session_id;
const messageContent = result.rows[0].content;

applyKnowledgeFeedback(sessionId, feedback, note, messageContent).catch((err) =>
  console.error('[feedback] erro ao aplicar no grafo:', err.message)
);
```

- [ ] **Step 3: Atualizar assinatura e lógica de `applyKnowledgeFeedback`**

Localizar a função `applyKnowledgeFeedback` e alterar:

```javascript
// ANTES:
async function applyKnowledgeFeedback(sessionId, feedback, note) {
  // ...
  if (note && note.trim().length > 0) {
    const keywords = extractKeywords(note);
    await session.run(
      `CREATE (c:Correcao { ... nota: $nota ... })`,
      { sessionId, nota: note.trim(), keywords, now: new Date().toISOString() }
    );
  }
}

// DEPOIS (função completa):
async function applyKnowledgeFeedback(sessionId, feedback, note, messageContent) {
  if (!driver) return;
  const session = driver.session();
  try {
    if (feedback === 'positive') {
      await session.run(
        `MATCH (n {status: 'pending', sourceSessionId: $sessionId})
         SET n.status = 'verified', n.approvedBy = 'feedback:positive', n.approvedAt = $now`,
        { sessionId, now: new Date().toISOString() }
      );
      await session.run(
        `MATCH ()-[r:TRATA_COM {status: 'pending', sourceSessionId: $sessionId}]->()
         SET r.status = 'verified', r.approvedBy = 'feedback:positive', r.approvedAt = $now`,
        { sessionId, now: new Date().toISOString() }
      );
    } else {
      await session.run(
        `MATCH (n {status: 'pending', sourceSessionId: $sessionId}) DETACH DELETE n`,
        { sessionId }
      );

      const notaFinal = (note && note.trim().length > 0)
        ? note.trim()
        : messageContent
          ? `Resposta marcada como incorreta pelo médico: ${messageContent.trim().slice(0, 300)}`
          : null;

      if (notaFinal) {
        const keywords = extractKeywords(notaFinal);
        await session.run(
          `CREATE (c:Correcao {
             sessionId: $sessionId,
             nota: $nota,
             keywords: $keywords,
             status: 'active',
             createdAt: $now
           })`,
          { sessionId, nota: notaFinal, keywords, now: new Date().toISOString() }
        );
        console.log(`[feedback] Correcao criada para session ${sessionId}: "${notaFinal.slice(0, 60)}..."`);
      }
    }
  } finally {
    await session.close();
  }
}
```

- [ ] **Step 4: Testar o fluxo "Pular explicação"**

1. No frontend, enviar um caso e clicar 👎
2. Clicar "Pular explicação" (sem digitar nada)
3. No log do backend, verificar: `[feedback] Correcao criada para session ... "Resposta marcada como incorreta..."`
4. No Neo4j Browser: `MATCH (c:Correcao) RETURN c ORDER BY c.createdAt DESC LIMIT 5`

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/feedback.js
git commit -m "feat: Correcao genérica criada quando feedback negativo sem nota"
```

---

## Task 4: Frontend — Funções de API para admin feedbacks e stats

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Adicionar funções ao final de api.js (antes do último export se houver)**

```javascript
// ─────── ADMIN FEEDBACKS ──────────────
export async function getAdminFeedbacks() {
  const res = await fetch(`${BASE_URL}/admin/feedbacks`, {
    headers: { ...authHeaders() },
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar correções.');
  return res.json();
}

export async function deactivateAdminFeedback(nodeId) {
  const res = await fetch(`${BASE_URL}/admin/feedbacks/${encodeURIComponent(nodeId)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao desativar correção.');
  return res.json();
}

export async function getFeedbackStats() {
  const res = await fetch(`${BASE_URL}/feedback/stats`, {
    headers: { ...authHeaders() },
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar estatísticas.');
  return res.json();
}
```

- [ ] **Step 2: Verificar que BASE_URL e authHeaders já estão definidos no arquivo**

São definidos no início do arquivo. Não duplicar.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/api.js
git commit -m "feat: funções de API para gestão de correções e stats de feedback"
```

---

## Task 5: Frontend — Seção de Estatísticas em AdminKnowledge

**Files:**
- Modify: `frontend/src/pages/AdminKnowledge.jsx`
- Modify: `frontend/src/pages/AdminKnowledge.module.scss`

- [ ] **Step 1: Importar as novas funções no topo de AdminKnowledge.jsx**

Localizar a linha de imports de `api.js` e adicionar `getFeedbackStats`:

```javascript
import { getPendingKnowledge, approveKnowledge, rejectKnowledge, listDocuments, uploadDocument, getFeedbackStats, getAdminFeedbacks, deactivateAdminFeedback } from '../services/api';
```

- [ ] **Step 2: Adicionar estado para stats e correções no componente**

Dentro do componente, junto dos outros `useState`:

```javascript
const [stats, setStats] = useState(null);
const [corrections, setCorrections] = useState([]);
const [loadingStats, setLoadingStats] = useState(true);
const [loadingCorrections, setLoadingCorrections] = useState(true);
```

- [ ] **Step 3: Carregar stats e correções no useEffect inicial**

Localizar o `useEffect` que carrega dados e adicionar as novas chamadas:

```javascript
useEffect(() => {
  // ... cargas existentes (pending, documents) ...

  getFeedbackStats()
    .then(setStats)
    .catch(() => {})
    .finally(() => setLoadingStats(false));

  getAdminFeedbacks()
    .then((data) => setCorrections(data.corrections))
    .catch(() => {})
    .finally(() => setLoadingCorrections(false));
}, []);
```

- [ ] **Step 4: Adicionar handler de desativação**

```javascript
async function handleDeactivate(nodeId) {
  try {
    await deactivateAdminFeedback(nodeId);
    setCorrections((prev) =>
      prev.map((c) => (c.nodeId === nodeId ? { ...c, status: 'inactive' } : c))
    );
  } catch (err) {
    alert(err.message);
  }
}
```

- [ ] **Step 5: Adicionar seção de Stats no JSX**

Adicionar antes ou depois das seções existentes no return do componente:

```jsx
{/* ── ESTATÍSTICAS DE FEEDBACK ── */}
<section className={styles.section}>
  <h2 className={styles.sectionTitle}>Estatísticas de Feedback</h2>
  {loadingStats ? (
    <p className={styles.loading}>Carregando...</p>
  ) : stats ? (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <span className={styles.statValue}>{stats.summary.positive}</span>
        <span className={styles.statLabel}>👍 Positivos</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statValue}>{stats.summary.negative}</span>
        <span className={styles.statLabel}>👎 Negativos</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statValue}>{stats.summary.negativeWithNote}</span>
        <span className={styles.statLabel}>📝 Com nota</span>
      </div>
    </div>
  ) : (
    <p className={styles.empty}>Sem dados.</p>
  )}
</section>

{/* ── CORREÇÕES REGISTRADAS ── */}
<section className={styles.section}>
  <h2 className={styles.sectionTitle}>Correções Registradas ({corrections.length})</h2>
  {loadingCorrections ? (
    <p className={styles.loading}>Carregando...</p>
  ) : corrections.length === 0 ? (
    <p className={styles.empty}>Nenhuma correção registrada.</p>
  ) : (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Nota</th>
          <th>Keywords</th>
          <th>Status</th>
          <th>Data</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {corrections.map((c) => (
          <tr key={c.nodeId} className={c.status === 'inactive' ? styles.rowInactive : ''}>
            <td className={styles.correctionNota}>{c.nota?.slice(0, 120)}{c.nota?.length > 120 ? '…' : ''}</td>
            <td className={styles.correctionKeywords}>{(c.keywords || []).slice(0, 5).join(', ')}</td>
            <td>
              <span className={c.status === 'active' ? styles.badgeActive : styles.badgeInactive}>
                {c.status}
              </span>
            </td>
            <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
            <td>
              {c.status === 'active' && (
                <button
                  className={styles.btnDanger}
                  onClick={() => handleDeactivate(c.nodeId)}
                >
                  Desativar
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</section>
```

- [ ] **Step 6: Adicionar estilos ao AdminKnowledge.module.scss**

```scss
// Adicionar ao final do arquivo

.statsGrid {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.statCard {
  background: $color-surface;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 130px;
}

.statValue {
  font-size: 2rem;
  font-weight: 700;
  color: $color-accent;
}

.statLabel {
  font-size: 0.85rem;
  color: #666;
}

.correctionNota {
  max-width: 380px;
  font-size: 0.85rem;
  color: #333;
}

.correctionKeywords {
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
}

.badgeActive {
  background: #d4edda;
  color: #155724;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
}

.badgeInactive {
  background: #f8d7da;
  color: #721c24;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
}

.rowInactive {
  opacity: 0.5;
}

.loading {
  color: #888;
  font-style: italic;
  padding: 0.5rem 0;
}
```

- [ ] **Step 7: Verificar que as classes `section`, `sectionTitle`, `table`, `btnDanger`, `empty` já existem no SCSS**

Se não existirem, adicionar:

```scss
.section {
  margin-bottom: 2.5rem;
}

.sectionTitle {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: $color-text;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.5rem;
}
```

(Adaptar se os nomes forem diferentes no arquivo existente — verificar antes de adicionar.)

- [ ] **Step 8: Testar na UI**

1. Fazer login como admin
2. Navegar para `/admin/knowledge`
3. Verificar que as seções "Estatísticas de Feedback" e "Correções Registradas" aparecem
4. Verificar que o botão "Desativar" muda o status de uma correção
5. Verificar que correções inativas ficam com opacidade reduzida

- [ ] **Step 9: Commit**

```bash
git add frontend/src/pages/AdminKnowledge.jsx frontend/src/pages/AdminKnowledge.module.scss
git commit -m "feat: painel de estatísticas e gestão de correções de feedback no admin"
```

---

## Self-Review

**Spec coverage:**
- ✅ A — `GET /admin/feedbacks` + `DELETE /admin/feedbacks/:nodeId` (Task 1)
- ✅ B — `GET /feedback/stats` (Task 2)
- ✅ C — Correcao genérica quando nota vazia (Task 3)
- ✅ Funções de API no frontend (Task 4)
- ✅ UI no painel admin (Task 5)

**Placeholder scan:** Nenhum TBD ou TODO encontrado. Todos os steps têm código completo.

**Type consistency:**
- `nodeId` usado consistentemente no Neo4j elementId
- `corrections` / `setCorrections` consistente entre estado e JSX
- `applyKnowledgeFeedback(sessionId, feedback, note, messageContent)` — 4 parâmetros consistentes entre caller (Task 3 step 2) e definição (Task 3 step 3)
- `getFeedbackStats`, `getAdminFeedbacks`, `deactivateAdminFeedback` — nomes consistentes entre api.js (Task 4) e imports (Task 5)

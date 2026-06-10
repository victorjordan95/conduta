# Cinco Features Clínicas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alertas de medicação, comparador de hipóteses e encaminhamento detalhado via prompt; resumo para prontuário sob demanda; modo conduta rápida vs análise completa.

**Architecture:** Features 1/2/4 são extensões do `REVIEW_PROMPT` (zero LLM extra). Prontuário é endpoint novo `POST /sessions/:id/prontuario` com cache em colunas novas de `sessions`. Modo rápido é chamada LLM única (`streamQuick`) selecionada por param `mode` no `/analyze`, com toggle no `CaseInput`.

**Tech Stack:** Express 4, pg, OpenRouter (openai client), Jest+Supertest, React 18, Vitest, react-markdown + remark-gfm.

**Spec:** `docs/superpowers/specs/2026-06-09-clinical-features-design.md`

---

### Task 1: Prompts — alertas de medicação, comparador, encaminhamento

**Files:**
- Modify: `backend/src/services/openrouter.js` (REVIEW_PROMPT + exports)
- Test: `backend/src/__tests__/prompts.test.js` (create)

- [ ] **Step 1: Write failing test**

`backend/src/__tests__/prompts.test.js`:

```js
const { REVIEW_PROMPT, QUICK_PROMPT } = require('../services/openrouter');

describe('prompts clínicos', () => {
  it('REVIEW_PROMPT exige seção de alertas de medicação na estrutura', () => {
    expect(REVIEW_PROMPT).toContain('## Alertas de medicação');
    expect(REVIEW_PROMPT).toContain('Sem alertas relevantes para os medicamentos sugeridos');
  });

  it('REVIEW_PROMPT instrui tabela comparadora de hipóteses', () => {
    expect(REVIEW_PROMPT).toContain('| Hipótese | A favor | Contra | Como diferenciar |');
  });

  it('REVIEW_PROMPT exige encaminhamento com tipo, prioridade e justificativa', () => {
    expect(REVIEW_PROMPT).toContain('**Prioridade**');
    expect(REVIEW_PROMPT).toContain('**Justificativa**');
    expect(REVIEW_PROMPT).toContain('**Levar consigo**');
  });
});
```

(O teste de `QUICK_PROMPT` entra na Task 2 — por enquanto só os 3 acima.)

- [ ] **Step 2: Run test, verify fail**

Run: `cd backend && npx jest prompts --silent`
Expected: FAIL — `## Alertas de medicação` ausente.

- [ ] **Step 3: Edit REVIEW_PROMPT**

Em `backend/src/services/openrouter.js`, na estrutura obrigatória, trocar:

```
## Tratamento
## Orientações e critérios de retorno/encaminhamento
```

por:

```
## Tratamento
## Alertas de medicação
## Orientações e critérios de retorno/encaminhamento
```

Logo após o bloco "Medicamentos e prescrição:" (depois da última linha "- Não invente dose..."), inserir:

```
Alertas de medicação (seção ## Alertas de medicação):
- OBRIGATÓRIA sempre que a resposta contiver qualquer sugestão ou prescrição farmacológica
- Liste objetivamente, quando aplicável ao caso concreto:
  • Contraindicações dos medicamentos sugeridos
  • Interações relevantes com medicamentos em uso declarados pelo paciente
  • Ajustes necessários: idoso, gestante/lactante, função renal/hepática, comorbidades
- Se não houver alertas relevantes → escreva exatamente: "Sem alertas relevantes para os medicamentos sugeridos com os dados disponíveis."
- Sem sugestão farmacológica na resposta → omita a seção

Comparador de hipóteses (dentro de ## Diagnósticos diferenciais relevantes):
- Quando houver 2 ou mais hipóteses relevantes (incluindo a principal), apresente tabela markdown:
| Hipótese | A favor | Contra | Como diferenciar |
- Primeira linha da tabela = hipótese principal
- "Como diferenciar" = a pergunta, exame ou achado que melhor discrimina aquela hipótese das demais
- Hipótese única sem diferenciais relevantes → mantenha lista simples, sem tabela

Encaminhamento (dentro de ## Orientações e critérios de retorno/encaminhamento):
- Quando o caso indicar encaminhamento (especialista, pronto atendimento ou hospital), estruture:
  • **Tipo**: especialidade ou serviço de destino
  • **Prioridade**: eletivo | prioritário | urgente | emergência
  • **Justificativa**: razão clínica objetiva do encaminhamento
  • **Levar consigo**: exames, sinais de alerta e dados do atendimento que devem acompanhar o paciente
- Sem indicação de encaminhamento → apenas critérios objetivos de retorno
```

- [ ] **Step 4: Exportar REVIEW_PROMPT**

Última linha do arquivo:

```js
module.exports = { collectAnalysis, streamReview, buildMessages, REVIEW_PROMPT };
```

- [ ] **Step 5: Run tests (os 3 de REVIEW_PROMPT passam)**

Run: `cd backend && npx jest prompts --silent`
Expected: 3 PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/openrouter.js backend/src/__tests__/prompts.test.js
git commit -m "feat(prompt): alertas de medicacao, comparador de hipoteses e encaminhamento estruturado"
```

---

### Task 2: QUICK_PROMPT + streamQuick

**Files:**
- Modify: `backend/src/services/openrouter.js`
- Test: `backend/src/__tests__/prompts.test.js` (append)

- [ ] **Step 1: Append failing test**

```js
  it('QUICK_PROMPT define estrutura mínima da conduta rápida', () => {
    expect(QUICK_PROMPT).toContain('Hipótese provável');
    expect(QUICK_PROMPT).toContain('Encaminhar se');
    expect(QUICK_PROMPT).toContain('encaminhamento urgente');
  });
```

Run: `cd backend && npx jest prompts --silent` → FAIL (QUICK_PROMPT undefined).

- [ ] **Step 2: Adicionar QUICK_PROMPT em openrouter.js** (após REVIEW_PROMPT)

```js
const QUICK_PROMPT = `Você é um assistente clínico para médicos generalistas em USF e pronto atendimento.
Modo CONDUTA RÁPIDA: o médico precisa do essencial para agir agora em um caso simples.

Estrutura da resposta (markdown enxuto, sem seções ##):
**Hipótese provável:** ...
**Conduta:** ...
**Prescrição:** ... (somente se seguro e apropriado; nome, apresentação, dose, via, frequência, duração)
**Alerta principal:** ... (contraindicação ou interação mais relevante; "Nenhum relevante com os dados disponíveis" se não houver)
**Encaminhar se:** ... (critérios objetivos de retorno ou encaminhamento)

Regras de segurança — NUNCA ignorar mesmo no modo rápido:
- Red flags ou suspeita de urgência/emergência → declare encaminhamento urgente na PRIMEIRA linha da resposta
- Paciente pediátrico sem peso informado → NÃO prescreva dose fixa; solicite o peso
- Gestante, lactante, idoso ou função renal/hepática comprometida → ajuste ou ressalva explícita
- Caso complexo demais para resposta rápida → diga isso e recomende usar a análise completa
- Tom médico-para-médico, direto. Máximo ~150 palavras fora da prescrição.`;
```

- [ ] **Step 3: Refatorar buildMessages para aceitar prompt customizado**

```js
function buildMessages(history, newMessage, neo4jContext, sessionSummary, systemPrompt = SYSTEM_PROMPT) {
  const messages = [{ role: 'system', content: systemPrompt }];
  // ...resto inalterado
```

- [ ] **Step 4: Adicionar streamQuick** (após streamReview)

```js
async function streamQuick(history, newMessage, neo4jContext, sessionSummary, res) {
  const client = getClient();
  const messages = buildMessages(history, newMessage, neo4jContext, sessionSummary, QUICK_PROMPT);

  const stream = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
    messages,
    stream: true,
    temperature: 0.2,
  });

  let fullResponse = '';
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }
  return fullResponse;
}
```

Exports:

```js
module.exports = { collectAnalysis, streamReview, streamQuick, buildMessages, REVIEW_PROMPT, QUICK_PROMPT };
```

- [ ] **Step 5: Run tests**

Run: `cd backend && npx jest prompts openrouter-build-messages --silent`
Expected: PASS (build-messages usa default — sem regressão).

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/openrouter.js backend/src/__tests__/prompts.test.js
git commit -m "feat(openrouter): QUICK_PROMPT e streamQuick para modo conduta rapida"
```

---

### Task 3: Param `mode` no /analyze

**Files:**
- Modify: `backend/src/routes/analyze.js`
- Test: `backend/src/__tests__/analyze-mode.test.js` (create)
- Fix: `backend/src/__tests__/analyze-sse.test.js` (mock desatualizado — exporta `streamAnalysis` que não existe mais; route usa `collectAnalysis`/`streamReview`)

- [ ] **Step 1: Write failing tests**

`backend/src/__tests__/analyze-mode.test.js`:

```js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pg');
const app = require('../app');

jest.mock('../services/stripe', () => ({
  customers: { list: jest.fn(), create: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
}));

jest.mock('../services/openrouter', () => ({
  collectAnalysis: jest.fn().mockResolvedValue('analise interna mock'),
  streamReview: jest.fn(async (userCase, firstAnalysis, res) => {
    res.write('data: {"content":"resposta completa mock"}\n\n');
    return 'resposta completa mock';
  }),
  streamQuick: jest.fn(async (history, content, ctx, summary, res) => {
    res.write('data: {"content":"resposta rapida mock"}\n\n');
    return 'resposta rapida mock';
  }),
  buildMessages: jest.fn(),
}));

jest.mock('../services/knowledge-extractor', () => ({
  extractAndPersist: jest.fn().mockResolvedValue(null),
}));
jest.mock('../services/session-summarizer', () => ({
  generateAndSave: jest.fn().mockResolvedValue(null),
}));
jest.mock('../services/embeddings', () => ({
  embed: jest.fn().mockResolvedValue([]),
}));
jest.mock('../services/neo4j-search', () => ({
  searchClinicalContext: jest.fn().mockResolvedValue(null),
  searchFollowUpContext: jest.fn().mockResolvedValue(null),
}));
jest.mock('../services/case-search', () => ({
  searchSimilarCases: jest.fn().mockResolvedValue(null),
}));

const { collectAnalysis, streamReview, streamQuick } = require('../services/openrouter');

let token;
let sessionId;

beforeAll(async () => {
  require('dotenv').config();
  const hash = await bcrypt.hash('senha123', 10);
  const userRes = await pool.query(
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, $2, $3) RETURNING id`,
    ['analyze_mode_test@conduta.dev', 'Dr. Mode', hash]
  );
  const userId = userRes.rows[0].id;
  const svRes = await pool.query('SELECT session_version FROM users WHERE id = $1', [userId]);
  token = jwt.sign({ sub: userId, sv: svRes.rows[0].session_version }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const sessRes = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, $2) RETURNING id`,
    [userId, 'Sessão Modo']
  );
  sessionId = sessRes.rows[0].id;
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = 'analyze_mode_test@conduta.dev'`);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /analyze — param mode', () => {
  it('mode inválido retorna 400', async () => {
    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ session_id: sessionId, content: 'caso', mode: 'turbo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/mode/);
  });

  it('mode=rapida usa streamQuick e NÃO chama collectAnalysis', async () => {
    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ session_id: sessionId, content: 'caso rápido', mode: 'rapida' });
    expect(res.status).toBe(200);
    expect(streamQuick).toHaveBeenCalled();
    expect(collectAnalysis).not.toHaveBeenCalled();
    expect(streamReview).not.toHaveBeenCalled();
  });

  it('sem mode usa pipeline completo (collectAnalysis + streamReview)', async () => {
    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ session_id: sessionId, content: 'caso completo' });
    expect(res.status).toBe(200);
    expect(collectAnalysis).toHaveBeenCalled();
    expect(streamReview).toHaveBeenCalled();
    expect(streamQuick).not.toHaveBeenCalled();
  });
});
```

Run: `cd backend && npx jest analyze-mode --silent`
Expected: FAIL (400 não implementado; streamQuick nunca chamado).
Nota: exige PostgreSQL local rodando (docker-compose) — `AggregateError` sem DB é ambiente, não código.

- [ ] **Step 2: Implementar em analyze.js**

Trocar o início do handler:

```js
  const { session_id, content, mode = 'completa' } = req.body;

  if (!session_id || !content) {
    return res.status(400).json({ error: 'session_id e content são obrigatórios.' });
  }

  if (!['rapida', 'completa'].includes(mode)) {
    return res.status(400).json({ error: "mode deve ser 'rapida' ou 'completa'." });
  }
```

Import: `const { collectAnalysis, streamReview, streamQuick } = require('../services/openrouter');`

Trocar o bloco das fases 1/2:

```js
    let fullReview;
    if (mode === 'rapida') {
      // ── Modo conduta rápida: chamada única streaming ──
      fullReview = await streamQuick(history, content, context, summaryForStream, res).catch((err) => {
        console.error('[analyze] quick error:', err.message);
        return null;
      });
    } else {
      // ── Fase 1: análise primária silenciosa (contexto interno) ──
      const firstAnalysis = await collectAnalysis(history, content, context, summaryForStream);

      // ── Fase 2: revisão final — única resposta visível ao usuário ──
      fullReview = await streamReview(content, firstAnalysis || '', res, history).catch((err) => {
        console.error('[analyze] review error:', err.message);
        return null;
      });
    }
```

(`if (fullReview) {...}` segue igual — só remover o `const` da declaração antiga.)

- [ ] **Step 3: Corrigir mock de analyze-sse.test.js**

Substituir o mock de openrouter por:

```js
jest.mock('../services/openrouter', () => ({
  collectAnalysis: jest.fn().mockResolvedValue('analise interna mock'),
  streamReview: jest.fn(async (userCase, firstAnalysis, res) => {
    res.write('data: {"content":"resposta mock"}\n\n');
    return 'resposta mock';
  }),
  streamQuick: jest.fn(),
  buildMessages: jest.fn(),
}));
```

E adicionar mock faltante de `searchFollowUpContext` no mock de neo4j-search (sessão de teste tem histórico → rota chama follow-up):

```js
jest.mock('../services/neo4j-search', () => ({
  searchClinicalContext: jest.fn().mockResolvedValue(null),
  searchFollowUpContext: jest.fn().mockResolvedValue(null),
}));
```

- [ ] **Step 4: Run tests**

Run: `cd backend && npx jest analyze --silent`
Expected: analyze-mode 3 PASS, analyze-sse PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/analyze.js backend/src/__tests__/analyze-mode.test.js backend/src/__tests__/analyze-sse.test.js
git commit -m "feat(analyze): param mode com pipeline rapido de chamada unica"
```

---

### Task 4: Migration + serviço de prontuário

**Files:**
- Create: `backend/src/db/migrations/014_session_prontuario.sql`
- Create: `backend/src/services/prontuario.js`

- [ ] **Step 1: Migration**

`backend/src/db/migrations/014_session_prontuario.sql`:

```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS prontuario TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS prontuario_msg_count INTEGER;
```

Run: `cd backend && node src/db/migrate.js`
Expected: `Migration executada: 014_session_prontuario.sql` (todas as anteriores são idempotentes? — se alguma anterior falhar por já existir, verificar; o runner roda todas sempre, e as existentes usam IF NOT EXISTS).

- [ ] **Step 2: Serviço**

`backend/src/services/prontuario.js`:

```js
const OpenAI = require('openai');

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('[prontuario] OPENROUTER_API_KEY não definido');
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Conduta',
    },
  });
}

const PRONTUARIO_PROMPT = `Você é um médico redigindo evolução para prontuário eletrônico.
A partir da conversa clínica abaixo, produza um resumo objetivo de evolução médica com os blocos:

QUEIXA PRINCIPAL:
DADOS RELEVANTES:
HIPÓTESE DIAGNÓSTICA:
CONDUTA:
ORIENTAÇÕES:

Regras:
- Texto pronto para colar em prontuário eletrônico: SEM markdown, sem #, sem negrito, sem tabelas
- Linguagem técnica padrão de registro médico, frases curtas e objetivas
- Inclua apenas informações presentes na conversa — não invente dados
- Se um bloco não tiver informação, escreva "Não registrado."
- Máximo ~200 palavras`;

async function gerarResumoProntuario(messages) {
  const client = getClient();

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'MÉDICO (caso/pergunta)' : 'ANÁLISE'}:\n${m.content}`)
    .join('\n\n---\n\n')
    .slice(0, 12000);

  const completion = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
    messages: [
      { role: 'system', content: PRONTUARIO_PROMPT },
      { role: 'user', content: transcript },
    ],
    stream: false,
    temperature: 0.2,
  });

  const texto = completion.choices[0]?.message?.content?.trim();
  if (!texto) {
    throw new Error('[prontuario] resposta vazia do modelo');
  }
  return texto;
}

module.exports = { gerarResumoProntuario, PRONTUARIO_PROMPT };
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/db/migrations/014_session_prontuario.sql backend/src/services/prontuario.js
git commit -m "feat(prontuario): migration e servico de geracao de resumo de evolucao"
```

---

### Task 5: Rota POST /sessions/:id/prontuario

**Files:**
- Modify: `backend/src/routes/sessions.js`
- Test: `backend/src/__tests__/sessions-prontuario.test.js` (create)

- [ ] **Step 1: Write failing tests**

`backend/src/__tests__/sessions-prontuario.test.js`:

```js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pg');
const app = require('../app');

jest.mock('../services/stripe', () => ({
  customers: { list: jest.fn(), create: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
}));

jest.mock('../services/prontuario', () => ({
  gerarResumoProntuario: jest.fn().mockResolvedValue('QUEIXA PRINCIPAL: febre.\nCONDUTA: sintomáticos.'),
}));

const { gerarResumoProntuario } = require('../services/prontuario');

let token;
let sessionComResposta;
let sessionVazia;

beforeAll(async () => {
  require('dotenv').config();
  const hash = await bcrypt.hash('senha123', 10);
  const userRes = await pool.query(
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, $2, $3) RETURNING id`,
    ['prontuario_test@conduta.dev', 'Dr. Prontuário', hash]
  );
  const userId = userRes.rows[0].id;
  const svRes = await pool.query('SELECT session_version FROM users WHERE id = $1', [userId]);
  token = jwt.sign({ sub: userId, sv: svRes.rows[0].session_version }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const s1 = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Com resposta') RETURNING id`,
    [userId]
  );
  sessionComResposta = s1.rows[0].id;
  await pool.query(`INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', 'caso febre')`, [sessionComResposta]);
  await pool.query(`INSERT INTO messages (session_id, role, content) VALUES ($1, 'assistant', 'análise da febre')`, [sessionComResposta]);

  const s2 = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, 'Vazia') RETURNING id`,
    [userId]
  );
  sessionVazia = s2.rows[0].id;
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = 'prontuario_test@conduta.dev'`);
});

beforeEach(() => {
  jest.clearAllMocks();
  gerarResumoProntuario.mockResolvedValue('QUEIXA PRINCIPAL: febre.\nCONDUTA: sintomáticos.');
});

describe('POST /sessions/:id/prontuario', () => {
  it('404 para sessão inexistente', async () => {
    const res = await request(app)
      .post('/sessions/00000000-0000-0000-0000-000000000000/prontuario')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('400 para sessão sem resposta do assistente', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionVazia}/prontuario`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('gera, salva e retorna cached=false na primeira chamada', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionComResposta}/prontuario`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false);
    expect(res.body.prontuario).toContain('QUEIXA PRINCIPAL');
    expect(gerarResumoProntuario).toHaveBeenCalledTimes(1);
  });

  it('segunda chamada sem mensagens novas retorna cache sem chamar LLM', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionComResposta}/prontuario`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(true);
    expect(gerarResumoProntuario).not.toHaveBeenCalled();
  });

  it('mensagem nova invalida o cache', async () => {
    await pool.query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'assistant', 'nova análise')`,
      [sessionComResposta]
    );
    const res = await request(app)
      .post(`/sessions/${sessionComResposta}/prontuario`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false);
    expect(gerarResumoProntuario).toHaveBeenCalledTimes(1);
  });
});
```

Run: `cd backend && npx jest sessions-prontuario --silent` → FAIL (404 da rota inexistente).

- [ ] **Step 2: Implementar rota em sessions.js**

Import no topo: `const { gerarResumoProntuario } = require('../services/prontuario');`

Antes do `module.exports`:

```js
router.post('/:id/prontuario', async (req, res) => {
  try {
    const sessionResult = await pool.query(
      'SELECT id, prontuario, prontuario_msg_count FROM sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    const msgResult = await pool.query(
      `SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    const messages = msgResult.rows;

    if (!messages.some((m) => m.role === 'assistant')) {
      return res.status(400).json({ error: 'Sessão ainda não possui análise para resumir.' });
    }

    const sessao = sessionResult.rows[0];
    if (sessao.prontuario && sessao.prontuario_msg_count === messages.length) {
      return res.json({ prontuario: sessao.prontuario, cached: true });
    }

    const prontuario = await gerarResumoProntuario(messages);
    await pool.query(
      'UPDATE sessions SET prontuario = $1, prontuario_msg_count = $2 WHERE id = $3',
      [prontuario, messages.length, req.params.id]
    );
    res.json({ prontuario, cached: false });
  } catch (err) {
    console.error('[sessions] prontuario:', err.message);
    res.status(500).json({ error: 'Erro ao gerar resumo para prontuário.' });
  }
});
```

- [ ] **Step 3: Run tests**

Run: `cd backend && npx jest sessions-prontuario --silent`
Expected: 5 PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/sessions.js backend/src/__tests__/sessions-prontuario.test.js
git commit -m "feat(sessions): rota POST /sessions/:id/prontuario com cache por contagem de mensagens"
```

---

### Task 6: Frontend — api.js (mode + gerarProntuario) e toggle no CaseInput

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/components/CaseInput.jsx`
- Modify: `frontend/src/components/CaseInput.module.scss`
- Test: `frontend/src/__tests__/CaseInput.test.jsx` (update + novos)

- [ ] **Step 1: Atualizar testes existentes + novos (failing)**

Em `CaseInput.test.jsx`, no `beforeEach`, adicionar `localStorage.clear();`.

Atualizar as 4 asserções `analyzeCase).toHaveBeenCalledWith(` existentes acrescentando o 5º argumento `'completa'`:

```js
expect(analyzeCase).toHaveBeenCalledWith(
  'abc',
  'Paciente com febre',
  expect.any(Function),
  expect.any(Function),
  'completa'
);
```

Novos testes:

```js
  it('renderiza toggle de modo com análise completa ativa por padrão', () => {
    render(<CaseInput {...defaultProps} />);
    const completa = screen.getByRole('radio', { name: /análise completa/i });
    const rapida = screen.getByRole('radio', { name: /conduta rápida/i });
    expect(completa).toHaveAttribute('aria-checked', 'true');
    expect(rapida).toHaveAttribute('aria-checked', 'false');
  });

  it('modo rápido é enviado no analyzeCase e persiste em localStorage', async () => {
    render(<CaseInput {...defaultProps} />);
    fireEvent.click(screen.getByRole('radio', { name: /conduta rápida/i }));
    fireEvent.change(screen.getByPlaceholderText(/descreva o caso/i), {
      target: { value: 'Caso simples' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analisar/i }));

    await waitFor(() => {
      expect(analyzeCase).toHaveBeenCalledWith(
        'abc',
        'Caso simples',
        expect.any(Function),
        expect.any(Function),
        'rapida'
      );
    });
    expect(localStorage.getItem('conduta_mode')).toBe('rapida');
  });
```

Run: `cd frontend && npx vitest run src/__tests__/CaseInput.test.jsx`
Expected: novos testes FAIL.

- [ ] **Step 2: api.js**

`analyzeCase` ganha 5º parâmetro:

```js
export async function analyzeCase(sessionId, content, onChunk, onSessionMsgCount, mode = 'completa') {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ session_id: sessionId, content, mode }),
  });
  // ...resto inalterado
```

Nova função (junto das funções de sessions):

```js
export async function gerarProntuario(sessionId) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/prontuario`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao gerar resumo para prontuário.');
  }
  return res.json();
}
```

- [ ] **Step 3: CaseInput.jsx**

Estado + handler:

```js
const [mode, setMode] = useState(() => {
  const saved = localStorage.getItem('conduta_mode');
  return saved === 'rapida' ? 'rapida' : 'completa';
});

function handleModeChange(novoModo) {
  setMode(novoModo);
  localStorage.setItem('conduta_mode', novoModo);
}
```

Chamada: `await analyzeCase(sessionId, textoFinal, onChunk, onSessionMsgCount, mode);`

UI — inserir entre `labelRow` e o `<form>`:

```jsx
<div className={styles.modeToggle} role="radiogroup" aria-label="Modo de análise">
  <button
    type="button"
    role="radio"
    aria-checked={mode === 'rapida'}
    className={`${styles.modeBtn}${mode === 'rapida' ? ` ${styles.modeBtnActive}` : ''}`}
    onClick={() => handleModeChange('rapida')}
    disabled={analyzing}
  >
    Conduta rápida
  </button>
  <button
    type="button"
    role="radio"
    aria-checked={mode === 'completa'}
    className={`${styles.modeBtn}${mode === 'completa' ? ` ${styles.modeBtnActive}` : ''}`}
    onClick={() => handleModeChange('completa')}
    disabled={analyzing}
  >
    Análise completa
  </button>
  <span className={styles.modeHint}>
    {mode === 'rapida'
      ? 'Resposta objetiva para casos simples'
      : 'Hipóteses, raciocínio, conduta e alertas'}
  </span>
</div>
```

- [ ] **Step 4: CaseInput.module.scss**

Adicionar (seguindo paleta existente do arquivo — conferir variáveis/cores usadas e ajustar):

```scss
.modeToggle {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.modeBtn {
  padding: 4px 12px;
  font-size: 0.8rem;
  border: 1px solid #d0d7de;
  background: transparent;
  color: #555;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: #8aa;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
}

.modeBtnActive {
  background: #0e7466;
  border-color: #0e7466;
  color: #fff;
}

.modeHint {
  font-size: 0.75rem;
  color: #888;
  margin-left: 8px;
}
```

(Conferir cor primária real no SCSS existente — usar a mesma do botão Analisar.)

- [ ] **Step 5: Run tests**

Run: `cd frontend && npx vitest run src/__tests__/CaseInput.test.jsx`
Expected: PASS todos.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/api.js frontend/src/components/CaseInput.jsx frontend/src/components/CaseInput.module.scss frontend/src/__tests__/CaseInput.test.jsx
git commit -m "feat(frontend): toggle conduta rapida vs analise completa no CaseInput"
```

---

### Task 7: remark-gfm para tabelas do comparador

**Files:**
- Modify: `frontend/package.json` (via npm install)
- Modify: `frontend/src/components/AnalysisResult.jsx`
- Modify: `frontend/src/components/AnalysisResult.module.scss`

- [ ] **Step 1: Instalar**

Run: `cd frontend && npm install remark-gfm`

- [ ] **Step 2: AnalysisResult.jsx**

```js
import remarkGfm from 'remark-gfm';
```

Trocar `<ReactMarkdown>{msg.content}</ReactMarkdown>` por:

```jsx
<ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
```

- [ ] **Step 3: Estilos de tabela em AnalysisResult.module.scss**

Dentro do bloco `.content` (ou criar regra aninhada):

```scss
.content {
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 0.875rem;
  }

  th,
  td {
    border: 1px solid #d8dee4;
    padding: 6px 10px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #f3f6f5;
    font-weight: 600;
  }
}
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build`
Expected: build ok.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/components/AnalysisResult.jsx frontend/src/components/AnalysisResult.module.scss
git commit -m "feat(frontend): suporte a tabelas markdown (remark-gfm) para comparador de hipoteses"
```

---

### Task 8: ProntuarioModal + botão no Dashboard

**Files:**
- Create: `frontend/src/components/ProntuarioModal.jsx`
- Create: `frontend/src/components/ProntuarioModal.module.scss`
- Modify: `frontend/src/pages/Dashboard.jsx`

- [ ] **Step 1: ProntuarioModal.jsx**

```jsx
import { useState } from 'react';
import styles from './ProntuarioModal.module.scss';

export default function ProntuarioModal({ texto, loading, error, onClose, onRetry }) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível — usuário pode selecionar manualmente
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Resumo para prontuário"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Resumo para prontuário</h2>
          <button className={styles.close} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {loading && <p className={styles.status}>Gerando resumo da evolução...</p>}

        {error && (
          <div className={styles.errorBox}>
            <p className={styles.error} role="alert">{error}</p>
            <button className={styles.retry} onClick={onRetry}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && texto && (
          <>
            <pre className={styles.texto}>{texto}</pre>
            <div className={styles.actions}>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copiado ? 'Copiado ✓' : 'Copiar texto'}
              </button>
            </div>
            <p className={styles.aviso}>
              Revise o conteúdo antes de registrar no prontuário — a responsabilidade pelo registro é do profissional.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ProntuarioModal.module.scss**

```scss
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 10px;
  max-width: 640px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.title {
  font-size: 1.05rem;
  margin: 0;
}

.close {
  border: none;
  background: transparent;
  font-size: 1rem;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;

  &:hover { color: #000; }
}

.status {
  color: #555;
  padding: 24px 0;
  text-align: center;
}

.errorBox {
  padding: 16px 0;
  text-align: center;
}

.error { color: #c0392b; margin-bottom: 12px; }

.retry,
.copyBtn {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  background: #0e7466;
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover { filter: brightness(1.08); }
}

.texto {
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.55;
  background: #f7f9f8;
  border: 1px solid #e3e8e6;
  border-radius: 8px;
  padding: 14px 16px;
  overflow-y: auto;
  margin: 0 0 14px;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.aviso {
  font-size: 0.75rem;
  color: #888;
  margin: 10px 0 0;
}
```

(Usar a mesma cor primária do projeto — conferir nos SCSS existentes.)

- [ ] **Step 3: Dashboard.jsx**

Imports:

```js
import ProntuarioModal from '../components/ProntuarioModal';
import { getSession, createSession, submitFeedback, getUsage, downloadSessionPdf, getSessionEntities, gerarProntuario } from '../services/api';
```

Estado (junto dos outros useState):

```js
const [prontuarioOpen, setProntuarioOpen] = useState(false);
const [prontuarioLoading, setProntuarioLoading] = useState(false);
const [prontuarioTexto, setProntuarioTexto] = useState(null);
const [prontuarioError, setProntuarioError] = useState(null);
```

Reset ao trocar de sessão — em `handleSelectSession` e `handleNewSession`, adicionar:

```js
setProntuarioOpen(false);
setProntuarioTexto(null);
setProntuarioError(null);
```

Handler:

```js
async function handleProntuario() {
  setProntuarioOpen(true);
  setProntuarioLoading(true);
  setProntuarioError(null);
  try {
    const { prontuario } = await gerarProntuario(activeSessionId);
    setProntuarioTexto(prontuario);
  } catch (err) {
    setProntuarioError(err.message || 'Erro ao gerar resumo.');
  } finally {
    setProntuarioLoading(false);
  }
}
```

Botão no `sessionHeader`, antes do bloco do PDF (visível quando há resposta do assistente):

```jsx
{messages.some((m) => m.role === 'assistant' && m.content) && !streaming && (
  <button
    className={styles.pdfBtn}
    onClick={handleProntuario}
    aria-label="Gerar resumo para prontuário"
  >
    ⎘ Resumo p/ prontuário
  </button>
)}
```

Modal — antes do fechamento de `<main>`:

```jsx
{prontuarioOpen && (
  <ProntuarioModal
    texto={prontuarioTexto}
    loading={prontuarioLoading}
    error={prontuarioError}
    onClose={() => setProntuarioOpen(false)}
    onRetry={handleProntuario}
  />
)}
```

- [ ] **Step 4: Run frontend tests + build**

Run: `cd frontend && npx vitest run && npm run build`
Expected: PASS, build ok.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ProntuarioModal.jsx frontend/src/components/ProntuarioModal.module.scss frontend/src/pages/Dashboard.jsx
git commit -m "feat(frontend): botao e modal de resumo para prontuario"
```

---

### Task 9: Verificação final e push

- [ ] **Step 1: Suíte backend completa**

Run: `cd backend && npx jest --silent`
Expected: PASS (testes de integração exigem PostgreSQL/Neo4j locais — docker-compose up).

- [ ] **Step 2: Suíte frontend completa + build**

Run: `cd frontend && npx vitest run && npm run build`
Expected: PASS, build ok.

- [ ] **Step 3: Atualizar CLAUDE.md (seções API/Frontend) se necessário** — mencionar `mode` no /analyze e rota prontuario.

- [ ] **Step 4: Push**

```bash
git pull --rebase && git push
```

# Controle de Custo por Sessão Longa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limitar o custo por chamada ao LLM a O(1) truncando o histórico nas últimas 6 mensagens, e exibir avisos progressivos ao médico quando a sessão cresce.

**Architecture:** Três mudanças coordenadas: (1) `openrouter.js` trunca o histórico com `slice(-MAX_HISTORY_MESSAGES)` antes de enviar ao LLM, usando o `sessionSummary` existente como âncora de contexto — quando `sessionSummary` é null (sessão nova) o histórico completo é enviado; (2) `analyze.js` emite um evento SSE `{session_msg_count}` como primeiro evento antes do conteúdo; (3) `Dashboard.jsx` recebe a contagem e renderiza banners não-bloqueantes em ≥8 e ≥16 mensagens do usuário.

**Tech Stack:** Node.js + Express (backend), React 18 + Vite + SCSS Modules (frontend), Jest/Supertest (backend tests), Vitest + Testing Library (frontend tests)

---

## File Map

| Arquivo | Mudança |
|---|---|
| `backend/src/services/openrouter.js` | Extrai `buildMessages()` pura; adiciona `MAX_HISTORY_MESSAGES = 6`; aplica `slice(-6)` condicionado ao `sessionSummary`; guarda headers SSE com `!res.headersSent` |
| `backend/src/routes/analyze.js` | Define headers SSE + emite `{session_msg_count}` antes de chamar `streamAnalysis` |
| `frontend/src/services/api.js` | Adiciona callback opcional `onSessionMsgCount` a `analyzeCase()`; parseia eventos `session_msg_count` |
| `frontend/src/components/CaseInput.jsx` | Encaminha nova prop `onSessionMsgCount` para `analyzeCase()` |
| `frontend/src/pages/Dashboard.jsx` | Estado `userMsgCount`; passa `onSessionMsgCount` para `CaseInput`; renderiza dois banners condicionais |
| `frontend/src/pages/Dashboard.module.scss` | Adiciona `.bannerAviso` (amarelo) e `.bannerCritico` (laranja) e `.bannerBtn` |
| `backend/src/__tests__/openrouter-build-messages.test.js` | Testes unitários de `buildMessages` — truncação, summary, degradação graciosa |
| `backend/src/__tests__/analyze-sse.test.js` | Teste de integração — verifica que `session_msg_count` é o primeiro evento SSE |
| `frontend/src/__tests__/Dashboard.banners.test.jsx` | Testes de componente para banners em ≥8 e ≥16 mensagens |

---

## Task 1: Extrair buildMessages e aplicar janela deslizante (openrouter.js)

**Files:**
- Modify: `backend/src/services/openrouter.js`
- Create: `backend/src/__tests__/openrouter-build-messages.test.js`

- [ ] **Step 1: Escrever o teste falhando**

Criar `backend/src/__tests__/openrouter-build-messages.test.js`:

```js
const { buildMessages } = require('../services/openrouter');
const SYSTEM_PROMPT = require('../config/system-prompt');

const MAX = 6;

describe('buildMessages', () => {
  it('inclui system prompt sempre', () => {
    const msgs = buildMessages([], 'oi', null, null);
    expect(msgs[0]).toEqual({ role: 'system', content: SYSTEM_PROMPT });
  });

  it('inclui neo4jContext como system message quando fornecido', () => {
    const msgs = buildMessages([], 'oi', 'contexto neo4j', null);
    expect(msgs[1]).toEqual({
      role: 'system',
      content: 'Contexto da base de conhecimento clínica:\ncontexto neo4j',
    });
  });

  it('inclui sessionSummary como system message quando fornecido', () => {
    const summary = { hipotese: 'Pneumonia', conduta: 'Antibióticos', alertas: ['Febre alta'] };
    const msgs = buildMessages([], 'oi', null, summary);
    const systemMsgs = msgs.filter((m) => m.role === 'system');
    expect(systemMsgs.length).toBe(2);
    expect(systemMsgs[1].content).toContain('Pneumonia');
    expect(systemMsgs[1].content).toContain('Febre alta');
  });

  it('inclui newMessage como última mensagem', () => {
    const msgs = buildMessages([], 'nova mensagem', null, null);
    expect(msgs[msgs.length - 1]).toEqual({ role: 'user', content: 'nova mensagem' });
  });

  it('envia histórico completo quando sessionSummary é null (degradação graciosa)', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`,
    }));
    const msgs = buildMessages(history, 'nova', null, null);
    const historyMsgs = msgs.filter((m) => m.role !== 'system');
    // histórico completo (10) + newMessage (1) = 11
    expect(historyMsgs.length).toBe(11);
    expect(historyMsgs[0].content).toBe('msg0');
  });

  it('trunca histórico para as últimas MAX mensagens quando sessionSummary está presente', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`,
    }));
    const summary = { hipotese: 'x', conduta: 'y', alertas: [] };
    const msgs = buildMessages(history, 'nova', null, summary);
    const historyMsgs = msgs.filter((m) => m.role !== 'system');
    // slice(-6) do history (6) + newMessage (1) = 7
    expect(historyMsgs.length).toBe(MAX + 1);
    expect(historyMsgs[0].content).toBe('msg4');
  });

  it('sessionSummary null não adiciona system message de contexto clínico', () => {
    const msgs = buildMessages([], 'oi', null, null);
    // apenas: system prompt + user message = 2
    expect(msgs.length).toBe(2);
  });
});
```

- [ ] **Step 2: Rodar o teste e verificar que falha**

```
cd backend && npx jest openrouter-build-messages --no-coverage
```

Esperado: `FAIL` — `buildMessages is not a function`.

- [ ] **Step 3: Implementar buildMessages e atualizar openrouter.js**

Substituir o conteúdo completo de `backend/src/services/openrouter.js`:

```js
const OpenAI = require('openai');
const SYSTEM_PROMPT = require('../config/system-prompt');

const MAX_HISTORY_MESSAGES = 6;

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('[openrouter] OPENROUTER_API_KEY não definido');
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

function buildMessages(history, newMessage, neo4jContext, sessionSummary) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (neo4jContext) {
    messages.push({
      role: 'system',
      content: `Contexto da base de conhecimento clínica:\n${neo4jContext}`,
    });
  }

  if (sessionSummary) {
    const alertas = (sessionSummary.alertas || []).join('; ') || 'Nenhum';
    messages.push({
      role: 'system',
      content: `Contexto clínico desta sessão:\n• Hipótese principal: ${sessionSummary.hipotese}\n• Conduta definida: ${sessionSummary.conduta}\n• Alertas ativos: ${alertas}\n\nResponda DIRETAMENTE a pergunta do médico com base neste contexto.`,
    });
  }

  // Trunca apenas quando há summary para ancorar o contexto clínico.
  // Sessões novas (summary null) têm poucos tokens — envio completo é seguro.
  const recentHistory = sessionSummary
    ? history.slice(-MAX_HISTORY_MESSAGES)
    : history;

  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: 'user', content: newMessage });

  return messages;
}

async function streamAnalysis(history, newMessage, neo4jContext, sessionSummary, res) {
  const messages = buildMessages(history, newMessage, neo4jContext, sessionSummary);

  const client = getClient();
  const MAX_RETRIES = 3;
  let stream;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      stream = await client.chat.completions.create({
        model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
        messages,
        stream: true,
      });
      break;
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 429 && attempt < MAX_RETRIES) {
        const delay = attempt * 2000;
        console.warn(`[openrouter] 429 rate limit, tentativa ${attempt}/${MAX_RETRIES}, aguardando ${delay}ms…`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }

  if (!res.headersSent) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  }

  let fullContent = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullContent += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();

  return fullContent;
}

module.exports = { streamAnalysis, buildMessages };
```

- [ ] **Step 4: Rodar os testes e verificar que passam**

```
cd backend && npx jest openrouter-build-messages --no-coverage
```

Esperado: `PASS` com 7 testes passando.

- [ ] **Step 5: Commit**

```
cd backend
git add src/services/openrouter.js src/__tests__/openrouter-build-messages.test.js
git commit -m "feat(openrouter): janela deslizante MAX_HISTORY_MESSAGES=6; extrai buildMessages"
```

---

## Task 2: Emitir session_msg_count como primeiro evento SSE (analyze.js)

**Files:**
- Modify: `backend/src/routes/analyze.js`
- Create: `backend/src/__tests__/analyze-sse.test.js`

- [ ] **Step 1: Escrever o teste falhando**

Criar `backend/src/__tests__/analyze-sse.test.js`:

```js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pg');
const app = require('../app');

jest.mock('../services/openrouter', () => ({
  streamAnalysis: jest.fn(async (history, content, ctx, summary, res) => {
    res.write('data: {"content":"resposta mock"}\n\n');
    res.write('data: [DONE]\n\n');
    res.end();
    return 'resposta mock';
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
}));
jest.mock('../services/case-search', () => ({
  searchSimilarCases: jest.fn().mockResolvedValue(null),
}));

let token;
let sessionId;

beforeAll(async () => {
  require('dotenv').config();
  const hash = await bcrypt.hash('senha123', 10);
  const userRes = await pool.query(
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, $2, $3) RETURNING id`,
    ['analyze_sse_test@conduta.dev', 'Dr. SSE', hash]
  );
  const userId = userRes.rows[0].id;
  token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const sessRes = await pool.query(
    `INSERT INTO sessions (user_id, titulo) VALUES ($1, $2) RETURNING id`,
    [userId, 'Sessão de Teste SSE']
  );
  sessionId = sessRes.rows[0].id;

  // Inserir 3 pares user/assistant para testar contagem
  for (let i = 0; i < 3; i++) {
    await pool.query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', $2)`,
      [sessionId, `pergunta ${i}`]
    );
    await pool.query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'assistant', $2)`,
      [sessionId, `resposta ${i}`]
    );
  }
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = 'analyze_sse_test@conduta.dev'`);
  await pool.end();
});

describe('POST /analyze — evento SSE session_msg_count', () => {
  it('emite session_msg_count como primeiro evento SSE antes do conteúdo', async () => {
    const res = await request(app)
      .post('/analyze')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'text/event-stream')
      .send({ session_id: sessionId, content: 'nova pergunta' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);

    const lines = res.text.split('\n').filter((l) => l.startsWith('data: '));
    expect(lines.length).toBeGreaterThan(0);

    const firstEvent = JSON.parse(lines[0].slice(6));
    // 3 mensagens user já no histórico antes desta nova
    expect(firstEvent).toHaveProperty('session_msg_count', 3);

    // segundo evento deve ser conteúdo, não outro metadata
    const secondEvent = JSON.parse(lines[1].slice(6));
    expect(secondEvent).toHaveProperty('content');
  });
});
```

- [ ] **Step 2: Rodar o teste e verificar que falha**

```
cd backend && npx jest analyze-sse --no-coverage
```

Esperado: `FAIL` — primeiro evento SSE é `{"content":"resposta mock"}`, não `{"session_msg_count":3}`.

- [ ] **Step 3: Modificar analyze.js para emitir session_msg_count antes do stream**

Localizar em `backend/src/routes/analyze.js` as linhas que definem `summaryForStream` e chamam `streamAnalysis` (atualmente linhas 68-70):

```js
    const summaryForStream = !isFirstMessage ? sessionSummary : null;

    const fullResponse = await streamAnalysis(history, content, context, summaryForStream, res);
```

Substituir por:

```js
    const summaryForStream = !isFirstMessage ? sessionSummary : null;

    const sessionMsgCount = history.filter((m) => m.role === 'user').length;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ session_msg_count: sessionMsgCount })}\n\n`);

    const fullResponse = await streamAnalysis(history, content, context, summaryForStream, res);
```

- [ ] **Step 4: Rodar o teste e verificar que passa**

```
cd backend && npx jest analyze-sse --no-coverage
```

Esperado: `PASS`.

- [ ] **Step 5: Rodar todos os testes de backend para verificar regressões**

```
cd backend && npx jest --no-coverage
```

Esperado: todos os testes passam.

- [ ] **Step 6: Commit**

```
cd backend
git add src/routes/analyze.js src/__tests__/analyze-sse.test.js
git commit -m "feat(analyze): emite session_msg_count como primeiro evento SSE"
```

---

## Task 3: Parsear session_msg_count no handler SSE de api.js e encaminhar via CaseInput

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/components/CaseInput.jsx`

- [ ] **Step 1: Atualizar analyzeCase em api.js**

Localizar a função `analyzeCase` (linha 104 de `frontend/src/services/api.js`) e substituí-la inteiramente:

```js
export async function analyzeCase(sessionId, content, onChunk, onSessionMsgCount) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ session_id: sessionId, content }),
  });

  await checkUnauthorized(res);
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || 'Limite de análises atingido.');
    err.code = 'USAGE_LIMIT';
    err.usage = { used: data.used, limit: data.limit, plan: data.plan };
    throw err;
  }
  if (!res.ok) throw new Error('Erro ao processar análise.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n').filter((l) => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.session_msg_count !== undefined) {
          onSessionMsgCount?.(parsed.session_msg_count);
        } else if (parsed.content) {
          onChunk(parsed.content);
        }
      } catch {
        // ignora linha malformada
      }
    }
  }
}
```

- [ ] **Step 2: Atualizar CaseInput.jsx para encaminhar onSessionMsgCount**

Em `frontend/src/components/CaseInput.jsx`, localizar a assinatura da função (linha 5):

```js
export default function CaseInput({ sessionId, usage, onAnalysisStart, onChunk, onAnalysisDone, onUsageUpdate }) {
```

Substituir por:

```js
export default function CaseInput({ sessionId, usage, onAnalysisStart, onChunk, onAnalysisDone, onUsageUpdate, onSessionMsgCount }) {
```

E localizar a chamada de `analyzeCase` (linha 21):

```js
      await analyzeCase(sessionId, content.trim(), onChunk);
```

Substituir por:

```js
      await analyzeCase(sessionId, content.trim(), onChunk, onSessionMsgCount);
```

- [ ] **Step 3: Rodar os testes de frontend existentes**

```
cd frontend && npx vitest run
```

Esperado: todos os testes existentes passam (a mudança é aditiva).

- [ ] **Step 4: Commit**

```
cd frontend
git add src/services/api.js src/components/CaseInput.jsx
git commit -m "feat(api): parseia session_msg_count no SSE; encaminha via CaseInput"
```

---

## Task 4: Banners de aviso no Dashboard.jsx e estilos SCSS

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`
- Modify: `frontend/src/pages/Dashboard.module.scss`
- Create: `frontend/src/__tests__/Dashboard.banners.test.jsx`

- [ ] **Step 1: Escrever os testes falhando**

Criar `frontend/src/__tests__/Dashboard.banners.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { plan: 'free', coachmarks_welcome_seen: true, coachmarks_session_seen: true },
    token: 'fake-token',
    saveAuth: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

vi.mock('../services/api', () => ({
  getSessions: vi.fn().mockResolvedValue([]),
  getSession: vi.fn().mockResolvedValue({
    session: { id: 'sess1', titulo: 'Caso Teste', summary: null },
    messages: [],
  }),
  getUsage: vi.fn().mockResolvedValue({ used: 0, limit: 15 }),
  analyzeCase: vi.fn(),
  submitFeedback: vi.fn(),
  downloadSessionPdf: vi.fn(),
  getSessionEntities: vi.fn().mockResolvedValue({ diagnosticos: [], medicamentos: [] }),
}));

vi.mock('../components/Sidebar', () => ({
  default: ({ onSelectSession }) => (
    <button onClick={() => onSelectSession('sess1')}>Sessão Teste</button>
  ),
}));

vi.mock('../components/CaseInput', () => ({
  default: ({ onSessionMsgCount }) => (
    <div data-testid="case-input">
      <button onClick={() => onSessionMsgCount(8)}>simular 8 msg</button>
      <button onClick={() => onSessionMsgCount(16)}>simular 16 msg</button>
    </div>
  ),
}));

vi.mock('../components/AnalysisResult', () => ({ default: () => <div /> }));
vi.mock('../components/UsageCounter', () => ({ default: () => null }));
vi.mock('../components/Coachmark', () => ({ default: () => null }));

import Dashboard from '../pages/Dashboard';

describe('Dashboard — banners de sessão longa', () => {
  it('não mostra banner quando userMsgCount < 8', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Sessão Teste'));
    await waitFor(() => screen.getByTestId('case-input'));

    expect(screen.queryByText(/Contexto longo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nova sessão/i)).not.toBeInTheDocument();
  });

  it('mostra banner amarelo quando userMsgCount >= 8 e < 16', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Sessão Teste'));
    await waitFor(() => screen.getByTestId('case-input'));

    fireEvent.click(screen.getByText('simular 8 msg'));

    expect(screen.getByText(/Contexto longo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nova sessão/i)).not.toBeInTheDocument();
  });

  it('mostra banner laranja com botão Nova sessão quando userMsgCount >= 16', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Sessão Teste'));
    await waitFor(() => screen.getByTestId('case-input'));

    fireEvent.click(screen.getByText('simular 16 msg'));

    expect(screen.getByText(/Nova sessão/i)).toBeInTheDocument();
    expect(screen.queryByText(/Contexto longo/i)).not.toBeInTheDocument();
  });

  it('botão Nova sessão limpa a sessão ativa', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Sessão Teste'));
    await waitFor(() => screen.getByTestId('case-input'));
    fireEvent.click(screen.getByText('simular 16 msg'));

    fireEvent.click(screen.getByText('Nova sessão'));

    expect(screen.queryByTestId('case-input')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar o teste e verificar que falha**

```
cd frontend && npx vitest run Dashboard.banners
```

Esperado: `FAIL` — banners não existem ainda.

- [ ] **Step 3: Adicionar estado userMsgCount ao Dashboard**

Localizar o bloco de `useState` no início do componente `Dashboard` (linha 94 de `frontend/src/pages/Dashboard.jsx`):

```js
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage] = useState(null);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showSessionTour, setShowSessionTour] = useState(false);
```

Substituir por:

```js
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage] = useState(null);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showSessionTour, setShowSessionTour] = useState(false);
  const [userMsgCount, setUserMsgCount] = useState(0);
```

- [ ] **Step 4: Resetar userMsgCount ao trocar de sessão**

Localizar em `handleSelectSession` o bloco de reset (linha 131 de `Dashboard.jsx`):

```js
    setActiveSessionId(id);
    setActiveSession(null);
    setMessages([]);
    setStreaming(false);
    setLoadingHistory(true);
```

Substituir por:

```js
    setActiveSessionId(id);
    setActiveSession(null);
    setMessages([]);
    setStreaming(false);
    setLoadingHistory(true);
    setUserMsgCount(0);
```

- [ ] **Step 5: Adicionar banners e prop onSessionMsgCount ao CaseInput no return**

Localizar o bloco `<CaseInput ... />` no return do Dashboard (linha 284 de `Dashboard.jsx`):

```jsx
            <CaseInput
              sessionId={activeSessionId}
              usage={usage}
              onUsageUpdate={(updatedUsage) => setUsage(updatedUsage)}
              onAnalysisStart={(userContent) => {
```

Substituir o bloco completo `<CaseInput ... />` (da tag de abertura até o `/>` de fechamento) por:

```jsx
            {userMsgCount >= 16 && (
              <div className={styles.bannerCritico}>
                <span>Sessão longa — considere iniciar uma nova sessão para manter a precisão das respostas.</span>
                <button
                  className={styles.bannerBtn}
                  onClick={() => {
                    setActiveSessionId(null);
                    setActiveSession(null);
                    setMessages([]);
                    setUserMsgCount(0);
                  }}
                >
                  Nova sessão
                </button>
              </div>
            )}
            {userMsgCount >= 8 && userMsgCount < 16 && (
              <div className={styles.bannerAviso}>
                Contexto longo — mensagens antigas foram resumidas para reduzir custo.
              </div>
            )}
            <CaseInput
              sessionId={activeSessionId}
              usage={usage}
              onUsageUpdate={(updatedUsage) => setUsage(updatedUsage)}
              onSessionMsgCount={(count) => setUserMsgCount(count)}
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
                const capturedId = activeSessionId;
                setStreaming(false);
                refreshUsage();
                getSession(capturedId)
                  .then((data) => {
                    setActiveSessionId((current) => {
                      if (current !== capturedId) return current;
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
                      return current;
                    });
                  })
                  .catch(console.error);
              }}
            />
```

- [ ] **Step 6: Adicionar estilos dos banners em Dashboard.module.scss**

Ao final do arquivo `frontend/src/pages/Dashboard.module.scss`, adicionar:

```scss
// ── Banners de sessão longa ─────────────────────────────────────
.bannerAviso {
  flex-shrink: 0;
  padding: 8px 20px;
  background: #fffbeb;
  border-top: 1px solid #f59e0b;
  border-bottom: 1px solid #f59e0b;
  color: #92400e;
  font-size: 0.8rem;
}

.bannerCritico {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 20px;
  background: #fff7ed;
  border-top: 1px solid #ea580c;
  border-bottom: 1px solid #ea580c;
  color: #7c2d12;
  font-size: 0.8rem;
}

.bannerBtn {
  flex-shrink: 0;
  padding: 4px 12px;
  border: 1px solid #ea580c;
  border-radius: 4px;
  background: white;
  color: #ea580c;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #fff1ec;
  }
}
```

- [ ] **Step 7: Rodar os testes e verificar que passam**

```
cd frontend && npx vitest run Dashboard.banners
```

Esperado: `PASS` com 4 testes passando.

- [ ] **Step 8: Rodar todos os testes de frontend para verificar regressões**

```
cd frontend && npx vitest run
```

Esperado: todos os testes existentes continuam passando.

- [ ] **Step 9: Commit**

```
cd frontend
git add src/pages/Dashboard.jsx src/pages/Dashboard.module.scss src/__tests__/Dashboard.banners.test.jsx
git commit -m "feat(dashboard): banners de aviso para sessões longas (>=8 e >=16 msgs)"
```

---

## Task 5: Push e verificação final

- [ ] **Step 1: Push de todos os commits**

```
git pull origin main && git push origin main
```

- [ ] **Step 2: Confirmar que ambos os projetos passam nos testes**

```
cd backend && npx jest --no-coverage
cd frontend && npx vitest run
```

Esperado: verde nos dois.

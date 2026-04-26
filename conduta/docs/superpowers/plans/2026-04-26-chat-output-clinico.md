# Chat e Outputs Clínicos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar qualidade dos outputs clínicos em três frentes: seções obrigatórias + âncora de follow-up, RAG com PDFs via Neo4j vector, e case-search real via pgvector.

**Architecture:** Frente 1 corrige o system prompt e adiciona um `session_summary` (JSON no Postgres) injetado como contexto em follow-ups. Frente 2 adiciona um pipeline de ingestão de PDF que armazena chunks como nós `DocumentoChunk` no Neo4j com embeddings para busca semântica. Frente 3 implementa `searchSimilarCases` usando pgvector para busca por similaridade coseno em casos históricos validados.

**Tech Stack:** Node.js/Express, PostgreSQL + pgvector, Neo4j 5.x (vector index nativo), OpenRouter API (text-embedding-3-small), pdf-parse, multer, React.

---

## File Map

| Ação | Arquivo |
|------|---------|
| Criar | `backend/src/db/migrations/005_session_summary.sql` |
| Criar | `backend/src/db/migrations/006_messages_embedding.sql` |
| Criar | `backend/src/db/migrate-neo4j-vector.js` |
| Modificar | `backend/src/config/system-prompt.js` |
| Criar | `backend/src/services/session-summarizer.js` |
| Criar | `backend/src/services/embeddings.js` |
| Criar | `backend/src/services/pdf-ingestor.js` |
| Modificar | `backend/src/services/neo4j-search.js` |
| Modificar | `backend/src/services/case-search.js` |
| Modificar | `backend/src/services/openrouter.js` |
| Modificar | `backend/src/routes/analyze.js` |
| Modificar | `backend/src/routes/admin-knowledge.js` |
| Modificar | `frontend/src/services/api.js` |
| Modificar | `frontend/src/pages/AdminKnowledge.jsx` |
| Modificar | `frontend/src/pages/AdminKnowledge.module.scss` |
| Criar | `backend/src/__tests__/session-summarizer.test.js` |
| Criar | `backend/src/__tests__/pdf-ingestor.test.js` |
| Criar | `backend/src/__tests__/case-search.test.js` |
| Modificar | `backend/src/__tests__/neo4j-search.test.js` |

---

## Task 1: Migração SQL — coluna summary em sessions

**Files:**
- Create: `backend/src/db/migrations/005_session_summary.sql`

- [ ] **Step 1: Criar arquivo de migração**

```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS summary JSONB;
```

- [ ] **Step 2: Executar migração**

```bash
cd conduta/backend && npm run migrate
```

Expected: `Migration executada: 005_session_summary.sql`

- [ ] **Step 3: Commit**

```bash
git add conduta/backend/src/db/migrations/005_session_summary.sql
git commit -m "feat: adiciona coluna summary em sessions"
```

---

## Task 2: System prompt — seções obrigatórias com critérios explícitos

**Files:**
- Modify: `backend/src/config/system-prompt.js`

- [ ] **Step 1: Substituir o bloco "ESTRUTURA DA RESPOSTA" pelo seguinte**

Localizar o trecho:
```
CASO SIMPLES → resposta direta em markdown, sem obrigatoriedade de todos os itens abaixo
CASO MODERADO/COMPLEXO → estruture em:
```

Substituir por:
```
CASO SIMPLES → resposta direta em markdown, sem obrigatoriedade de todos os itens abaixo
CASO MODERADO/COMPLEXO → estruture em:
```
(mantém igual)

Adicionar, logo após o bloco de seções (após `## Resumo Executivo`) e antes do separador `─────`:

```
─────────────────────────────────────
SEÇÕES OBRIGATÓRIAS
─────────────────────────────────────
As seções ## Red Flags, ## Dados que Faltam e ## Critérios de Retorno / Encaminhamento
são OBRIGATÓRIAS sempre que o caso apresentar ao menos um dos seguintes:
  • Paciente pediátrico (< 18 anos)
  • Gestante ou lactante
  • Idoso (≥ 60 anos)
  • Qualquer comorbidade mencionada (HAS, DM, ICC, DPOC, IRC, imunossupressão etc.)
  • Dois ou mais diagnósticos diferenciais relevantes
  • Qualquer sinal de alarme potencial descrito

Quando essas seções estiverem presentes e não houver conteúdo, escreva
"Nenhum identificado com os dados disponíveis" — nunca omita a seção.
```

O arquivo final do trecho modificado fica:

```js
// backend/src/config/system-prompt.js — trecho do bloco ESTRUTURA DA RESPOSTA
`─────────────────────────────────────
ESTRUTURA DA RESPOSTA
─────────────────────────────────────
Adapte o nível de detalhe à complexidade do caso.

SEMPRE use formatação Markdown completa:
  • Seções principais com ## (ex: ## Resumo Clínico)
  • Subseções com ### (ex: ### Diagnósticos Diferenciais)
  • Itens-chave em **negrito**
  • Listas com - para itens paralelos
  • Separe seções com --- quando houver mudança de bloco temático

CASO SIMPLES → resposta direta em markdown, sem obrigatoriedade de todos os itens abaixo
CASO MODERADO/COMPLEXO → estruture em:

## Resumo Clínico
## Hipóteses Diagnósticas
### Hipótese Principal
### Diagnósticos Diferenciais Relevantes
## Red Flags
## Dados que Faltam
## Exames
## Conduta Inicial
## Tratamento
### Farmacológico
### Não Farmacológico
## Prescrição
## Orientações ao Paciente
## Critérios de Retorno / Encaminhamento

---

## Resumo Executivo
- **Hipótese principal:**
- **Conduta imediata:**
- **Principal alerta:**

─────────────────────────────────────
SEÇÕES OBRIGATÓRIAS
─────────────────────────────────────
As seções ## Red Flags, ## Dados que Faltam e ## Critérios de Retorno / Encaminhamento
são OBRIGATÓRIAS sempre que o caso apresentar ao menos um dos seguintes:
  • Paciente pediátrico (< 18 anos)
  • Gestante ou lactante
  • Idoso (≥ 60 anos)
  • Qualquer comorbidade mencionada (HAS, DM, ICC, DPOC, IRC, imunossupressão etc.)
  • Dois ou mais diagnósticos diferenciais relevantes
  • Qualquer sinal de alarme potencial descrito

Quando essas seções estiverem presentes e não houver conteúdo, escreva
"Nenhum identificado com os dados disponíveis" — nunca omita a seção.`
```

- [ ] **Step 2: Commit**

```bash
git add conduta/backend/src/config/system-prompt.js
git commit -m "feat: torna seções Red Flags/Dados que Faltam/Encaminhamento obrigatórias por critério explícito"
```

---

## Task 3: session-summarizer service

**Files:**
- Create: `backend/src/services/session-summarizer.js`
- Create: `backend/src/__tests__/session-summarizer.test.js`

- [ ] **Step 1: Escrever o teste (vai falhar — arquivo não existe)**

Criar `backend/src/__tests__/session-summarizer.test.js`:

```js
const mockCreate = jest.fn();
const mockQuery = jest.fn().mockResolvedValue({ rows: [] });

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }))
);

jest.mock('../db/pg', () => ({ query: mockQuery }));

const { generateAndSave } = require('../services/session-summarizer');

beforeEach(() => {
  mockCreate.mockClear();
  mockQuery.mockClear();
});

describe('generateAndSave', () => {
  it('chama LLM com o texto da resposta e persiste summary válido', async () => {
    const summary = { hipotese: 'Pneumonia', conduta: 'Amoxicilina 500mg', alertas: ['SpO2 < 94%'] };
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(summary) } }],
    });

    await generateAndSave('session-123', 'Texto da análise clínica...');

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[1].content).toContain('Texto da análise clínica');

    expect(mockQuery).toHaveBeenCalledWith(
      'UPDATE sessions SET summary = $1 WHERE id = $2',
      [JSON.stringify(summary), 'session-123']
    );
  });

  it('não lança erro quando LLM retorna JSON inválido', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'não é json' } }],
    });

    await expect(generateAndSave('session-x', 'texto')).resolves.not.toThrow();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('não lança erro quando LLM falha', async () => {
    mockCreate.mockRejectedValue(new Error('timeout'));
    await expect(generateAndSave('session-x', 'texto')).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
cd conduta/backend && npm test -- --testPathPattern=session-summarizer --no-coverage
```

Expected: FAIL — `Cannot find module '../services/session-summarizer'`

- [ ] **Step 3: Criar o serviço**

Criar `backend/src/services/session-summarizer.js`:

```js
const OpenAI = require('openai');
const pool = require('../db/pg');

function getClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || 'missing',
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Conduta',
    },
  });
}

const EXTRACTION_PROMPT = `Extraia do texto clínico abaixo um resumo estruturado.
Retorne SOMENTE JSON válido sem texto extra, com este schema:
{"hipotese":"<hipótese principal>","conduta":"<conduta imediata>","alertas":["<alerta1>","<alerta2>"]}
Se não houver alertas, use array vazio.`;

async function generateAndSave(sessionId, responseText) {
  const client = getClient();
  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: responseText.slice(0, 4000) },
      ],
      stream: false,
    });

    const raw = completion.choices[0]?.message?.content || '';
    let summary;
    try {
      summary = JSON.parse(raw);
    } catch {
      console.warn('[summarizer] Resposta não é JSON válido — ignorando.');
      return;
    }

    await pool.query(
      'UPDATE sessions SET summary = $1 WHERE id = $2',
      [JSON.stringify(summary), sessionId]
    );
  } catch (err) {
    console.error('[summarizer] Erro (non-fatal):', err.message);
  }
}

module.exports = { generateAndSave };
```

- [ ] **Step 4: Rodar teste para confirmar que passa**

```bash
cd conduta/backend && npm test -- --testPathPattern=session-summarizer --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add conduta/backend/src/services/session-summarizer.js conduta/backend/src/__tests__/session-summarizer.test.js
git commit -m "feat: adiciona session-summarizer para extrair hipótese/conduta/alertas após primeira análise"
```

---

## Task 4: openrouter.js + analyze.js — âncora de follow-up e geração de summary

**Files:**
- Modify: `backend/src/services/openrouter.js`
- Modify: `backend/src/routes/analyze.js`

- [ ] **Step 1: Adicionar parâmetro `sessionSummary` em `streamAnalysis`**

Em `backend/src/services/openrouter.js`, alterar a assinatura da função e adicionar a injeção do summary:

```js
// Linha 26 — alterar assinatura:
async function streamAnalysis(history, newMessage, neo4jContext, sessionSummary, res) {

// Após o bloco `if (neo4jContext)` (linha ~31) e ANTES do loop `for (const msg of history)`:
  if (sessionSummary) {
    const alertas = (sessionSummary.alertas || []).join('; ') || 'Nenhum';
    messages.push({
      role: 'system',
      content: `Contexto clínico desta sessão:\n• Hipótese principal: ${sessionSummary.hipotese}\n• Conduta definida: ${sessionSummary.conduta}\n• Alertas ativos: ${alertas}\n\nResponda DIRETAMENTE a pergunta do médico com base neste contexto.`,
    });
  }
```

Arquivo completo de `openrouter.js` após a mudança:

```js
const OpenAI = require('openai');
const SYSTEM_PROMPT = require('../config/system-prompt');

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

async function streamAnalysis(history, newMessage, neo4jContext, sessionSummary, res) {
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

  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: 'user', content: newMessage });

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

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

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

module.exports = { streamAnalysis };
```

- [ ] **Step 2: Atualizar `analyze.js` para buscar summary, passá-lo ao stream e gerá-lo após primeira resposta**

Arquivo completo de `backend/src/routes/analyze.js`:

```js
const express = require('express');
const pool = require('../db/pg');
const authMiddleware = require('../middleware/auth');
const { streamAnalysis } = require('../services/openrouter');
const { searchClinicalContext } = require('../services/neo4j-search');
const { searchSimilarCases } = require('../services/case-search');
const { extractAndPersist } = require('../services/knowledge-extractor');
const { generateAndSave } = require('../services/session-summarizer');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { session_id, content } = req.body;

  if (!session_id || !content) {
    return res.status(400).json({ error: 'session_id e content são obrigatórios.' });
  }

  if (content.length > 8000) {
    return res.status(400).json({ error: 'Conteúdo não pode exceder 8000 caracteres.' });
  }

  try {
    const sessionCheck = await pool.query(
      'SELECT id, summary FROM sessions WHERE id = $1 AND user_id = $2',
      [session_id, req.userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    const sessionSummary = sessionCheck.rows[0].summary;

    const historyResult = await pool.query(
      `SELECT role, content FROM messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [session_id]
    );
    const history = historyResult.rows;

    if (history.length === 0) {
      const titulo = content.trim().slice(0, 60).replace(/\s+/g, ' ');
      await pool.query(
        'UPDATE sessions SET titulo = $1 WHERE id = $2',
        [titulo, session_id]
      );
    }

    const userMsgResult = await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3) RETURNING id',
      [session_id, 'user', content]
    );
    const userMessageId = userMsgResult.rows[0].id;

    const isFirstMessage = history.length === 0;
    const [neo4jContext, similarCases] = isFirstMessage
      ? await Promise.all([
          searchClinicalContext(content),
          searchSimilarCases(content, req.userId),
        ])
      : [null, null];

    const contextParts = [neo4jContext, similarCases].filter(Boolean);
    const context = contextParts.length > 0 ? contextParts.join('\n\n---\n\n') : null;

    const summaryForStream = !isFirstMessage ? sessionSummary : null;

    const fullResponse = await streamAnalysis(history, content, context, summaryForStream, res);

    if (fullResponse) {
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [session_id, 'assistant', fullResponse]
      );

      extractAndPersist(fullResponse, session_id).catch((err) =>
        console.error('[analyze] extractor fire-and-forget error:', err.message)
      );

      if (isFirstMessage) {
        generateAndSave(session_id, fullResponse).catch((err) =>
          console.error('[analyze] summarizer fire-and-forget error:', err.message)
        );
      }
    }

    // Frente 3 — embedding da mensagem do usuário (fire-and-forget, adicionado na Task 14)
    void userMessageId;
  } catch (err) {
    console.error('Erro no /analyze:', err.message);
    if (!res.headersSent) {
      const status = err?.status ?? err?.response?.status;
      if (status === 429) {
        return res.status(429).json({ error: 'Serviço temporariamente sobrecarregado. Tente novamente em alguns segundos.' });
      }
      res.status(500).json({ error: 'Erro ao processar análise.' });
    }
  }
});

module.exports = router;
```

- [ ] **Step 3: Rodar suite de testes para checar regressões**

```bash
cd conduta/backend && npm test -- --no-coverage
```

Expected: todos os testes passando (sem quebras)

- [ ] **Step 4: Commit**

```bash
git add conduta/backend/src/services/openrouter.js conduta/backend/src/routes/analyze.js
git commit -m "feat: injeta session summary como âncora clínica em follow-ups e gera summary após primeira análise"
```

---

## Task 5: Instalar dependências do backend para Frente 2

**Files:** `backend/package.json` (atualizado automaticamente)

- [ ] **Step 1: Instalar pdf-parse e multer**

```bash
cd conduta/backend && npm install pdf-parse multer
```

Expected: `added N packages`

- [ ] **Step 2: Commit**

```bash
git add conduta/backend/package.json conduta/backend/package-lock.json
git commit -m "chore: instala pdf-parse e multer para ingestão de PDFs"
```

---

## Task 6: embeddings.js — serviço compartilhado de embeddings

**Files:**
- Create: `backend/src/services/embeddings.js`

- [ ] **Step 1: Criar o serviço**

```js
// backend/src/services/embeddings.js
const OpenAI = require('openai');

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('[embeddings] OPENROUTER_API_KEY não definido');
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

async function embed(text) {
  const client = getClient();
  const response = await client.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

module.exports = { embed };
```

- [ ] **Step 2: Commit**

```bash
git add conduta/backend/src/services/embeddings.js
git commit -m "feat: adiciona serviço de embeddings via OpenRouter text-embedding-3-small"
```

---

## Task 7: pdf-ingestor.js + teste

**Files:**
- Create: `backend/src/services/pdf-ingestor.js`
- Create: `backend/src/__tests__/pdf-ingestor.test.js`

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `backend/src/__tests__/pdf-ingestor.test.js`:

```js
const mockNeo4jRun = jest.fn().mockResolvedValue({ records: [] });
const mockNeo4jClose = jest.fn().mockResolvedValue(undefined);
const mockEmbed = jest.fn().mockResolvedValue(new Array(1536).fill(0.1));
const mockPdfParse = jest.fn();

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockNeo4jRun, close: mockNeo4jClose })),
}));

jest.mock('../services/embeddings', () => ({ embed: mockEmbed }));

jest.mock('pdf-parse', () => mockPdfParse);

const { chunkText, ingestPDF } = require('../services/pdf-ingestor');

beforeEach(() => {
  mockNeo4jRun.mockClear();
  mockEmbed.mockClear();
  mockPdfParse.mockClear();
});

describe('chunkText', () => {
  it('divide texto em chunks com aproximadamente CHUNK_SIZE palavras', () => {
    const words = Array(1000).fill('palavra');
    const text = words.join(' ');
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c) => {
      const wordCount = c.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(420); // CHUNK_SIZE + margem
    });
  });

  it('retorna array vazio para texto vazio', () => {
    expect(chunkText('')).toEqual([]);
  });
});

describe('ingestPDF', () => {
  it('cria nós DocumentoChunk no Neo4j para cada chunk', async () => {
    mockPdfParse.mockResolvedValue({ text: Array(500).fill('dado clínico').join(' ') });

    const result = await ingestPDF(Buffer.from('fake'), 'PCDT Asma 2023');

    expect(mockEmbed).toHaveBeenCalled();
    expect(mockNeo4jRun).toHaveBeenCalled();
    const createCall = mockNeo4jRun.mock.calls.find(([q]) => q.includes('CREATE') && q.includes('DocumentoChunk'));
    expect(createCall).toBeDefined();
    expect(createCall[1].fonte).toBe('PCDT Asma 2023');
    expect(result.chunks).toBeGreaterThan(0);
    expect(result.fonte).toBe('PCDT Asma 2023');
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
cd conduta/backend && npm test -- --testPathPattern=pdf-ingestor --no-coverage
```

Expected: FAIL — `Cannot find module '../services/pdf-ingestor'`

- [ ] **Step 3: Criar o serviço**

Criar `backend/src/services/pdf-ingestor.js`:

```js
const pdfParse = require('pdf-parse');
const { randomUUID } = require('crypto');
const driver = require('../db/neo4j');
const { embed } = require('./embeddings');

const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 50;

function chunkText(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(' ');
    chunks.push(chunk);
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function ingestPDF(buffer, fonte) {
  if (!driver) throw new Error('Neo4j não configurado');

  const data = await pdfParse(buffer);
  const text = data.text.replace(/\s+/g, ' ').trim();
  const chunks = chunkText(text);

  const session = driver.session();
  let created = 0;

  try {
    for (const chunk of chunks) {
      const embedding = await embed(chunk);
      await session.run(
        `CREATE (n:DocumentoChunk {
          id: $id,
          texto: $texto,
          fonte: $fonte,
          embedding: $embedding,
          status: 'active',
          createdAt: $createdAt
        })`,
        {
          id: randomUUID(),
          texto: chunk,
          fonte,
          embedding,
          createdAt: new Date().toISOString(),
        }
      );
      created++;
    }
  } finally {
    await session.close();
  }

  return { chunks: created, fonte };
}

async function listDocuments() {
  if (!driver) return [];
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (n:DocumentoChunk {status: 'active'})
      RETURN n.fonte AS fonte, count(n) AS total
      ORDER BY n.fonte
    `);
    return result.records.map((r) => ({
      fonte: r.get('fonte'),
      chunks: r.get('total').toNumber(),
    }));
  } finally {
    await session.close();
  }
}

module.exports = { chunkText, ingestPDF, listDocuments };
```

- [ ] **Step 4: Rodar teste para confirmar que passa**

```bash
cd conduta/backend && npm test -- --testPathPattern=pdf-ingestor --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add conduta/backend/src/services/pdf-ingestor.js conduta/backend/src/__tests__/pdf-ingestor.test.js
git commit -m "feat: adiciona pdf-ingestor — parse, chunking e persistência no Neo4j com embeddings"
```

---

## Task 8: Script de migração do Neo4j — vector index

**Files:**
- Create: `backend/src/db/migrate-neo4j-vector.js`

- [ ] **Step 1: Criar script one-time**

```js
// backend/src/db/migrate-neo4j-vector.js
require('dotenv').config();
const driver = require('../db/neo4j');

async function run() {
  if (!driver) {
    console.error('NEO4J_URI não configurado — abortando.');
    process.exit(1);
  }
  const session = driver.session();
  try {
    await session.run(`
      CREATE VECTOR INDEX documentoChunkEmbedding IF NOT EXISTS
      FOR (n:DocumentoChunk) ON n.embedding
      OPTIONS { indexConfig: {
        \`vector.dimensions\`: 1536,
        \`vector.similarity_function\`: 'cosine'
      }}
    `);
    console.log('[neo4j-vector] Vector index criado (ou já existia).');
  } catch (err) {
    console.error('[neo4j-vector] Erro:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

run();
```

- [ ] **Step 2: Adicionar script ao package.json**

Em `backend/package.json`, adicionar em `"scripts"`:

```json
"migrate:neo4j-vector": "node src/db/migrate-neo4j-vector.js"
```

- [ ] **Step 3: Executar a migração (requer NEO4J_URI configurado)**

```bash
cd conduta/backend && npm run migrate:neo4j-vector
```

Expected: `[neo4j-vector] Vector index criado (ou já existia).`

- [ ] **Step 4: Commit**

```bash
git add conduta/backend/src/db/migrate-neo4j-vector.js conduta/backend/package.json
git commit -m "feat: adiciona script de migração para vector index Neo4j dos DocumentoChunk"
```

---

## Task 9: neo4j-search.js — adicionar busca semântica em DocumentoChunk

**Files:**
- Modify: `backend/src/services/neo4j-search.js`
- Modify: `backend/src/__tests__/neo4j-search.test.js`

- [ ] **Step 1: Atualizar o teste**

Substituir o conteúdo de `backend/src/__tests__/neo4j-search.test.js`:

```js
const mockRun = jest.fn().mockResolvedValue({ records: [] });
const mockClose = jest.fn().mockResolvedValue(undefined);
const mockEmbed = jest.fn().mockResolvedValue(new Array(1536).fill(0.1));

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockRun, close: mockClose })),
}));

jest.mock('../services/embeddings', () => ({ embed: mockEmbed }));

const { searchClinicalContext } = require('../services/neo4j-search');

beforeEach(() => {
  mockRun.mockClear();
  mockEmbed.mockClear();
});

describe('searchClinicalContext', () => {
  it('inclui filtro status = verified na query de diagnósticos', async () => {
    await searchClinicalContext('dor no peito paciente diabético');
    const queries = mockRun.mock.calls.map(([q]) => q);
    const keywordQuery = queries.find((q) => q.includes('Diagnostico'));
    expect(keywordQuery).toContain("status = 'verified'");
  });

  it('retorna null quando não há registros', async () => {
    const result = await searchClinicalContext('xyzabc123');
    expect(result).toBeNull();
  });

  it('chama embed para busca vetorial nos DocumentoChunk', async () => {
    await searchClinicalContext('dor no peito');
    expect(mockEmbed).toHaveBeenCalledWith('dor no peito');
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha na asserção do embed**

```bash
cd conduta/backend && npm test -- --testPathPattern=neo4j-search --no-coverage
```

Expected: FAIL — `expect(mockEmbed).toHaveBeenCalledWith('dor no peito')`

- [ ] **Step 3: Atualizar neo4j-search.js**

Substituir o conteúdo de `backend/src/services/neo4j-search.js`:

```js
const driver = require('../db/neo4j');
const { embed } = require('./embeddings');

async function searchDocumentChunks(text) {
  if (!driver) return null;
  const session = driver.session();
  try {
    const queryEmbedding = await embed(text);
    const result = await session.run(
      `CALL db.index.vector.queryNodes('documentoChunkEmbedding', 3, $embedding)
       YIELD node, score
       WHERE node.status = 'active' AND score > 0.7
       RETURN node.texto AS texto, node.fonte AS fonte, score
       ORDER BY score DESC`,
      { embedding: queryEmbedding }
    );

    if (result.records.length === 0) return null;

    const lines = result.records.map((r) => {
      const fonte = r.get('fonte');
      const texto = r.get('texto').slice(0, 500);
      return `[${fonte}]\n${texto}`;
    });

    return `Trechos relevantes de diretrizes clínicas:\n\n${lines.join('\n\n')}`;
  } catch (err) {
    console.error('[neo4j-search] vector search error (non-fatal):', err.message);
    return null;
  } finally {
    await session.close();
  }
}

async function searchClinicalContext(text) {
  if (!driver) return null;
  const session = driver.session();

  try {
    const terms = text
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .map((w) => w.toLowerCase().replace(/[^a-záéíóúãõâêîôûç]/gi, ''))
      .filter(Boolean)
      .slice(0, 12);

    if (terms.length === 0) return null;

    const [keywordResult, docContext, corrResult] = await Promise.all([
      session.run(
        `MATCH (d:Diagnostico)
         WHERE d.status = 'verified'
           AND any(t IN $terms WHERE
             toLower(d.nome) CONTAINS t OR
             any(s IN d.sinonimos WHERE toLower(s) CONTAINS t)
           )
         OPTIONAL MATCH (d)-[rel:TRATA_COM {status: 'verified'}]->(m:Medicamento {status: 'verified'})
         OPTIONAL MATCH (d)-[:TEM_RED_FLAG]->(r:RedFlag {status: 'verified'})
         OPTIONAL MATCH (d)-[:EXIGE_EXCLUSAO]->(dd:Diagnostico {status: 'verified'})
         RETURN d.nome AS diagnostico,
                d.cid AS cid,
                collect(DISTINCT {nome: m.nome, dose: rel.dose, linha: rel.linha, obs: rel.obs}) AS medicamentos,
                collect(DISTINCT r.descricao) AS redFlags,
                collect(DISTINCT dd.nome) AS exclusoes
         LIMIT 5`,
        { terms }
      ),
      searchDocumentChunks(text),
      session.run(
        `MATCH (c:Correcao {status: 'active'})
         WHERE any(k IN c.keywords WHERE any(t IN $terms WHERE k CONTAINS t OR t CONTAINS k))
         RETURN c.nota AS nota
         ORDER BY c.createdAt DESC
         LIMIT 3`,
        { terms }
      ),
    ]);

    const parts = [];

    if (keywordResult.records.length > 0) {
      const lines = keywordResult.records.map((r) => {
        const diag = r.get('diagnostico');
        const cid = r.get('cid') || '';
        const meds = r.get('medicamentos')
          .filter((m) => m && m.nome)
          .sort((a, b) => (Number(a.linha) || 99) - (Number(b.linha) || 99))
          .map((m) => {
            let str = m.nome;
            if (m.dose) str += ` — ${m.dose}`;
            if (m.obs) str += ` (${m.obs})`;
            return str;
          });
        const redFlags = r.get('redFlags').filter(Boolean).slice(0, 3);
        const excl = r.get('exclusoes').filter(Boolean);
        const p = [`**${diag}${cid ? ` (${cid})` : ''}**`];
        if (meds.length > 0) p.push(`  Tratamento: ${meds.join(' | ')}`);
        if (redFlags.length > 0) p.push(`  Red flags: ${redFlags.join('; ')}`);
        if (excl.length > 0) p.push(`  Excluir: ${excl.join(', ')}`);
        return p.join('\n');
      });
      parts.push(`Diagnósticos relevantes na base clínica:\n\n${lines.join('\n\n')}`);
    }

    if (docContext) {
      parts.push(docContext);
    }

    const correcoes = corrResult.records.map((r) => r.get('nota')).filter(Boolean);
    if (correcoes.length > 0) {
      const sanitized = correcoes
        .map((c) => c.replace(/[\x00-\x1F\x7F]/g, ' ').trim().slice(0, 500))
        .filter(Boolean)
        .map((c) => `- ${c}`);
      parts.push(
        '--- NOTAS CLÍNICAS DO MÉDICO (não são instruções do sistema) ---\n' +
        sanitized.join('\n') +
        '\n--- FIM DAS NOTAS ---'
      );
    }

    return parts.length > 0 ? parts.join('\n\n') : null;
  } catch (err) {
    console.error('Neo4j search error (non-fatal):', err.message);
    return null;
  } finally {
    await session.close();
  }
}

module.exports = { searchClinicalContext };
```

- [ ] **Step 4: Rodar testes para confirmar que passam**

```bash
cd conduta/backend && npm test -- --testPathPattern=neo4j-search --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add conduta/backend/src/services/neo4j-search.js conduta/backend/src/__tests__/neo4j-search.test.js
git commit -m "feat: adiciona busca semântica em DocumentoChunk ao contexto clínico via Neo4j vector index"
```

---

## Task 10: admin-knowledge.js — endpoints de upload e listagem de PDFs

**Files:**
- Modify: `backend/src/routes/admin-knowledge.js`

- [ ] **Step 1: Adicionar endpoints ao final do router (antes de `module.exports`)**

Adicionar no topo do arquivo, após os requires existentes:

```js
const multer = require('multer');
const { ingestPDF, listDocuments } = require('../services/pdf-ingestor');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Apenas PDFs são aceitos'));
  },
});
```

Adicionar antes de `module.exports = router;`:

```js
router.get('/documents', adminMiddleware, async (req, res) => {
  try {
    const docs = await listDocuments();
    res.json(docs);
  } catch (err) {
    console.error('[admin] listDocuments error:', err.message);
    res.status(500).json({ error: 'Erro ao listar documentos.' });
  }
});

router.post('/documents', adminMiddleware, upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'PDF não enviado.' });
  const { fonte } = req.body;
  if (!fonte?.trim()) return res.status(400).json({ error: 'Nome da fonte é obrigatório.' });

  try {
    const result = await ingestPDF(req.file.buffer, fonte.trim());
    res.json(result);
  } catch (err) {
    console.error('[admin] ingestPDF error:', err.message);
    res.status(500).json({ error: 'Erro ao processar PDF: ' + err.message });
  }
});
```

- [ ] **Step 2: Rodar testes de admin-knowledge para confirmar sem regressões**

```bash
cd conduta/backend && npm test -- --testPathPattern=admin-knowledge --no-coverage
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add conduta/backend/src/routes/admin-knowledge.js
git commit -m "feat: adiciona endpoints GET/POST /admin/knowledge/documents para upload e listagem de PDFs"
```

---

## Task 11: Frontend — API + AdminKnowledge com painel de PDFs

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/pages/AdminKnowledge.jsx`
- Modify: `frontend/src/pages/AdminKnowledge.module.scss`

- [ ] **Step 1: Adicionar funções na API**

Adicionar ao final de `frontend/src/services/api.js`:

```js
export async function listDocuments() {
  const res = await fetch(`${BASE_URL}/admin/knowledge/documents`, {
    headers: authHeaders(),
  });
  checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao listar documentos.');
  return res.json();
}

export async function uploadDocument(file, fonte) {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('fonte', fonte);
  const res = await fetch(`${BASE_URL}/admin/knowledge/documents`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao importar PDF.');
  }
  return res.json();
}
```

- [ ] **Step 2: Atualizar AdminKnowledge.jsx**

Substituir o conteúdo de `frontend/src/pages/AdminKnowledge.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { getPendingKnowledge, approveKnowledge, rejectKnowledge, listDocuments, uploadDocument } from '../services/api';
import styles from './AdminKnowledge.module.scss';

function DocumentsPanel() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fonte, setFonte] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    setLoading(true);
    try {
      const data = await listDocuments();
      setDocs(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !fonte.trim()) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const result = await uploadDocument(file, fonte.trim());
      setUploadSuccess(`${result.chunks} chunks importados de "${result.fonte}".`);
      setFonte('');
      setFile(null);
      e.target.reset();
      loadDocs();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className={styles.docsPanel}>
      <h2 className={styles.sectionTitle}>Documentos Clínicos (RAG)</h2>

      <form className={styles.uploadForm} onSubmit={handleUpload}>
        <input
          className={styles.uploadInput}
          type="text"
          placeholder="Nome da fonte (ex: PCDT Asma 2023)"
          value={fonte}
          onChange={(e) => setFonte(e.target.value)}
          disabled={uploading}
        />
        <input
          className={styles.fileInput}
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0] || null)}
          disabled={uploading}
        />
        <button
          className={styles.uploadBtn}
          type="submit"
          disabled={uploading || !file || !fonte.trim()}
        >
          {uploading ? 'Importando...' : 'Importar PDF'}
        </button>
      </form>

      {uploadError && <p className={styles.error}>{uploadError}</p>}
      {uploadSuccess && <p className={styles.success}>{uploadSuccess}</p>}

      {loading ? (
        <p className={styles.info}>Carregando documentos...</p>
      ) : docs.length === 0 ? (
        <p className={styles.info}>Nenhum documento importado ainda.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fonte</th>
              <th>Chunks</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.fonte}>
                <td className={styles.nome}>{d.fonte}</td>
                <td>{d.chunks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function AdminKnowledge() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(new Set());

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingKnowledge();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(elementId) {
    setProcessing((prev) => new Set(prev).add(elementId));
    try {
      await approveKnowledge(elementId);
      setItems((prev) => prev.filter((i) => i.elementId !== elementId));
    } catch (err) {
      alert('Erro ao aprovar: ' + err.message);
    } finally {
      setProcessing((prev) => { const s = new Set(prev); s.delete(elementId); return s; });
    }
  }

  async function handleReject(elementId) {
    if (!confirm('Rejeitar e remover este item?')) return;
    setProcessing((prev) => new Set(prev).add(elementId));
    try {
      await rejectKnowledge(elementId);
      setItems((prev) => prev.filter((i) => i.elementId !== elementId));
    } catch (err) {
      alert('Erro ao rejeitar: ' + err.message);
    } finally {
      setProcessing((prev) => { const s = new Set(prev); s.delete(elementId); return s; });
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Base de Conhecimento</h1>
        <span className={styles.badge}>{items.length} pendentes</span>
        <button className={styles.refreshBtn} onClick={load} disabled={loading}>
          Atualizar
        </button>
      </header>

      {loading && <p className={styles.info}>Carregando...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && items.length === 0 && (
        <p className={styles.info}>Nenhum item pendente de revisão.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Nome</th>
              <th>CID</th>
              <th>Origem</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.elementId} className={processing.has(item.elementId) ? styles.dimmed : ''}>
                <td>
                  <span className={`${styles.tag} ${styles[item.tipo.toLowerCase()]}`}>
                    {item.tipo}
                  </span>
                </td>
                <td className={styles.nome}>{item.nome}</td>
                <td className={styles.cid}>{item.cid || '—'}</td>
                <td className={styles.session}>{item.sourceSessionId || '—'}</td>
                <td className={styles.date}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className={styles.actions}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleApprove(item.elementId)}
                    disabled={processing.has(item.elementId)}
                  >
                    Aprovar
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handleReject(item.elementId)}
                    disabled={processing.has(item.elementId)}
                  >
                    Rejeitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <DocumentsPanel />
    </div>
  );
}
```

- [ ] **Step 3: Adicionar estilos ao AdminKnowledge.module.scss**

Adicionar ao final de `frontend/src/pages/AdminKnowledge.module.scss`:

```scss
.docsPanel {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;
}

.sectionTitle {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a2332;
  margin: 0 0 1.25rem;
}

.uploadForm {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.uploadInput {
  flex: 1;
  min-width: 200px;
  padding: 0.45rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;

  &:disabled {
    opacity: 0.5;
  }
}

.fileInput {
  font-size: 0.875rem;

  &:disabled {
    opacity: 0.5;
  }
}

.uploadBtn {
  padding: 0.45rem 1.25rem;
  background: #1a56db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #1e40af;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.success {
  color: #065f46;
  background: #d1fae5;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}
```

- [ ] **Step 4: Commit**

```bash
git add conduta/frontend/src/services/api.js conduta/frontend/src/pages/AdminKnowledge.jsx conduta/frontend/src/pages/AdminKnowledge.module.scss
git commit -m "feat: adiciona painel de upload de PDFs clínicos na tela de admin"
```

---

## Task 12: Migração SQL — pgvector em messages

**Files:**
- Create: `backend/src/db/migrations/006_messages_embedding.sql`

- [ ] **Step 1: Criar arquivo de migração**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS idx_messages_embedding
  ON messages USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;
```

- [ ] **Step 2: Executar migração**

```bash
cd conduta/backend && npm run migrate
```

Expected: `Migration executada: 006_messages_embedding.sql`

- [ ] **Step 3: Commit**

```bash
git add conduta/backend/src/db/migrations/006_messages_embedding.sql
git commit -m "feat: adiciona coluna embedding vector(1536) em messages para pgvector"
```

---

## Task 13: case-search.js + teste

**Files:**
- Modify: `backend/src/services/case-search.js`
- Create: `backend/src/__tests__/case-search.test.js`

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `backend/src/__tests__/case-search.test.js`:

```js
const mockQuery = jest.fn();
const mockEmbed = jest.fn().mockResolvedValue(new Array(1536).fill(0.1));

jest.mock('../db/pg', () => ({ query: mockQuery }));
jest.mock('../services/embeddings', () => ({ embed: mockEmbed }));

const { searchSimilarCases } = require('../services/case-search');

beforeEach(() => {
  mockQuery.mockClear();
  mockEmbed.mockClear();
});

describe('searchSimilarCases', () => {
  it('retorna null quando não há casos similares', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const result = await searchSimilarCases('Paciente com tosse', 'user-1');
    expect(result).toBeNull();
  });

  it('retorna null quando casos não têm summary', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ content: 'tosse há 3 dias', summary: null }],
    });
    const result = await searchSimilarCases('Paciente com tosse', 'user-1');
    expect(result).toBeNull();
  });

  it('retorna contexto formatado com hipótese e conduta', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          content: 'Paciente 35 anos com tosse produtiva há 7 dias, febre 38.5',
          summary: { hipotese: 'Pneumonia bacteriana', conduta: 'Amoxicilina 500mg 8/8h', alertas: [] },
        },
      ],
    });

    const result = await searchSimilarCases('tosse febre adulto', 'user-1');

    expect(result).toContain('Casos similares atendidos anteriormente');
    expect(result).toContain('Pneumonia bacteriana');
    expect(result).toContain('Amoxicilina 500mg 8/8h');
  });

  it('não lança erro quando embed falha', async () => {
    mockEmbed.mockRejectedValue(new Error('network error'));
    await expect(searchSimilarCases('tosse', 'user-1')).resolves.toBeNull();
  });

  it('exclui o próprio userId da busca', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await searchSimilarCases('tosse', 'user-abc');
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('user_id != $1');
    expect(params[0]).toBe('user-abc');
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
cd conduta/backend && npm test -- --testPathPattern=case-search --no-coverage
```

Expected: FAIL — testes falham porque a implementação retorna `null` para tudo

- [ ] **Step 3: Implementar case-search.js**

Substituir o conteúdo de `backend/src/services/case-search.js`:

```js
const pool = require('../db/pg');
const { embed } = require('./embeddings');

async function searchSimilarCases(content, userId) {
  try {
    const queryEmbedding = await embed(content);

    const result = await pool.query(
      `SELECT m.content, s.summary
       FROM messages m
       JOIN sessions s ON s.id = m.session_id
       WHERE m.role = 'user'
         AND m.embedding IS NOT NULL
         AND s.user_id != $1
         AND NOT EXISTS (
           SELECT 1 FROM messages m2
           WHERE m2.session_id = m.session_id
             AND m2.role = 'assistant'
             AND m2.feedback = 'negative'
         )
       ORDER BY m.embedding <=> $2::vector
       LIMIT 3`,
      [userId, JSON.stringify(queryEmbedding)]
    );

    if (result.rows.length === 0) return null;

    const lines = result.rows
      .filter((r) => r.summary)
      .map((r) => {
        const s = r.summary;
        const trecho = r.content.slice(0, 100).replace(/\n/g, ' ');
        return `- Caso similar: ${trecho}... → Hipótese: ${s.hipotese} | Conduta: ${s.conduta}`;
      });

    if (lines.length === 0) return null;

    return `Casos similares atendidos anteriormente:\n${lines.join('\n')}`;
  } catch (err) {
    console.error('[case-search] error (non-fatal):', err.message);
    return null;
  }
}

module.exports = { searchSimilarCases };
```

- [ ] **Step 4: Rodar teste para confirmar que passa**

```bash
cd conduta/backend && npm test -- --testPathPattern=case-search --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add conduta/backend/src/services/case-search.js conduta/backend/src/__tests__/case-search.test.js
git commit -m "feat: implementa case-search com pgvector — busca casos similares por similaridade coseno"
```

---

## Task 14: analyze.js — gerar e salvar embedding da mensagem do usuário

**Files:**
- Modify: `backend/src/routes/analyze.js`

- [ ] **Step 1: Adicionar import de embeddings e gerar embedding após salvar mensagem do usuário**

Adicionar no topo de `backend/src/routes/analyze.js`, junto aos outros requires:

```js
const { embed } = require('../services/embeddings');
```

Localizar o comentário `// Frente 3 — embedding da mensagem do usuário (fire-and-forget, adicionado na Task 14)` e `void userMessageId;`, e substituir por:

```js
embed(content)
  .then((embedding) =>
    pool.query(
      'UPDATE messages SET embedding = $1 WHERE id = $2',
      [JSON.stringify(embedding), userMessageId]
    )
  )
  .catch((err) => console.error('[analyze] embed fire-and-forget error:', err.message));
```

- [ ] **Step 2: Rodar suite completa de testes**

```bash
cd conduta/backend && npm test -- --no-coverage
```

Expected: todos os testes passando

- [ ] **Step 3: Commit**

```bash
git add conduta/backend/src/routes/analyze.js
git commit -m "feat: gera e persiste embedding da mensagem do usuário para case-search"
```

---

## Task 15: Verificação final

- [ ] **Step 1: Rodar todos os testes**

```bash
cd conduta/backend && npm test -- --no-coverage
```

Expected: todos os testes passando, sem erros

- [ ] **Step 2: Verificar que o backend sobe sem erros**

```bash
cd conduta/backend && node src/index.js &
sleep 3 && curl -s http://localhost:3000/health
kill %1
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Commit final de tag de versão**

```bash
git add -A
git commit -m "feat: melhoria de chat clínico — seções obrigatórias, follow-up com âncora, RAG PDF, case-search"
```

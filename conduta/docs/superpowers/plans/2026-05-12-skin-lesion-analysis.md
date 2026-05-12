# Análise de Lesão Cutânea Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ao CaseInput (apenas Pro) um botão de anexar foto de lesão de pele que classifica via Hugging Face e injeta o resultado no caso clínico antes de chamar `/analyze`.

**Architecture:** Endpoint de pré-processamento `POST /skin/classificar` separado do `/analyze` — recebe imagem via multipart, chama HF Inference API, retorna classificação em texto, descarta imagem. Frontend concatena o texto ao caso clínico e chama `/analyze` normalmente. O pipeline SSE/Neo4j/OpenRouter permanece intacto.

**Tech Stack:** Node.js, Express 4, Multer (já instalado), HF Inference API via `fetch` nativo, React, Vitest + Testing Library (frontend), Jest + Supertest (backend).

---

## Mapa de Arquivos

| Arquivo | Ação |
|---|---|
| `backend/src/services/skin-classifier.js` | Criar — chama HF, formata resultado |
| `backend/src/__tests__/skin-classifier.test.js` | Criar — testa o serviço isolado |
| `backend/src/routes/skin.js` | Criar — rota POST /skin/classificar |
| `backend/src/__tests__/skin.test.js` | Criar — testa a rota com supertest |
| `backend/src/app.js` | Modificar — registra `/skin` router |
| `frontend/src/services/api.js` | Modificar — adiciona `classificarLesao` |
| `frontend/src/components/CaseInput.jsx` | Modificar — UI de upload + orquestração |
| `frontend/src/components/CaseInput.module.scss` | Modificar — estilos do botão e preview |
| `frontend/src/__tests__/CaseInput.test.jsx` | Modificar — testa comportamento Pro/free |

---

## Task 1: Service skin-classifier (TDD)

**Files:**
- Create: `backend/src/services/skin-classifier.js`
- Create: `backend/src/__tests__/skin-classifier.test.js`

- [ ] **Step 1.1: Escrever o teste que falha**

Crie `backend/src/__tests__/skin-classifier.test.js`:

```javascript
const { classificar } = require('../services/skin-classifier');

beforeEach(() => {
  process.env.HF_API_TOKEN = 'hf_test';
  process.env.HF_SKIN_MODEL = 'test/model';
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

describe('classificar', () => {
  it('retorna texto formatado com top 3 diagnósticos em português', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { label: 'MEL', score: 0.87 },
        { label: 'NV', score: 0.09 },
        { label: 'BCC', score: 0.02 },
        { label: 'AK', score: 0.01 },
      ],
    });

    const resultado = await classificar(Buffer.from('fake'), 'image/jpeg');

    expect(resultado).toContain('Melanoma (87%)');
    expect(resultado).toContain('Nevo melanocítico (9%)');
    expect(resultado).toContain('Carcinoma basocelular (2%)');
    expect(resultado).toContain('⚠️');
  });

  it('lança erro com status 503 quando HF retorna 503', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(classificar(Buffer.from('fake'), 'image/jpeg')).rejects.toMatchObject({ status: 503 });
  });

  it('lança erro com status 502 para outros erros do HF', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(classificar(Buffer.from('fake'), 'image/jpeg')).rejects.toMatchObject({ status: 502 });
  });
});
```

- [ ] **Step 1.2: Rodar e confirmar que falha**

```bash
cd conduta/backend && npm test -- --testPathPattern=skin-classifier
```

Esperado: FAIL com `Cannot find module '../services/skin-classifier'`

- [ ] **Step 1.3: Implementar o serviço**

Crie `backend/src/services/skin-classifier.js`:

```javascript
const MAPA_LABELS = {
  MEL: 'Melanoma',
  NV: 'Nevo melanocítico',
  BCC: 'Carcinoma basocelular',
  AK: 'Queratose actínica',
  BKL: 'Queratose benigna',
  DF: 'Dermatofibroma',
  VASC: 'Lesão vascular',
};

async function classificar(buffer, mimetype) {
  const modelo = process.env.HF_SKIN_MODEL || 'bsenst/skin-cancer-HAM10k';
  const token = process.env.HF_API_TOKEN;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${modelo}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': mimetype,
      },
      body: buffer,
    }
  );

  if (!response.ok) {
    const err = new Error('Erro ao chamar HF API');
    err.status = response.status === 503 ? 503 : 502;
    throw err;
  }

  const resultados = await response.json();

  const top3 = resultados
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => {
      const nome = MAPA_LABELS[r.label] || r.label;
      const pct = Math.round(r.score * 100);
      return `${nome} (${pct}%)`;
    })
    .join(', ');

  return `Classificação de lesão cutânea (IA): ${top3}\n⚠️ Esta classificação é suporte à decisão clínica e não substitui avaliação dermatológica presencial.`;
}

module.exports = { classificar };
```

- [ ] **Step 1.4: Rodar e confirmar que passa**

```bash
cd conduta/backend && npm test -- --testPathPattern=skin-classifier
```

Esperado: 3 testes PASS

- [ ] **Step 1.5: Commit**

```bash
cd conduta && git add backend/src/services/skin-classifier.js backend/src/__tests__/skin-classifier.test.js
git commit -m "feat(skin): serviço de classificação via HF Inference API"
```

---

## Task 2: Rota POST /skin/classificar (TDD)

**Files:**
- Create: `backend/src/routes/skin.js`
- Create: `backend/src/__tests__/skin.test.js`
- Modify: `backend/src/app.js`

- [ ] **Step 2.1: Escrever os testes que falham**

Crie `backend/src/__tests__/skin.test.js`:

```javascript
const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../db/pg');
const app = require('../app');

jest.mock('../services/skin-classifier', () => ({
  classificar: jest.fn(),
}));

const { classificar } = require('../services/skin-classifier');

let tokenFree;
let tokenPro;

beforeAll(async () => {
  const hash = await bcrypt.hash('senha123', 10);

  await pool.query(
    `INSERT INTO users (email, nome, senha_hash) VALUES ($1, $2, $3)`,
    ['skin-free@conduta.dev', 'Dr. Free', hash]
  );

  await pool.query(
    `INSERT INTO users (email, nome, senha_hash, plan) VALUES ($1, $2, $3, $4)`,
    ['skin-pro@conduta.dev', 'Dr. Pro', hash, 'pro']
  );

  const loginFree = await request(app)
    .post('/auth/login')
    .send({ email: 'skin-free@conduta.dev', senha: 'senha123' });
  tokenFree = loginFree.body.token;

  const loginPro = await request(app)
    .post('/auth/login')
    .send({ email: 'skin-pro@conduta.dev', senha: 'senha123' });
  tokenPro = loginPro.body.token;
});

afterAll(async () => {
  await pool.query(
    'DELETE FROM users WHERE email = ANY($1)',
    [['skin-free@conduta.dev', 'skin-pro@conduta.dev']]
  );
  await pool.end();
});

beforeEach(() => jest.clearAllMocks());

describe('POST /skin/classificar', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/skin/classificar');
    expect(res.status).toBe(401);
  });

  it('retorna 403 para usuário free', async () => {
    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenFree}`)
      .attach('imagem', Buffer.from('fake-img'), {
        filename: 'lesao.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/plano Pro/i);
  });

  it('retorna 400 sem imagem', async () => {
    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenPro}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatória/i);
  });

  it('retorna 400 para formato inválido', async () => {
    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenPro}`)
      .attach('imagem', Buffer.from('fake'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JPEG ou PNG/i);
  });

  it('retorna 200 com classificação para usuário pro', async () => {
    classificar.mockResolvedValue(
      'Classificação de lesão cutânea (IA): Melanoma (87%)\n⚠️ Esta classificação é suporte.'
    );

    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenPro}`)
      .attach('imagem', Buffer.from('fake-img'), {
        filename: 'lesao.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(200);
    expect(res.body.classificacao).toContain('Melanoma');
  });

  it('retorna 503 quando HF está indisponível', async () => {
    classificar.mockRejectedValue(
      Object.assign(new Error('HF down'), { status: 503 })
    );

    const res = await request(app)
      .post('/skin/classificar')
      .set('Authorization', `Bearer ${tokenPro}`)
      .attach('imagem', Buffer.from('fake-img'), {
        filename: 'lesao.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(503);
  });
});
```

- [ ] **Step 2.2: Rodar e confirmar que falha**

```bash
cd conduta/backend && npm test -- --testPathPattern=skin.test
```

Esperado: FAIL com `Cannot find module '../routes/skin'` ou 404 nas requisições

- [ ] **Step 2.3: Criar a rota**

Crie `backend/src/routes/skin.js`:

```javascript
const express = require('express');
const multer = require('multer');
const { classificar } = require('../services/skin-classifier');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/classificar', upload.single('imagem'), async (req, res) => {
  if (req.userPlan !== 'pro' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Disponível apenas no plano Pro.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Imagem obrigatória.' });
  }

  if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Formato não suportado. Use JPEG ou PNG.' });
  }

  try {
    const classificacao = await classificar(req.file.buffer, req.file.mimetype);
    return res.json({ classificacao });
  } catch (err) {
    const status = err.status || 502;
    return res.status(status).json({ error: 'Erro ao processar imagem. Tente novamente.' });
  }
});

// Handler para LIMIT_FILE_SIZE do Multer
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'A imagem deve ter no máximo 5MB.' });
  }
  next(err);
});

module.exports = router;
```

- [ ] **Step 2.4: Registrar a rota no app.js**

Edite `backend/src/app.js`. Adicione após a linha `const billingRoutes = require('./routes/billing');`:

```javascript
const skinRoutes = require('./routes/skin');
```

Adicione após a linha `app.use('/billing', authMiddleware, billingRoutes);`:

```javascript
app.use('/skin', authMiddleware, skinRoutes);
```

- [ ] **Step 2.5: Rodar e confirmar que passa**

```bash
cd conduta/backend && npm test -- --testPathPattern=skin.test
```

Esperado: 6 testes PASS

- [ ] **Step 2.6: Commit**

```bash
cd conduta && git add backend/src/routes/skin.js backend/src/__tests__/skin.test.js backend/src/app.js
git commit -m "feat(skin): rota POST /skin/classificar com auth e validação de plano"
```

---

## Task 3: Frontend — api.js

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 3.1: Adicionar a função classificarLesao**

No final de `frontend/src/services/api.js`, antes da última linha, adicione:

```javascript
export async function classificarLesao(arquivo) {
  const formData = new FormData();
  formData.append('imagem', arquivo);
  const res = await fetch(`${BASE_URL}/skin/classificar`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao classificar imagem.');
  }
  return res.json();
}
```

- [ ] **Step 3.2: Commit**

```bash
cd conduta && git add frontend/src/services/api.js
git commit -m "feat(skin): adiciona classificarLesao ao api.js"
```

---

## Task 4: Frontend — CaseInput (TDD)

**Files:**
- Modify: `frontend/src/__tests__/CaseInput.test.jsx`
- Modify: `frontend/src/components/CaseInput.jsx`
- Modify: `frontend/src/components/CaseInput.module.scss`

- [ ] **Step 4.1: Escrever testes que falham**

Substitua o conteúdo de `frontend/src/__tests__/CaseInput.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CaseInput from '../components/CaseInput';
import { vi } from 'vitest';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/api', () => ({
  analyzeCase: vi.fn(),
  classificarLesao: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';
import { analyzeCase, classificarLesao } from '../services/api';

const defaultProps = {
  sessionId: 'abc',
  onAnalysisStart: vi.fn(),
  onChunk: vi.fn(),
  onAnalysisDone: vi.fn(),
  onUsageUpdate: vi.fn(),
  onSessionMsgCount: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: { plan: 'free', role: 'user' } });
  analyzeCase.mockResolvedValue();
});

describe('CaseInput', () => {
  it('renderiza textarea e botão Analisar', () => {
    render(<CaseInput {...defaultProps} />);
    expect(screen.getByPlaceholderText(/descreva o caso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analisar/i })).toBeInTheDocument();
  });

  it('botão Analisar fica desabilitado com textarea vazio', () => {
    render(<CaseInput {...defaultProps} />);
    expect(screen.getByRole('button', { name: /analisar/i })).toBeDisabled();
  });

  it('habilita botão quando há texto', () => {
    render(<CaseInput {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/descreva o caso/i), {
      target: { value: 'Paciente 30 anos com febre' },
    });
    expect(screen.getByRole('button', { name: /analisar/i })).not.toBeDisabled();
  });

  it('não exibe botão de foto para usuário free', () => {
    useAuth.mockReturnValue({ user: { plan: 'free', role: 'user' } });
    render(<CaseInput {...defaultProps} />);
    expect(screen.queryByText(/anexar foto/i)).not.toBeInTheDocument();
  });

  it('exibe botão de foto para usuário pro', () => {
    useAuth.mockReturnValue({ user: { plan: 'pro', role: 'user' } });
    render(<CaseInput {...defaultProps} />);
    expect(screen.getByText(/anexar foto de lesão de pele/i)).toBeInTheDocument();
  });

  it('exibe botão de foto para admin', () => {
    useAuth.mockReturnValue({ user: { plan: 'free', role: 'admin' } });
    render(<CaseInput {...defaultProps} />);
    expect(screen.getByText(/anexar foto de lesão de pele/i)).toBeInTheDocument();
  });

  it('sem foto: chama apenas analyzeCase', async () => {
    useAuth.mockReturnValue({ user: { plan: 'pro', role: 'user' } });
    render(<CaseInput {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText(/descreva o caso/i), {
      target: { value: 'Paciente com febre' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analisar/i }));

    await waitFor(() => {
      expect(classificarLesao).not.toHaveBeenCalled();
      expect(analyzeCase).toHaveBeenCalledWith(
        'abc',
        'Paciente com febre',
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('com foto: chama classificarLesao antes de analyzeCase', async () => {
    useAuth.mockReturnValue({ user: { plan: 'pro', role: 'user' } });
    classificarLesao.mockResolvedValue({
      classificacao: 'Classificação de lesão cutânea (IA): Melanoma (87%)\n⚠️ Suporte clínico.',
    });

    render(<CaseInput {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText(/descreva o caso/i), {
      target: { value: 'Lesão suspeita' },
    });

    const arquivo = new File(['img'], 'lesao.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [arquivo] } });

    fireEvent.click(screen.getByRole('button', { name: /analisar/i }));

    await waitFor(() => {
      expect(classificarLesao).toHaveBeenCalledWith(arquivo);
      expect(analyzeCase).toHaveBeenCalledWith(
        'abc',
        expect.stringContaining('Melanoma'),
        expect.any(Function),
        expect.any(Function)
      );
      expect(analyzeCase).toHaveBeenCalledWith(
        'abc',
        expect.stringContaining('Lesão suspeita'),
        expect.any(Function),
        expect.any(Function)
      );
    });
  });
});
```

- [ ] **Step 4.2: Rodar e confirmar que os novos testes falham**

```bash
cd conduta/frontend && npm test -- CaseInput
```

Esperado: testes de foto FAIL, testes existentes PASS

- [ ] **Step 4.3: Implementar as mudanças no CaseInput.jsx**

Substitua o conteúdo de `frontend/src/components/CaseInput.jsx`:

```jsx
import { useState, useRef } from 'react';
import { analyzeCase, classificarLesao } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './CaseInput.module.scss';

export default function CaseInput({ sessionId, usage, onAnalysisStart, onChunk, onAnalysisDone, onUsageUpdate, onSessionMsgCount }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [foto, setFoto] = useState(null);
  const [classificando, setClassificando] = useState(false);
  const fileInputRef = useRef(null);

  const isPro = user?.plan === 'pro' || user?.role === 'admin';
  const limitReached = usage && usage.limit !== null && usage.used >= usage.limit;

  function handleFotoChange(e) {
    const arquivo = e.target.files?.[0];
    if (arquivo) setFoto(arquivo);
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || analyzing || limitReached) return;

    setError('');
    setAnalyzing(true);

    try {
      let textoFinal = content.trim();

      if (foto) {
        setClassificando(true);
        const { classificacao } = await classificarLesao(foto);
        setClassificando(false);
        textoFinal = `${classificacao}\n\n---\n\n${textoFinal}`;
      }

      onAnalysisStart(textoFinal);
      await analyzeCase(sessionId, textoFinal, onChunk, onSessionMsgCount);
      setContent('');
      setFoto(null);
    } catch (err) {
      setClassificando(false);
      if (err.code === 'USAGE_LIMIT' && err.usage) {
        onUsageUpdate(err.usage);
      } else {
        setError(err.message || 'Erro ao processar análise. Verifique a conexão e tente novamente.');
      }
    } finally {
      setAnalyzing(false);
      onAnalysisDone();
    }
  }

  const statusText = classificando
    ? 'Classificando imagem...'
    : analyzing
    ? 'Processando análise...'
    : null;

  return (
    <div className={styles.container} data-coachmark="case-input">
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
        {isPro && (
          <div className={styles.fotoArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className={styles.fotoInput}
              onChange={handleFotoChange}
            />
            {foto ? (
              <div className={styles.fotoPreview}>
                <img
                  src={URL.createObjectURL(foto)}
                  alt="Preview da lesão"
                  className={styles.fotoThumb}
                />
                <span className={styles.fotoNome}>{foto.name}</span>
                <button
                  type="button"
                  className={styles.fotoRemover}
                  onClick={() => setFoto(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.fotoBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzing}
                >
                  📎 Anexar foto de lesão de pele
                </button>
                <p className={styles.fotoAviso}>
                  Apenas fotos de lesões cutâneas. Não adequado para radiografias, fraturas ou outras imagens médicas.
                </p>
              </>
            )}
          </div>
        )}
        <div className={styles.footer}>
          <span className={styles.hint}>
            {error ? (
              <span style={{ color: '#c0392b' }}>{error}</span>
            ) : statusText ? (
              <span className={styles.progress}>{statusText}</span>
            ) : (
              'Texto livre — descreva com os dados que você tem'
            )}
          </span>
          <button
            type="submit"
            className={styles.button}
            disabled={!content.trim() || analyzing || limitReached}
          >
            {classificando ? 'Classificando...' : analyzing ? 'Analisando...' : 'Analisar'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4.4: Adicionar estilos ao CaseInput.module.scss**

No final de `frontend/src/components/CaseInput.module.scss`, adicione:

```scss
.fotoArea {
  margin-top: 10px;
  margin-bottom: 4px;
}

.fotoInput {
  display: none;
}

.fotoBtn {
  font-size: $font-size-sm;
  color: $color-accent;
  background: none;
  border: 1px dashed $color-accent;
  border-radius: $border-radius;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: rgba(26, 107, 115, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.fotoAviso {
  margin-top: 4px;
  font-size: 11px;
  color: $color-text-secondary;
  font-style: italic;
}

.fotoPreview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f0f7f8;
  border: 1px solid $color-border;
  border-radius: $border-radius;
}

.fotoThumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.fotoNome {
  font-size: $font-size-sm;
  color: $color-text-primary;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fotoRemover {
  flex-shrink: 0;
  font-size: 11px;
  color: $color-text-secondary;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;

  &:hover {
    background: #e0e0e0;
    color: $color-danger;
  }
}
```

- [ ] **Step 4.5: Rodar todos os testes do frontend**

```bash
cd conduta/frontend && npm test
```

Esperado: todos PASS

- [ ] **Step 4.6: Commit**

```bash
cd conduta && git add frontend/src/components/CaseInput.jsx frontend/src/components/CaseInput.module.scss frontend/src/__tests__/CaseInput.test.jsx
git commit -m "feat(skin): UI de upload de lesão cutânea no CaseInput (apenas Pro)"
```

---

## Task 5: Verificação Final

- [ ] **Step 5.1: Rodar todos os testes do backend**

```bash
cd conduta/backend && npm test
```

Esperado: todos os testes PASS (skin-classifier + skin + demais suites)

- [ ] **Step 5.2: Subir o ambiente local e testar manualmente**

```bash
cd conduta && docker-compose up -d && cd backend && npm run dev
# Em outro terminal:
cd conduta/frontend && npm run dev
```

Fluxo a testar:
1. Login com usuário free — confirmar que botão de foto NÃO aparece
2. Login com usuário pro — confirmar que botão de foto aparece
3. Clicar em "Anexar foto de lesão de pele" — selecionar uma imagem JPEG
4. Verificar preview com thumbnail e nome do arquivo
5. Clicar "✕" — confirmar que foto é removida
6. Tentar selecionar um PDF — deve ser ignorado pelo accept do input
7. Escrever caso clínico + anexar foto → clicar "Analisar"
8. Confirmar estado "Classificando..." no botão → depois "Analisando..."
9. Confirmar que a resposta do LLM menciona a lesão classificada
10. Confirmar que o caso enviado sem foto funciona normalmente

- [ ] **Step 5.3: Adicionar variável no Railway (produção)**

No painel do Railway → projeto backend → Variables → Add:
- `HF_API_TOKEN` = (valor do token HF)
- `HF_SKIN_MODEL` = `bsenst/skin-cancer-HAM10k`

- [ ] **Step 5.4: Push para produção**

```bash
cd conduta && git push origin main
```

---

## Resumo dos commits esperados

1. `feat(skin): serviço de classificação via HF Inference API`
2. `feat(skin): rota POST /skin/classificar com auth e validação de plano`
3. `feat(skin): adiciona classificarLesao ao api.js`
4. `feat(skin): UI de upload de lesão cutânea no CaseInput (apenas Pro)`

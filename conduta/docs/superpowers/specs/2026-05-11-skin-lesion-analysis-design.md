# Análise de Lesão Cutânea — Design Spec

**Data:** 2026-05-11  
**Status:** Aprovado  
**Plano:** Exclusivo para usuários Pro e admin

---

## Visão Geral

Feature que permite ao médico anexar uma foto de lesão cutânea junto ao caso clínico em texto. O backend classifica a imagem via modelo pré-treinado (Hugging Face) e injeta o resultado no texto antes de enviar ao pipeline de análise existente. O fluxo de sessão, Neo4j e OpenRouter permanecem inalterados.

---

## Arquitetura

### Abordagem escolhida: pré-processamento separado

O frontend chama `/skin/classificar` com a foto, recebe a classificação em texto, concatena ao caso clínico e envia normalmente para `/analyze`. O endpoint `/analyze` não sabe nada sobre imagens.

**Vantagem principal:** zero risco ao código mais crítico do app. Se o serviço de classificação falhar, análises de texto continuam funcionando normalmente.

### Novos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `backend/src/routes/skin.js` | Rota `POST /skin/classificar` |
| `backend/src/services/skin-classifier.js` | Chama HF Inference API, formata resultado |

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `backend/src/app.js` | Registra `/skin` router |
| `frontend/src/services/api.js` | Adiciona `classificarLesao(arquivo)` |
| `frontend/src/components/CaseInput.jsx` | Botão de anexo + orquestração |
| `frontend/src/components/CaseInput.module.scss` | Estilos do botão e preview |

### Novas variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `HF_API_TOKEN` | ✓ | Token do Hugging Face Inference API |
| `HF_SKIN_MODEL` | — | ID do modelo, default `bsenst/skin-cancer-HAM10k` |

Nenhuma migration de banco necessária — imagens nunca são persistidas.

---

## Fluxo de Dados

```
1. Médico escreve caso + anexa foto de lesão → clica "Analisar"

2. Frontend: api.classificarLesao(arquivo)
   → POST /skin/classificar (multipart/form-data)
   → Multer lê imagem em memória (buffer)
   → Chama HF Inference API com bytes da imagem
   → HF retorna scores por classe
   → Backend formata em texto legível + disclaimer
   → Retorna { classificacao: "..." }
   → Imagem descartada da memória

3. Frontend concatena:
   textoFinal = classificacao + "\n\n---\n\n" + textoCaso

4. Frontend: api.analyzeCase(sessionId, textoFinal)
   → Fluxo SSE normal
   → Neo4j busca contexto clínico ("melanoma" → nós relevantes)
   → OpenRouter analisa texto completo
   → extractAndPersist salva entidades no Neo4j
   → Resposta via SSE ao médico
```

---

## Backend

### `src/services/skin-classifier.js`

- Recebe `buffer` (bytes) e `mimetype` da imagem
- Chama `https://api-inference.huggingface.co/models/${HF_SKIN_MODEL}`
- Mapeia labels HAM10000 para português:

| Label | Nome |
|---|---|
| MEL | Melanoma |
| NV | Nevo melanocítico |
| BCC | Carcinoma basocelular |
| AK | Queratose actínica |
| BKL | Queratose benigna |
| DF | Dermatofibroma |
| VASC | Lesão vascular |

- Retorna string formatada:
  ```
  Classificação de lesão cutânea (IA): Melanoma (87%), Nevo melanocítico (9%), Carcinoma basocelular (2%)
  ⚠️ Esta classificação é suporte à decisão clínica e não substitui avaliação dermatológica presencial.
  ```

### `src/routes/skin.js`

- `POST /skin/classificar`
- Middlewares: `authMiddleware` → verificação de plano Pro → Multer
- Multer: `memoryStorage()`, limite 5MB, aceita `image/jpeg` e `image/png`
- Verificação de plano: `req.userPlan === 'pro' || req.userRole === 'admin'` → 403 caso contrário
- Chama `skinClassifier.classificar(buffer, mimetype)`
- Retorna `{ classificacao: "..." }`

### `src/app.js`

```js
app.use('/skin', authMiddleware, skinRouter);
```

---

## Frontend

### `CaseInput.jsx`

- Botão **"Anexar foto de lesão de pele"** renderizado apenas se `user.plan === 'pro' || user.role === 'admin'`
- Texto auxiliar abaixo do botão: *"Apenas fotos de lesões cutâneas. Não adequado para radiografias, fraturas ou outras imagens médicas."*
- Estado local: `foto` (File | null)
- Preview: thumbnail pequena com botão de remover
- Ao clicar "Analisar":
  - Se `foto` presente:
    1. Estado de loading: "Classificando..."
    2. Chama `api.classificarLesao(foto)`
    3. Concatena resultado ao texto do caso
    4. Chama `api.analyzeCase()` com texto enriquecido
  - Se `foto` ausente: comportamento atual inalterado

### `api.js`

```js
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

---

## Tratamento de Erros

| Situação | Código | Mensagem ao usuário |
|---|---|---|
| HF indisponível | 503 | "Serviço de classificação temporariamente indisponível" |
| Imagem > 5MB | 400 | "A imagem deve ter no máximo 5MB" |
| Formato inválido | 400 | "Formato não suportado. Use JPEG ou PNG" |
| Plano não é Pro | 403 | (botão não é exibido — erro não chega ao usuário) |
| HF retorna erro | 502 | "Erro ao processar imagem. Tente novamente" |

Em todos os casos de erro na classificação, o médico pode remover a foto e enviar o caso só com texto.

---

## Testes

### Backend (`src/__tests__/skin.test.js`)

- Usuário free → 403
- Imagem > 5MB → 400
- Formato inválido (PDF) → 400
- HF retorna classificação → 200 com `{ classificacao: "..." }` contendo disclaimer
- HF indisponível → 503
- Sem imagem no body → 400
- HF sempre mockado — nunca chama API real

### Frontend

- `CaseInput` não renderiza botão para usuário free
- `CaseInput` renderiza botão e aviso para usuário pro
- Com foto anexada: chama `classificarLesao` antes de `analyzeCase`
- Sem foto: chama só `analyzeCase` (comportamento atual inalterado)
- Erro na classificação: exibe mensagem, permite envio sem foto

---

## Integração com Neo4j (sem mudanças)

A classificação entra como texto no caso clínico. O Neo4j participa naturalmente:
- `searchClinicalContext("melanoma")` encontra nós clínicos relevantes
- `extractAndPersist` extrai entidades da resposta e persiste no grafo

Nenhuma alteração no Neo4j é necessária.

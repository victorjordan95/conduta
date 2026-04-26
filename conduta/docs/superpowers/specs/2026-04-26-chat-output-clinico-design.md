# Design: Melhoria de Chat e Outputs Clínicos

**Data:** 2026-04-26
**Projeto:** Conduta — assistente clínico para médicos em USF e pronto atendimento
**Escopo:** Três frentes independentes e priorizadas para melhorar qualidade dos outputs e assertividade clínica

---

## Contexto

O sistema atual possui:
- Chat com streaming SSE, histórico por sessão, feedback por mensagem
- Neo4j com diagnósticos/medicamentos/red flags buscados por keywords
- `case-search` placeholder (retorna null)
- System prompt clínico detalhado com estrutura de seções

Problemas identificados:
- **c) Seções importantes ausentes** — Red Flags, Dados que Faltam, Critérios de Encaminhamento sumindo em casos que deveriam tê-los
- **d) Follow-up fraco** — modelo perde o fio do raciocínio clínico anterior em perguntas de acompanhamento
- **Base de conhecimento limitada** — busca por keywords simples, sem RAG de documentos, sem casos históricos aproveitados

---

## Frente 1 — Seções obrigatórias e follow-up com âncora clínica

### Problema raiz

O system prompt usa "CASO MODERADO/COMPLEXO → estruture em..." sem critério objetivo. O modelo decide sozinho e frequentemente subestima a complexidade. Em follow-ups, o histórico bruto de mensagens não ancora o raciocínio clínico de forma compacta.

### Solução

**System prompt — seções obrigatórias:**

Adicionar regra explícita: as seções completas (## Red Flags, ## Dados que Faltam, ## Critérios de Retorno / Encaminhamento) são obrigatórias sempre que o caso apresentar ao menos um dos seguintes:
- Paciente pediátrico (< 18 anos)
- Gestante ou lactante
- Idoso (≥ 60 anos)
- Qualquer comorbidade mencionada
- Mais de um diagnóstico diferencial relevante
- Qualquer sinal de alarme potencial

**Session summary — âncora para follow-ups:**

Após a primeira resposta de análise de uma sessão, extrair e salvar na tabela `sessions` um campo `summary` com:
- Hipótese principal
- Conduta imediata definida
- Alertas ativos (red flags identificados)

Nas mensagens de follow-up (quando `history.length > 0`), injetar o summary como mensagem de sistema antes do histórico. O modelo responde com âncora clínica sem repetir a análise completa.

O summary é gerado por chamada LLM secundária (não-streaming, fire-and-forget após o stream principal), usando um prompt de extração estruturada. Formato JSON: `{ hipotese: string, conduta: string, alertas: string[] }`.

### Arquivos afetados

- `backend/src/config/system-prompt.js` — regra de seções obrigatórias com critérios explícitos
- `backend/src/routes/analyze.js` — gerar summary após primeira resposta; injetar summary em follow-ups
- `backend/src/services/session-summarizer.js` — novo serviço de extração de summary
- Migração SQL: `ALTER TABLE sessions ADD COLUMN summary jsonb`

---

## Frente 2 — RAG com PDFs via Neo4j vector index

### Arquitetura

```
Upload PDF (admin)
  → parse de texto (pdf-parse)
  → chunking (~500 tokens, overlap de 50 tokens)
  → embedding via OpenRouter text-embedding-3-small
  → nó DocumentoChunk no Neo4j
  → Neo4j vector index (HNSW) sobre propriedade embedding
```

Na análise (primeira mensagem da sessão), `searchClinicalContext` executa em paralelo:
1. Keyword search atual (diagnósticos/medicamentos) — mantida
2. Vector similarity search nos `DocumentoChunk` — top 3 mais similares ao caso

Os resultados são concatenados no contexto clínico injetado no prompt.

### Nó Neo4j novo

```
DocumentoChunk {
  id: string (uuid),
  texto: string,
  fonte: string,        // ex: "PCDT Asma 2023"
  pagina: int,
  embedding: float[1536],
  status: 'active' | 'inactive'
}
```

### Vetor index Neo4j

```cypher
CREATE VECTOR INDEX documentoChunkEmbedding
FOR (n:DocumentoChunk) ON n.embedding
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } }
```

### Interface admin

Na página `AdminKnowledge` existente: novo painel "Documentos Clínicos" com:
- Campo de texto para nome da fonte
- Input de arquivo (PDF)
- Botão "Importar"
- Lista de documentos importados com status e quantidade de chunks

### Arquivos afetados

- `backend/src/services/neo4j-search.js` — adicionar vector search em paralelo à keyword search
- `backend/src/services/pdf-ingestor.js` — novo serviço: parse → chunk → embed → persist
- `backend/src/routes/admin-knowledge.js` — endpoint `POST /admin/documents` com upload multipart
- `frontend/src/components/AdminKnowledge.jsx` — UI de upload e listagem de documentos
- Migração Neo4j: criar vector index

---

## Frente 3 — Case-search real via pgvector

### Arquitetura

Ao salvar cada análise, gerar embedding da mensagem do usuário (caso clínico) e persistir na coluna `embedding vector(1536)` da tabela `messages`.

`searchSimilarCases` faz busca por similaridade coseno no Postgres (pgvector): retorna os 3 casos mais próximos que atendam os critérios de qualidade.

**Por que pgvector e não Neo4j:** os casos estão no Postgres; manter embeddings de casos junto dos dados evita round-trip entre dois bancos. Neo4j fica para conhecimento estruturado (diagnósticos, chunks de guidelines).

### Filtro de qualidade

Somente mensagens com:
- `role = 'user'` (o caso em si)
- A sessão correspondente tem ao menos uma mensagem assistant com `feedback = 'positive'`, OU sem nenhum feedback negativo

Casos com feedback negativo nunca aparecem como referência.

### Contexto injetado

Formato compacto para não inflar o prompt:
```
Casos similares atendidos anteriormente:
- [Caso 1]: <resumo 2 linhas> → Conduta: <conduta adotada>
- [Caso 2]: ...
```

Os casos são anonimizados — apenas conteúdo clínico, sem dados de sessão/usuário.

### Arquivos afetados

- Migração SQL: `ALTER TABLE messages ADD COLUMN embedding vector(1536)` + índice HNSW
- Migração SQL: habilitar extensão `pgvector` se não ativa
- `backend/src/routes/analyze.js` — gerar e salvar embedding da mensagem do usuário (fire-and-forget)
- `backend/src/services/case-search.js` — implementar busca por similaridade coseno

---

## Ordem de implementação recomendada

1. **Frente 1** (menor risco, maior impacto imediato no output clínico)
2. **Frente 2** (maior valor de base de conhecimento)
3. **Frente 3** (depende de acúmulo de casos com embeddings — valor cresce com o tempo)

---

## Dependências externas

- `pdf-parse` — parse de PDF no backend
- `pgvector` — extensão Postgres (provavelmente já disponível no Railway)
- Neo4j versão ≥ 5.11 para vector index nativo
- OpenRouter com suporte a `text-embedding-3-small` (ou equivalente disponível)

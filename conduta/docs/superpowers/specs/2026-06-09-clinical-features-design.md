# Spec — Cinco Features Clínicas

Data: 2026-06-09
Status: aprovado pelo usuário (opções recomendadas escolhidas)

## Resumo

Cinco features de apoio clínico para o Conduta:

1. **Alertas de medicação e contraindicações** — embutido no prompt
2. **Comparador de hipóteses diagnósticas** — embutido no prompt
3. **Geração de resumo para prontuário** — endpoint sob demanda + UI
4. **Sugestão de encaminhamento com justificativa** — embutido no prompt
5. **Modo "conduta rápida" vs "análise completa"** — toggle por mensagem

Decisões do usuário:
- Features 1, 2 e 4 embutidas na resposta do `/analyze` via prompt (zero custo LLM extra).
- Resumo para prontuário: botão por sessão, gerado sob demanda, cacheado, modal com copiar.
- Modo rápido/completo: seletor por mensagem no CaseInput; modo rápido usa chamada LLM única (pula fase 1 `collectAnalysis`).
- Nenhuma feature gated por plano Pro.

## 1. Alertas de medicação (prompt)

`REVIEW_PROMPT` em `backend/src/services/openrouter.js` ganha seção obrigatória
`## Alertas de medicação` na estrutura da análise completa, posicionada após `## Tratamento`:

- Contraindicações dos medicamentos sugeridos no caso concreto
- Interações relevantes com medicamentos em uso declarados
- Ajustes necessários: idosos, gestantes/lactantes, função renal/hepática, comorbidades
- Quando não houver alertas: "Sem alertas relevantes para os medicamentos sugeridos com os dados disponíveis."
- Nunca omitir a seção quando houver prescrição/sugestão farmacológica

## 2. Comparador de hipóteses (prompt)

`REVIEW_PROMPT` ganha instrução: quando houver ≥ 2 hipóteses diagnósticas relevantes,
a seção `## Diagnósticos diferenciais relevantes` deve conter tabela markdown:

| Hipótese | A favor | Contra | Como diferenciar |

- "Como diferenciar" = pergunta, exame ou achado que discrimina as hipóteses
- Hipótese principal incluída na tabela como primeira linha
- Caso com hipótese única: manter formato atual em lista, sem tabela

react-markdown já renderiza tabelas (verificar plugin remark-gfm; adicionar se ausente).

## 3. Resumo para prontuário (endpoint + UI)

**Backend:**
- Migration `014_session_prontuario.sql`: colunas `prontuario TEXT` e
  `prontuario_msg_count INTEGER` em `sessions`.
- Novo serviço `backend/src/services/prontuario.js`: gera resumo via OpenRouter
  (não-streaming) a partir das mensagens da sessão. Prompt produz texto objetivo de
  evolução médica: queixa principal, dados relevantes, hipótese, conduta, orientações.
  Sem markdown pesado — texto pronto para colar em prontuário eletrônico.
- Nova rota `POST /sessions/:id/prontuario` em `sessions.js`:
  - 404 se sessão não pertence ao usuário
  - 400 se sessão não tem nenhuma resposta do assistente
  - Cache: se `prontuario` existe e `prontuario_msg_count` == contagem atual de
    mensagens, retorna cacheado sem chamar LLM
  - Caso contrário gera, salva e retorna `{ prontuario, cached: bool }`

**Frontend:**
- `api.js`: `gerarProntuario(sessionId)`
- Dashboard: botão "Resumo p/ prontuário" no `sessionHeader` (visível quando há ≥ 1
  resposta do assistente). Abre modal com texto, botão "Copiar" (navigator.clipboard),
  estado de loading durante geração.

## 4. Encaminhamento com justificativa (prompt)

Seção `## Orientações e critérios de retorno/encaminhamento` do `REVIEW_PROMPT`
passa a exigir, quando o caso indicar encaminhamento:

- **Tipo**: especialidade ou serviço (pronto atendimento, hospital, ambulatório especializado)
- **Prioridade**: eletivo | prioritário | urgente | emergência
- **Justificativa clínica** objetiva
- **Informações que devem acompanhar o paciente**: exames, sinais de alerta, dados do atendimento

Quando não houver indicação de encaminhamento, manter apenas critérios de retorno.

## 5. Modo rápido vs completo

**Backend:**
- `POST /analyze` aceita `mode` no body: `'rapida' | 'completa'` (default `'completa'`;
  valor inválido → 400).
- Modo completa: pipeline atual (fase 1 `collectAnalysis` + fase 2 `streamReview`).
- Modo rápida: chamada única streaming, novo `streamQuick(history, content, context, summary, res)`
  em `openrouter.js`. Prompt próprio (`QUICK_PROMPT`): resposta objetiva e curta com
  estrutura mínima: **Hipótese provável**, **Conduta**, **Prescrição** (se aplicável),
  **Alerta principal** e **Encaminhar se**. Sem diferencial extenso, sem seções longas.
  Segurança preservada: red flags e encaminhamento urgente sempre declarados.
- Pós-processamento (extractor, summarizer, embedding) igual nos dois modos.

**Frontend:**
- `CaseInput`: toggle segmentado "Conduta rápida | Análise completa" acima do textarea.
  Persistido em `localStorage('conduta_mode')`. Default: completa.
- `analyzeCase(sessionId, content, onChunk, onSessionMsgCount, mode)` envia `mode`.

## Erros e degradação

- Falha na geração do prontuário → `{error}` 500, modal mostra mensagem e permite retry.
- `mode` inválido → 400 `{error}`.
- Nenhuma mudança no comportamento de degradação do Neo4j/embeddings.

## Testes

- `openrouter-build-messages.test.js` ou novo: `streamQuick` monta mensagens corretas.
- Novo `prontuario.test.js`: rota (404/400/cache hit/cache miss) com LLM mockado.
- `analyze-sse.test.js`: `mode` inválido → 400; `mode=rapida` não chama `collectAnalysis`.
- Prompt: asserts de presença das novas seções obrigatórias nos prompts exportados.

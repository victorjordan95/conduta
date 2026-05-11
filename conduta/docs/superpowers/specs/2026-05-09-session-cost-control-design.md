# Controle de Custo por Sessão Longa

**Data:** 2026-05-09  
**Status:** Aprovado  

---

## Problema

O endpoint `/analyze` envia o histórico completo de mensagens da sessão ao LLM a cada chamada. O custo por análise cresce linearmente com o tamanho da sessão: uma sessão com 20 mensagens custa ~10× mais que uma com 2. Usuários que mantêm sessões longas consomem tokens de forma desproporcional sem nenhum controle de custo.

---

## Solução

Três mudanças coordenadas, sem alteração de banco de dados e sem novos endpoints.

---

## Arquitetura

### 1. Backend — Janela deslizante (`openrouter.js`)

Em vez de enviar `history` completo ao LLM, enviar apenas as **últimas 6 mensagens** do array misto (user + assistant), equivalente a 3 trocas:

```
history.slice(-6) + sessionSummary (system message) → LLM
```

O `sessionSummary` (`{hipotese, conduta, alertas[]}`) já existe no banco e é enviado como system message a partir da 2ª mensagem — ele cobre o contexto clínico inicial. Juntos, os dois formam o contexto suficiente sem crescimento ilimitado.

**Resultado:** custo por análise torna-se constante a partir da 4ª mensagem da sessão.

**Degradação graciosa:** se `sessionSummary` for `null` (sessão nova, ainda sem summary gerado), o histórico completo é enviado — seguro porque sessões novas têm poucos tokens.

Constante configurável: `MAX_HISTORY_MESSAGES = 6`

---

### 2. Backend — Contagem de mensagens no SSE (`analyze.js`)

Emitir a contagem de mensagens `role='user'` da sessão como **primeiro evento SSE**, antes do conteúdo:

```
data: {"session_msg_count": 10}
data: {"content": "..."}
...
data: [DONE]
```

A contagem é obtida do `history` já buscado — sem query extra. O frontend usa esse número para acionar os avisos.

---

### 3. Frontend — Avisos progressivos (`Dashboard.jsx`)

A contagem de mensagens vem de duas fontes:
- **Sessão carregada:** primeiro evento SSE com `session_msg_count`
- **Conversa ativa:** contagem local do array `messages` no estado React (mensagens com `role === 'user'`)

Dois limiares de aviso, renderizados condicionalmente acima do `CaseInput`:

| Contagem de mensagens do usuário | Comportamento |
|---|---|
| ≥ 8 | Banner amarelo: *"Contexto longo — mensagens antigas foram resumidas"* |
| ≥ 16 | Banner laranja com botão *"Nova sessão"* — abre nova sessão (não bloqueia) |

O segundo limiar é uma sugestão, não uma barreira. O médico pode ignorar e continuar.

---

## O que não muda

- Limite mensal de 15 análises/mês (free) — inalterado
- Rate limit de 10 req/min por usuário — inalterado
- `usageCheck.js` middleware — inalterado
- Schema do banco — nenhuma migration necessária
- Criação de múltiplas sessões (preocupação de bypass) já é coberta pelo limite mensal global — não há vulnerabilidade real

---

## Fluxo de dados

```
Usuário envia mensagem
  → usageCheck (limite mensal)
  → analyze.js busca history + summary
  → history.slice(-6) enviado ao LLM (openrouter.js)
  → SSE: evento {session_msg_count} → eventos {content} → [DONE]
  → Frontend atualiza contagem e exibe banner se necessário
```

---

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `backend/src/services/openrouter.js` | Adicionar `MAX_HISTORY_MESSAGES = 6`; truncar `history` antes de montar `messages` |
| `backend/src/routes/analyze.js` | Emitir evento SSE `{session_msg_count}` antes de iniciar stream |
| `frontend/src/pages/Dashboard.jsx` | Ler `session_msg_count` do SSE; manter contagem local; renderizar banners |
| `frontend/src/services/api.js` | Parsear evento `session_msg_count` no handler SSE de `analyzeCase()` |

---

## Critérios de sucesso

- Sessões longas (> 6 mensagens) não aumentam o custo por chamada ao LLM
- Médicos recebem aviso visual ao atingir 8 e 16 mensagens na sessão
- Nenhuma funcionalidade existente é bloqueada ou degradada
- Sem novas migrations de banco de dados

# Coachmarks de Onboarding + Sistema de Bonificação por Feedback

**Data:** 2026-05-08  
**Escopo:** Duas features independentes com um ponto de integração (créditos de análise)

---

## 1. Coachmarks de Onboarding

### Objetivo

Guiar médicos na primeira utilização do dashboard sem exigir documentação externa. O tour aparece uma única vez por usuário, em dois momentos distintos.

### Banco de dados

Migration adiciona duas colunas à tabela `users`:

```sql
ALTER TABLE users
  ADD COLUMN coachmarks_welcome_seen BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN coachmarks_session_seen BOOLEAN NOT NULL DEFAULT FALSE;
```

### API

`PATCH /auth/me/coachmarks` (rota protegida, requer JWT)

- Body: `{ "type": "welcome" | "session" }`
- Marca a coluna correspondente como `true` para o usuário autenticado
- Responde `{ ok: true }`
- `/auth/me` passa a incluir `coachmarks_welcome_seen` e `coachmarks_session_seen` na resposta

### Frontend — componente `Coachmark.jsx`

Overlay semitransparente sobre toda a tela. Spotlight com borda iluminada sobre o elemento ativo. Tooltip com título, descrição e botões "Pular" / "Próximo →" (último passo: "Concluir").

Ao clicar em "Pular" ou "Concluir": chama `PATCH /auth/me/coachmarks` com o type correspondente e desmonta o componente.

**Tour 1 — "Bem-vindo"** (`type: 'welcome'`)  
Trigger: Dashboard monta e `user.coachmarks_welcome_seen === false`  
Passos:
1. **Sidebar** — "Crie um novo caso clínico pelo painel lateral para começar"

**Tour 2 — "Sessão"** (`type: 'session'`)  
Trigger: usuário cria uma **nova** sessão e `user.coachmarks_session_seen === false`. Não dispara ao carregar uma sessão existente.  
Implementação: Sidebar recebe callback `onNewSession(id)` separado de `onSelectSession(id)`. `handleNewCase` chama `onNewSession`; Dashboard usa isso para distinguir criação de seleção e acionar o tour.  
Passos:
1. **Input** — "Descreva o caso clínico para iniciar a análise"
2. **Botões 👍/👎** — "Avalie as respostas — feedbacks corretos validados pelo time são bonificados com créditos extras"
3. **Painel de entidades** — "Diagnósticos e medicamentos extraídos automaticamente do caso"

### Reset para testes

Feito diretamente no banco, sem endpoint exposto:
```sql
UPDATE users
SET coachmarks_welcome_seen = false, coachmarks_session_seen = false
WHERE id = '<user_id>';
```

---

## 2. Sistema de Bonificação por Feedback Validado

### Objetivo

Incentivar médicos a reportarem erros nas respostas da IA. Feedbacks negativos só entram no grafo de conhecimento após validação do admin — evitando treinamento errado. Feedbacks validados concedem +2 análises ao usuário.

### Banco de dados

Migration adiciona coluna à tabela `users`:

```sql
ALTER TABLE users ADD COLUMN bonus_credits INT NOT NULL DEFAULT 0;
```

### Mudança no fluxo de feedback negativo (`feedback.js`)

**Antes:** `Correcao` criada com `status: 'active'` imediatamente.  
**Depois:** `Correcao` criada com `status: 'pending_validation'`.

A deleção dos nós `pending` da sessão no Neo4j continua acontecendo imediatamente (o caso está incorreto independentemente da validação).

A `Correcao` só é usada nas buscas do grafo quando `status = 'active'` — portanto fica inerte até o admin aprovar.

### Admin — novas rotas (`admin-feedback.js`)

**`PUT /admin/feedbacks/:nodeId/validate`**
1. Muda `Correcao.status` de `pending_validation` para `active`
2. Obtém `sessionId` da `Correcao`
3. Busca `user_id` da sessão no PostgreSQL
4. Executa `UPDATE users SET bonus_credits = bonus_credits + 2 WHERE id = $userId`
5. Responde `{ ok: true, creditsGranted: 2 }`

**`PUT /admin/feedbacks/:nodeId/reject`**
1. Muda `Correcao.status` para `inactive`
2. Responde `{ ok: true }`

**`GET /admin/feedbacks`** (já existente — ajuste)  
Passa a retornar `status` e `sessionId` de cada `Correcao`. Itens `pending_validation` ordenados primeiro.

### Verificação de uso (`usageCheck.js`)

```js
// Antes
if (used >= limit) { ... }

// Depois
if (used >= limit + bonus_credits) { ... }
```

`bonus_credits` é buscado junto com `used` na query de uso mensal.

### Frontend admin

Na listagem de correções (`/admin/feedbacks`):
- Cada item exibe badge de status (`pending_validation` destacado em amarelo, `active` em verde, `inactive` em cinza)
- Itens `pending_validation` ganham dois botões: **"Validar ✓"** e **"Rejeitar ✗"**
- Após ação, item atualiza status na tela sem recarregar a lista

---

## 3. Ferramentas de Teste para Admin

### Crédito manual (`admin.js` ou `admin-feedback.js`)

**`POST /admin/users/:id/grant-credits`**
- Body: `{ "amount": N }` (inteiro positivo, máximo 100 por chamada)
- Executa `UPDATE users SET bonus_credits = bonus_credits + $amount WHERE id = $id`
- Responde `{ ok: true, bonusCredits: <novo_total> }`

**Frontend admin** (tela de gestão de usuários):
- Botão **"+ Créditos"** por usuário
- Abre input inline para digitar o valor e confirmar

---

## Pontos de integração

| Feature | Depende de |
|---|---|
| Tour 2 (sessão) | `activeSessionId` no Dashboard |
| Bonificação | `sessionId` na `Correcao` → `user_id` na sessão |
| Verificação de uso | `bonus_credits` na tabela `users` |

## Fora de escopo

- Histórico de créditos concedidos (só o total acumulado é armazenado)
- Notificação ao usuário quando crédito é concedido
- Expiração de créditos

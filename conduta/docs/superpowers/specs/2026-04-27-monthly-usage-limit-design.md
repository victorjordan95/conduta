# Limite Mensal de Análises por Plano

**Data:** 2026-04-27  
**Status:** Aprovado

## Contexto

Para o lançamento, é necessário controlar o consumo de tokens da API OpenRouter evitando que usuários Free realizem análises ilimitadas. A landing page define dois planos: **Gratuito (15 análises/mês)** e **Pro (ilimitado, R$39,90/mês)**.

## Objetivo

- Bloquear usuários Free ao atingir 15 análises no mês corrente
- Mostrar contador visível no Dashboard ("X/15 análises usadas este mês")
- Exibir CTA de upgrade ao esgotar o limite
- Admins e usuários Pro nunca são bloqueados

## Arquitetura

### Banco de dados

**Migration `008_user_plan.sql`**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(10) NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro'));

CREATE INDEX IF NOT EXISTS idx_messages_session_created_user
  ON messages(session_id, created_at)
  WHERE role = 'user';
```

**Query de contagem mensal** (reutilizada em `/usage` e no middleware):
```sql
SELECT COUNT(*) FROM messages m
JOIN sessions s ON s.id = m.session_id
WHERE s.user_id = $1
  AND m.role = 'user'
  AND m.created_at >= date_trunc('month', NOW())
  AND m.created_at < date_trunc('month', NOW()) + interval '1 month'
```

### Backend

**`src/config/plans.js`**
```js
module.exports = {
  free: { analysesPerMonth: 15 },
  pro:  { analysesPerMonth: Infinity },
};
```

**`src/middleware/usageCheck.js`**
- Executa a query de contagem para o `req.userId`
- Admins (`req.userRole === 'admin'`) e Pro (`req.userPlan === 'pro'`) passam direto
- Se `used >= limit`: retorna `HTTP 429 { error, used, limit, plan }`
- Caso contrário: popula `req.usageUsed` e `req.usageLimit` e chama `next()`

**`GET /usage`**
- Protegido por `authMiddleware`
- Retorna `{ used: Number, limit: Number | null, plan: 'free' | 'pro' }`
- `limit: null` para Pro (ilimitado)

**`POST /analyze`** — pipeline atualizado:
```
authMiddleware → usageCheck → analyzeLimiter → analyzeRoutes
```

**`PUT /admin/users/:id/plan`**
- Protegido por `authMiddleware` + `adminMiddleware`
- Body: `{ plan: 'free' | 'pro' }`
- Retorna o usuário atualizado com o novo plano
- Ponto de extensão para futura integração com webhook do Stripe

**Login e signup** — respostas incluem `plan` no objeto `user`:
```json
{ "id": "...", "email": "...", "nome": "...", "role": "user", "plan": "free" }
```

### Frontend

**`AuthContext`**
- Sem mudança de lógica — `plan` já chegará no objeto `user` do login/signup e será persistido no `localStorage`

**`UsageCounter` (novo componente)**
- Renderizado no `Dashboard` apenas para `user.plan === 'free'`
- Busca `GET /usage` no mount
- Atualizado após cada análise bem-sucedida (callback do `CaseInput`)
- UI: texto `"X / 15 análises usadas este mês"` + barra de progresso
- Barra fica vermelha em ≥ 13/15 (área de alerta)

**`CaseInput` — comportamento com limite atingido**
- Se `used >= limit`:
  - Botão de envio desabilitado
  - Banner exibido acima do input:
    > "Você atingiu seu limite de 15 análises este mês."  
    > `[Assinar Pro — R$39,90/mês]` → link para `/#precos`
- Se a API retornar 429 (fallback): atualiza estado de usage localmente e exibe o mesmo banner

**Pro users:** nenhum contador exibido, experiência sem fricção.

## Peças de implementação

| Arquivo | Ação |
|---|---|
| `backend/src/db/migrations/008_user_plan.sql` | novo — coluna `plan` + índice |
| `backend/src/config/plans.js` | novo — limites por plano |
| `backend/src/middleware/usageCheck.js` | novo — verifica cota antes do analyze |
| `backend/src/routes/usage.js` | novo — `GET /usage` |
| `backend/src/routes/admin.js` | editar — adicionar `PUT /admin/users/:id/plan` |
| `backend/src/routes/auth.js` | editar — incluir `plan` nas respostas de login/signup |
| `backend/src/app.js` | editar — montar `/usage` e atualizar pipeline do `/analyze` |
| `backend/src/db/migrate.js` | editar — garantir que migration 008 roda |
| `frontend/src/context/AuthContext.jsx` | editar — garantir persistência de `plan` |
| `frontend/src/components/UsageCounter.jsx` | novo — contador + barra de progresso |
| `frontend/src/components/CaseInput.jsx` | editar — banner de upgrade + desabilitar input |
| `frontend/src/pages/Dashboard.jsx` | editar — montar `UsageCounter` para Free users |

## Decisões explícitas

- **O que conta como "análise":** cada `POST /analyze` com mensagem do usuário = 1 análise (independente de ser primeira mensagem da sessão ou continuação)
- **Reset do contador:** automático — a query sempre usa `date_trunc('month', NOW())`, não há cron necessário
- **Upgrade manual por ora:** sem Stripe; admin usa `PUT /admin/users/:id/plan` após confirmação de pagamento
- **Admins nunca são bloqueados**, independente do plano configurado

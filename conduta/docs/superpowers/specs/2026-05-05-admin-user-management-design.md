# Design: Admin — Gestão de Usuários

**Data:** 2026-05-05  
**Escopo:** Bloco A do roadmap de completude do Conduta  
**Objetivo:** Dar ao admin uma interface para listar, alterar plano e desativar usuários, sem precisar usar a API diretamente.

---

## Contexto

O backend já possui `PUT /admin/users/:id/plan` para upgrade de plano. Faltam: listagem de usuários, endpoint de ativação/desativação e a interface no frontend. O painel admin existe em `AdminKnowledge.jsx` com padrão de abas — o novo painel de usuários segue essa estrutura.

---

## Banco de Dados

### Migration

Adicionar coluna `active` na tabela `users`:

```sql
ALTER TABLE users ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
```

O `authMiddleware` passa a verificar `active = true` após validar o JWT. Se `active = false`, retorna 401 com `{ error: 'Conta desativada.' }`.

---

## Backend

### Rotas adicionadas em `backend/src/routes/admin.js`

**`GET /admin/users`**
- Requer `adminMiddleware`
- Query param opcional: `?search=` filtra por nome ou email (case-insensitive, ILIKE)
- Retorna: `[{ id, email, nome, role, plan, active, created_at }]`
- Ordenado por `created_at DESC`

**`PATCH /admin/users/:id/status`**
- Requer `adminMiddleware`
- Body: `{ active: boolean }`
- Se `active = false`: incrementa `session_version` do usuário (invalida todos os tokens ativos imediatamente)
- Não permite desativar usuários com `role = 'admin'` → retorna 403
- Retorna: `{ id, email, nome, role, plan, active }`

**`PUT /admin/users/:id/plan`** — já existe, sem alteração.

---

## Frontend

### Estrutura

Nova aba **"Usuários"** adicionada ao `AdminKnowledge.jsx`, seguindo o padrão de abas existente. Componente interno `UsersPanel` no mesmo arquivo.

### `UsersPanel`

**Estado:**
- `users` — lista de usuários carregada da API
- `loading` — estado de carregamento inicial
- `search` — valor do campo de busca (debounced 300ms antes de chamar API)
- `actionLoading` — `{ [userId]: 'plan' | 'status' | null }` para feedback inline por linha

**Layout:**
- Campo de busca no topo (placeholder: "Buscar por nome ou email")
- Tabela responsiva: Nome | Email | Plano | Status | Cadastro | Ações
- Coluna Ações: botão plano (alterna free ↔ pro) + botão status (ativar/desativar)
- Botão de desativar exibe confirmação inline (`window.confirm`) antes de prosseguir
- Feedback de sucesso/erro por linha, desaparece após 3s

**Proteções no frontend:**
- Linha do próprio admin logado: botões de plano e status ficam desabilitados
- Estados de loading por linha evitam cliques duplos

### Novas funções em `frontend/src/services/api.js`

```js
getAdminUsers(search)        // GET /admin/users?search=
updateUserPlan(id, plan)     // PUT /admin/users/:id/plan (já existe no backend)
updateUserStatus(id, active) // PATCH /admin/users/:id/status
```

---

## Tratamento de Erros

| Cenário | Comportamento |
|---|---|
| Admin desativa a si mesmo | Frontend bloqueia (compara `user.id` com linha) |
| Admin tenta desativar outro admin | Backend retorna 403, frontend exibe erro inline |
| Busca sem resultados | Exibe "Nenhum usuário encontrado." |
| Erro de rede em ação | Exibe mensagem de erro inline na linha afetada |

---

## Testes

- **Backend:** testes de integração em `backend/src/__tests__/admin-users.test.js`
  - `GET /admin/users` retorna lista paginada
  - `GET /admin/users?search=` filtra corretamente
  - `PATCH /admin/users/:id/status` desativa usuário e incrementa session_version
  - `PATCH /admin/users/:id/status` retorna 403 para admin
  - authMiddleware retorna 401 para usuário com `active = false`
- **Frontend:** testes unitários do `UsersPanel` com Vitest + Testing Library (mock da API)

---

## Fora do Escopo

- Criar usuário pelo painel (descartado neste ciclo)
- Paginação server-side (volume atual não justifica; busca client-side + ILIKE é suficiente)
- Histórico de ações do admin (audit log)

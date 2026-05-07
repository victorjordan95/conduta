# Design: Experiência do Médico — Bloco B

**Data:** 2026-05-06  
**Escopo:** Bloco B do roadmap de completude do Conduta  
**Objetivo:** Dar ao médico controle sobre seus casos e acesso às entidades clínicas extraídas, sem precisar de suporte técnico.

---

## Contexto

O backend já possui `GET /sessions`, `POST /sessions`, `GET /sessions/:id`. Faltam: renomear/excluir sessões, exportar análise em PDF, buscar por título na sidebar e visualizar diagnósticos/medicamentos extraídos por sessão.

---

## Features

### 1. Renomear e Excluir Sessões

**Interação:** Menu kebab (⋯) aparece ao passar o mouse ou na sessão ativa. Dropdown com "Renomear" e "Excluir".

- **Renomear:** input inline substitui o título, Enter salva, Esc cancela.
- **Excluir:** `window.confirm` antes de chamar API; remove da lista local no sucesso; se a sessão excluída estava ativa, limpa o chat.

### 2. Buscar Sessões no Histórico

Campo de busca no topo da sidebar. Filtragem client-side por título (case-insensitive). Sem chamada extra à API — a lista já está carregada no estado.

### 3. Exportar Análise em PDF

Botão "Exportar PDF" no header da sessão ativa, visível apenas quando a sessão tem `summary` gerado. Clique faz download do PDF gerado pelo backend.

**Conteúdo do PDF:**
1. Título da sessão
2. Primeira mensagem do usuário (o caso clínico apresentado)
3. Resumo estruturado: hipótese diagnóstica, conduta proposta, alertas

### 4. Entidades Extraídas por Sessão

Painel colapsável no rodapé da área de chat (abaixo das mensagens). Recolhido por padrão, mostra "▾ Entidades extraídas (N)". Ao expandir, faz `GET /sessions/:id/entities` e exibe:
- Tags amarelas: diagnósticos (nome + CID se disponível)
- Tags verdes: medicamentos (nome + classe)
- Indicação sutil de status: pendente (aguardando revisão admin) ou verificado

---

## Backend

### Dependências

`pdfkit` movido de `devDependencies` para `dependencies` em `backend/package.json` — necessário para Railway.

### Rotas adicionadas em `backend/src/routes/sessions.js`

**`PUT /sessions/:id`**
- Requer `authMiddleware`
- Body: `{ titulo: string }` (não-vazio, máx 100 chars)
- Verifica que `user_id = req.userId` → 404 se não pertence ao usuário
- Retorna: `{ id, titulo, created_at }`

**`DELETE /sessions/:id`**
- Requer `authMiddleware`
- Deleta mensagens (via `DELETE FROM messages WHERE session_id = $1`) depois a sessão
- Verifica posse da sessão → 404 se não pertence ao usuário
- Retorna 204

**`GET /sessions/:id/entities`**
- Requer `authMiddleware`
- Verifica posse da sessão → 404 se não pertence ao usuário
- Consulta Neo4j: nós `Diagnostico` e `Medicamento` com `sourceSessionId = id` e `status IN ['pending', 'verified']`
- Retorna: `{ diagnosticos: [{nome, cid, status}], medicamentos: [{nome, classe, viaAdmin, status}] }`
- Se Neo4j indisponível: retorna `{ diagnosticos: [], medicamentos: [] }` sem erro 500

**`GET /sessions/:id/pdf`**
- Requer `authMiddleware`
- Verifica posse da sessão → 404 se não pertence ao usuário
- Busca no PostgreSQL: título, summary, primeira mensagem com `role = 'user'`
- Se não há summary: retorna 400 com `{ error: 'Resumo ainda não gerado para esta sessão.' }`
- Gera PDF com `pdfkit`, retorna como stream
- Headers: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="caso-<titulo>.pdf"`

---

## Frontend

### `frontend/src/components/Sidebar.jsx`

- Campo de busca no topo (placeholder: "Buscar caso...")
- Estado `search` filtra `sessions` client-side por título (case-insensitive)
- Cada item de sessão: botão ⋯ visível no hover e na sessão ativa
- Clique em ⋯: dropdown posicionado absolutamente com "Renomear" e "Excluir"
- Renomear: estado `editingId` + `editingTitulo`; input inline; `onBlur`/Enter salva via `renameSession()`; Esc cancela
- Excluir: `window.confirm` → `deleteSession()` → remove da lista; se era a sessão ativa, chama callback `onSessionDeleted`

### `frontend/src/pages/Dashboard.jsx`

- Prop `onSessionDeleted` recebida da Sidebar: limpa `activeSessionId` e `messages`
- Botão "Exportar PDF" no header da sessão, visível só quando `activeSession.summary` existe
  - Chama `downloadSessionPdf(id, titulo)`: fetch → blob → `URL.createObjectURL` → clique programático
- Painel de entidades: componente `EntitiesPanel` inline no Dashboard, renderizado abaixo de `messages`
  - Props: `sessionId`, `sessionChanged` (reset quando muda de sessão)
  - Estado: `open` (boolean), `entities` (`{diagnosticos, medicamentos}`), `loading`, `error`
  - Ao abrir pela primeira vez: busca `getSessionEntities(sessionId)`
  - Reset de estado quando `sessionId` muda

### `frontend/src/services/api.js`

```js
renameSession(id, titulo)      // PUT /sessions/:id
deleteSession(id)              // DELETE /sessions/:id  (já existia sem backend)
getSessionEntities(id)         // GET /sessions/:id/entities
downloadSessionPdf(id, titulo) // GET /sessions/:id/pdf → blob download
```

---

## Tratamento de Erros

| Cenário | Comportamento |
|---|---|
| Renomear com título vazio | Frontend bloqueia (valida antes de enviar) |
| Excluir sessão ativa | Chat é limpo; sidebar remove o item |
| PDF sem summary gerado | Backend retorna 400; frontend exibe toast de erro |
| Neo4j fora ao buscar entidades | Backend retorna arrays vazios; frontend exibe "Nenhuma entidade encontrada." |
| Sessão de outro usuário | Backend retorna 404 em todos os endpoints |

---

## Testes

**Backend** em `backend/src/__tests__/sessions-management.test.js`:
- `PUT /sessions/:id` — renomeia com sucesso, 400 título vazio, 404 sessão de outro usuário, 401 sem token
- `DELETE /sessions/:id` — deleta com sucesso, 404 sessão de outro usuário, 401 sem token
- `GET /sessions/:id/pdf` — retorna Content-Type `application/pdf`, 400 sem summary, 404 sessão de outro usuário
- `GET /sessions/:id/entities` — retorna estrutura `{ diagnosticos, medicamentos }`, 404 sessão de outro usuário

---

## Fora do Escopo

- Paginação de sessões (volume atual não justifica)
- Editar mensagens individuais
- Compartilhar análise por link
- Histórico de versões do título

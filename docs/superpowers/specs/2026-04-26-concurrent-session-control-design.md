---
title: Controle de sessão concorrente (kick-out)
date: 2026-04-26
status: approved
---

## Problema

O sistema usa JWT stateless com expiração de 8h. Não há controle de sessões ativas, portanto um mesmo usuário pode fazer login em múltiplos dispositivos simultaneamente — ou compartilhar credenciais sem restrição.

## Decisão

**Kick-out via `session_version`:** ao fazer login, incrementa-se um inteiro em `users.session_version` e esse valor é embutido no JWT (`sv`). Em cada requisição autenticada, o middleware compara `payload.sv` com o valor atual no banco. Se divergirem, o token é considerado invalidado.

## Arquitetura

### Banco de dados

Nova coluna: `users.session_version INTEGER NOT NULL DEFAULT 1`

Migração: `007_session_version.sql`

### Backend

**`routes/auth.js` — login:**
1. Valida credenciais (fluxo existente)
2. `UPDATE users SET session_version = session_version + 1 WHERE id = $1 RETURNING session_version`
3. Embute `sv` no JWT payload

**`middleware/auth.js`:**
1. Verifica assinatura JWT (fluxo existente)
2. Rejeita tokens sem claim `sv` (tokens legados)
3. `SELECT session_version FROM users WHERE id = $1`
4. Se `payload.sv !== session_version` → 401 `{ error: '...', code: 'SESSION_KICKED' }`

### Frontend

**`services/api.js`:**
- `checkUnauthorized` vira async
- Lê body do 401 para detectar `code: SESSION_KICKED`
- Dispatch `CustomEvent('conduta:unauthorized', { detail: { message } })`
- Todos os call sites recebem `await`

**`context/AuthContext.jsx`:**
- Novo state `kickMessage`
- Handler do evento popula `kickMessage` antes de limpar auth
- `saveAuth` limpa `kickMessage`
- Expõe `kickMessage` no contexto

**`pages/Login.jsx`:**
- Lê `kickMessage` do contexto
- Exibe como aviso visual distinto do erro de credencial (cor `$color-warning`)

## Trade-offs aceitos

- 1 query extra no banco por requisição autenticada (custo mínimo para este volume)
- Todos os tokens existentes são invalidados no primeiro deploy (usuários fazem login novamente uma vez)

## Não está no escopo

- Limite de N sessões simultâneas
- Notificação por e-mail de kick-out
- Log de auditoria de kick-outs

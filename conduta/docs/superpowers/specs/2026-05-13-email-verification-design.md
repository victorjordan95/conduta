# Email Verification & Password Recovery — Design

**Data:** 2026-05-13  
**Projeto:** Conduta  
**Escopo:** Verificação de conta por email (bloqueante) + recuperação de senha via email  
**Provedor:** Resend (tier gratuito, 3.000 emails/mês)

---

## Objetivo

Adicionar dois fluxos de email ao Conduta:

1. **Verificação de conta** — usuário só acessa o app após confirmar o email recebido no cadastro.
2. **Recuperação de senha** — usuário esquece a senha, solicita link, redefine via email.

Usuários já cadastrados antes dessa feature são automaticamente marcados como verificados (migration aplica `UPDATE users SET email_verified = TRUE`).

---

## Arquitetura

### Token no JWT

O campo `ev` (email_verified: boolean) é incluído no payload JWT em todos os endpoints que emitem tokens (`/auth/login`, `/auth/verify-email`). O middleware de auth já valida o JWT a cada request — sem query extra no banco por verificação.

### Variáveis de ambiente novas

| Variável | Descrição |
|----------|-----------|
| `RESEND_API_KEY` | Chave da API Resend (`re_...`) |
| `FRONTEND_URL` | URL de produção do frontend (já existe para Stripe) |

Remetente: `onboarding@resend.dev` enquanto o domínio não estiver configurado no Resend. Após configurar domínio: `noreply@conduta.med.br`.

---

## Backend

### Migration `013_email_verification.sql`

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_reset_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

UPDATE users SET email_verified = TRUE WHERE email_verified IS FALSE OR email_verified IS NULL;
```

### Serviço `backend/src/services/email.js`

Wrapper do SDK Resend. Duas funções exportadas:

- `sendVerificationEmail(to, nome, token)` — link `${FRONTEND_URL}/verify-email?token=<token>`, expiração 24h
- `sendPasswordResetEmail(to, nome, token)` — link `${FRONTEND_URL}/reset-password?token=<token>`, expiração 1h

Templates HTML simples inline (sem biblioteca de template). Se o Resend retornar erro, o erro é logado e relançado para o caller tratar.

### Geração de tokens

`crypto.randomBytes(32).toString('hex')` — 64 chars hex, salvo diretamente na coluna correspondente com timestamp de expiração.

### Rotas alteradas/novas em `backend/src/routes/auth.js`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/auth/signup` | — | Gera `email_verification_token` (exp 24h), envia email, retorna `{pending: true}` em vez de JWT |
| `GET` | `/auth/verify-email` | — | Query param `?token=`. Valida token e expiração, seta `email_verified=TRUE`, limpa token, retorna JWT com `ev: true` |
| `POST` | `/auth/resend-verification` | — | Body `{email}`. Gera novo token, reenvia email. Rate limit: não gera novo token se o existente ainda expira em mais de 23h. Retorna 200 mesmo se email não encontrado (evita user enumeration). |
| `POST` | `/auth/forgot-password` | — | Body `{email}`. Gera `password_reset_token` (exp 1h), envia email. Retorna 200 sempre (evita user enumeration). |
| `POST` | `/auth/reset-password` | — | Body `{token, nova_senha}`. Valida token e expiração, valida senha (mín 8 chars, 1 maiúscula, 1 número), atualiza hash, limpa token, incrementa `session_version` (invalida sessões ativas). Retorna 200. |
| `POST` | `/auth/login` | — | Além das validações existentes, verifica `email_verified`. Se falso, retorna `403 {error: 'Email não verificado.', code: 'EMAIL_NOT_VERIFIED'}` |

### Middleware `backend/src/middleware/auth.js`

Após validar o JWT, checa `payload.ev`. Se `ev !== true`, retorna:
```json
{"error": "Email não verificado.", "code": "EMAIL_NOT_VERIFIED"}
```
com status `403`.

---

## Frontend

### Novas páginas

| Arquivo | Rota | Descrição |
|---------|------|-----------|
| `VerifyEmailPending.jsx` | `/verify-pending` | Card com instrução para checar email + botão "Reenviar email". Recebe `email` via `location.state`. Se acessado sem state, redireciona para `/register`. |
| `VerifyEmail.jsx` | `/verify-email` | Lê `?token=` da URL. Chama `verifyEmail(token)` no mount. Em sucesso: chama `saveAuth` e redireciona para `/`. Em erro: mostra mensagem com link para `/register`. |
| `ForgotPassword.jsx` | `/esqueci-senha` | Campo email + botão. Após envio bem-sucedido, substitui o formulário por mensagem "Se esse email estiver cadastrado, você receberá as instruções." |
| `ResetPassword.jsx` | `/reset-password` | Lê `?token=` da URL. Formulário de nova senha com os mesmos requisitos do `Register.jsx` (8 chars, 1 maiúscula, 1 número). Após sucesso, redireciona para `/login`. |

Todas usam o mesmo layout do `Login.jsx` (card centralizado, branding Conduta). Reutilizam o CSS de `Login.module.scss` sem adicionar arquivos de estilo novos.

### Alterações em arquivos existentes

**`Register.jsx`:** após signup bem-sucedido, em vez de `saveAuth`, faz `navigate('/verify-pending', { state: { email } })`.

**`Login.jsx`:** adiciona link `<Link to="/esqueci-senha">Esqueceu a senha?</Link>` abaixo do botão de login.

**`App.jsx`:** registra as 4 rotas novas como rotas públicas (fora do `PrivateRoute`).

**`api.js`:** 4 funções novas:
- `verifyEmail(token)` → `GET /auth/verify-email?token=`
- `resendVerification(email)` → `POST /auth/resend-verification`
- `forgotPassword(email)` → `POST /auth/forgot-password`
- `resetPassword(token, novaSenha)` → `POST /auth/reset-password`

**`AuthContext.jsx`:** a função `checkUnauthorized` já trata 401. Adicionar tratamento de `403 + code === 'EMAIL_NOT_VERIFIED'`: redireciona para `/verify-pending` sem limpar o auth state (usuário ainda não tem token nesse momento).

---

## Fluxos completos

### Cadastro → verificação
```
Register → POST /auth/signup
         → {pending: true}
         → /verify-pending (com email no state)
         → clica link no email
         → /verify-email?token=xxx
         → GET /auth/verify-email?token=xxx
         → {token, user}
         → saveAuth → /
```

### Login com email não verificado
```
Login → POST /auth/login
      → 403 {code: 'EMAIL_NOT_VERIFIED'}
      → frontend mostra erro + link para /verify-pending
```

### Recuperação de senha
```
Login → "Esqueceu a senha?" → /esqueci-senha
      → POST /auth/forgot-password
      → {ok: true} → mensagem de sucesso na mesma página
      → clica link no email
      → /reset-password?token=xxx
      → POST /auth/reset-password
      → {ok: true} → redireciona para /login
```

---

## Segurança

- Tokens gerados com `crypto.randomBytes(32)` — resistente a brute force
- Expiração: 24h para verificação, 1h para reset de senha
- Reset de senha incrementa `session_version` — invalida todos os JWTs ativos do usuário
- Endpoints públicos que recebem email retornam 200 independente de o usuário existir (evita user enumeration)
- Reenvio não gera novo token se o anterior ainda tem mais de 23h de vida (evita spam)

---

## Testes

**Backend (`__tests__/email-verification.test.js`):**
- Signup retorna `{pending: true}` e não retorna JWT
- Signup com email duplicado retorna 409
- `/verify-email` com token válido retorna JWT com `ev: true`
- `/verify-email` com token expirado retorna 400
- `/resend-verification` retorna 200 mesmo para email inexistente
- Login com email não verificado retorna 403 + `EMAIL_NOT_VERIFIED`
- Login com email verificado retorna JWT normalmente
- `/forgot-password` retorna 200 sempre
- `/reset-password` com token válido atualiza senha
- `/reset-password` com token expirado retorna 400

Email service mockado nos testes — nunca chama Resend real.

**Frontend (`__tests__/VerifyEmail.test.jsx`):**
- Exibe estado de carregamento no mount
- Redireciona para `/` em caso de sucesso
- Exibe erro em caso de token inválido

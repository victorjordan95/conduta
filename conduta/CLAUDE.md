# Conduta — Developer Guidelines

Conduta is a clinical decision support system for general practitioners. Doctors submit clinical cases and receive AI-assisted analysis enriched by a curated medical knowledge graph.

---

## Git Workflow
- Always push commits to remote after committing locally — do not consider work 'done' until pushed
- Before pushing to main/develop, pull first to avoid rejected pushes from remote changes
- Never hardcode tokens, API keys, or test credentials in committed code — revert these before commit

## Deployment & Environment
- Backend deploys to **Railway**, frontend deploys to **Vercel** — verify env vars and port configs match platform expectations
- The project uses **bcryptjs** (NOT bcrypt) — use bcryptjs in all hashing code and examples
- When providing example credentials/passwords, use clearly placeholder values like `<YOUR_PASSWORD_HERE>` so the user doesn't paste literal placeholders
- Put `@types/*` packages in `dependencies` (not `devDependencies`) if imported by production code — Railway builds will fail otherwise
- `VITE_API_URL` controls the frontend's backend target; defaults to `/api` for proxied local dev
- `CORS_ORIGIN` must include all frontend origins (comma-separated) — CORS errors are often just a missing env var

## Diagnosis Discipline
- Before proposing a root cause for a bug, verify with logs/code/tests rather than guessing
- For login/CORS/auth failures, check backend startup logs first for crashes from undefined env vars before assuming a CORS or routing issue
- If user disputes your diagnosis with evidence (screenshot, logs), pivot immediately rather than defending the original theory

---

## Architecture

**Dual-database design:**
- **PostgreSQL** — transactional data: users, sessions, messages, feedback, embeddings (pgvector)
- **Neo4j** — mutable clinical knowledge graph: Diagnostico, Medicamento, DocumentoChunk, Correcao, RedFlag nodes

**LLM pipeline (OpenRouter):**
- Main response: streaming SSE via `/analyze`
- Fire-and-forget after each response: entity extraction, session summarization, message embedding
- All LLM calls go through OpenRouter; model set via `OPENROUTER_MODEL` env var

**Key data flow:**
1. User submits case → middleware checks JWT + usage limit
2. On first message: parallel Neo4j keyword/vector search + PostgreSQL embedding similarity search
3. Context injected into system prompt → LLM streams response
4. Post-stream (non-blocking): extract entities into Neo4j, summarize session, embed user message
5. Feedback on a message: positive → approves pending Neo4j nodes; negative → deletes pending nodes + creates Correcao correction node

---

## Tech Stack

**Backend:** Node.js, Express 4, PostgreSQL (`pg`), Neo4j (`neo4j-driver`), JWT (`jsonwebtoken`), bcryptjs, OpenRouter (OpenAI-compatible client), Multer, pdf-parse, pdfkit, express-rate-limit, helmet  
**Frontend:** React 18, Vite, React Router 6, react-markdown, SCSS modules  
**Testing:** Jest + Supertest (backend), Vitest + Testing Library (frontend)  
**Local dev:** docker-compose with PostgreSQL + Neo4j

---

## Database Conventions

**PostgreSQL schema highlights:**
- Users: `id (UUID)`, `email`, `nome`, `senha_hash`, `role (user|admin)`, `plan (free|pro)`, `session_version`
- Sessions: `id`, `user_id`, `titulo`, `summary (JSONB: {hipotese, conduta, alertas[]})`
- Messages: `id`, `session_id`, `role (user|assistant)`, `content`, `feedback`, `feedback_note`, `embedding (vector(1536))`
- HNSW index on `messages.embedding` — do not drop it, cosine similarity search depends on it
- Monthly usage counted via composite index `idx_messages_session_created_user`

**Neo4j node conventions:**
- `status` field governs visibility: `pending` (from LLM extraction) → `verified` (admin approved) or deleted
- `Correcao` nodes have no pending state — they're always active until admin deactivates
- Always use `elementId` (not deprecated integer `id`) when referencing Neo4j nodes in API calls

---

## API Conventions

- All protected routes require `Authorization: Bearer <token>`
- Admin routes use `adminMiddleware` which also runs JWT validation — no need to add `authMiddleware` separately
- Non-critical service failures (Neo4j down, embedding error) must never crash the analyze endpoint — log and degrade gracefully
- The `/analyze` endpoint responds with SSE (`text/event-stream`) — do not add `res.json()` calls after streaming starts
- `session_version` in JWT payload is checked on every request — incrementing it (on new login) invalidates all other sessions for that user

---

## Auth & Security

- Login increments `session_version` — concurrent login detection is built-in; do not remove it
- Frontend dispatches `conduta:unauthorized` custom event when API returns 401 — AuthContext listens for this to clear state
- ADMIN_SECRET was removed from the frontend on purpose — all admin access is via JWT `role=admin`; do not reintroduce it
- Rate limits: login endpoint 10 req/15min per IP; analyze endpoint 10 req/min per user

---

## Plan & Usage

- Plans defined in `backend/src/config/plans.js`: `free` = 15 analyses/month, `pro` = unlimited
- Admins are always unlimited regardless of plan
- Usage is counted as user messages (`role='user'`) within the current calendar month
- Limit is enforced in `usageCheck.js` middleware — returns HTTP 429 with `{used, limit}` when exceeded

---

## Frontend Conventions

- Auth state lives in `AuthContext` (localStorage persistence) — do not manage tokens outside of it
- `api.js` in `services/` is the single gateway for all backend calls — add new calls there, never inline `fetch` in components
- `analyzeCase()` in `api.js` uses SSE — call `onChunk(chunk)` callback on each streamed token
- Messages are added to state optimistically before the server confirms IDs
- `UsageCounter` is rendered only for `plan=free` users — hide it for pro/admin

---

## Code Conventions

- Variable and function names are in **Portuguese** (medical domain language) — follow this
- Log prefixes: `[AUTH]`, `[Neo4j]`, `[extractor]`, `[analyze]`, etc. — keep them consistent
- Comments are in Portuguese for domain-specific logic
- Error responses use `{error: 'message'}` shape consistently — do not use `{message: ...}`
- JSONB columns (e.g., `session.summary`) store structured objects, not serialized strings

---

## Testing

- Backend integration tests require PostgreSQL and Neo4j running — they will fail with `AggregateError` if the DB is unreachable; this is expected in CI without services, not a code bug
- Test files live in `backend/src/__tests__/` — mirror the route/service being tested
- Frontend tests use Vitest + jsdom — run with `npm test` inside `frontend/`
- Mock OpenRouter/LLM calls in tests — never make real LLM calls in test suite
- Seed script for admin creation: `node src/db/seeds/create-admin.js <email> <nome> <senha>`

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `NEO4J_URI` | ✓ | Bolt URI (e.g. `bolt://localhost:7687`) |
| `NEO4J_USER` | ✓ | Neo4j username |
| `NEO4J_PASSWORD` | ✓ | Neo4j password |
| `JWT_SECRET` | ✓ | JWT signing secret |
| `OPENROUTER_API_KEY` | ✓ | OpenRouter API key |
| `CORS_ORIGIN` | ✓ | Comma-separated allowed origins |
| `JWT_EXPIRES_IN` | — | Token TTL, default `8h` |
| `OPENROUTER_MODEL` | — | Model ID, default `anthropic/claude-sonnet-4-5` |
| `PORT` | — | Backend port, default `3000` |
| `VITE_API_URL` | — | Frontend target URL, default `/api` |

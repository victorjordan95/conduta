# Conduta — Design Spec
**Data:** 2026-03-31
**Status:** Aprovado

---

## 1. Visão Geral

**Conduta** é uma interface web para apoio ao raciocínio clínico em USF e pronto atendimento. O médico descreve o caso em texto livre (como escreveria num prontuário) e recebe uma análise estruturada — hipótese diagnóstica, conduta, prescrição, alertas — renderizada como documento clínico, sem aparência de chat com IA.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite + SCSS |
| Backend | Node.js + Express |
| Banco relacional | PostgreSQL |
| Banco de grafo | Neo4j |
| Gateway de IA | OpenRouter |
| Auth | JWT + bcrypt |

---

## 3. Arquitetura

```
Frontend (React + Vite)
        │ REST API
Backend (Node.js/Express)
        │                    │
   PostgreSQL             Neo4j
   users                  diagnósticos
   sessions               medicamentos
   messages               condutas
   auth tokens            protocolos
                             │
                         OpenRouter
                         (LLM API gateway)
```

### Fluxo principal
1. Usuário autentica → JWT salvo no client (8h, duração de turno)
2. Digita o caso clínico em campo de texto livre
3. Backend monta contexto: system prompt + histórico da sessão + conhecimento Neo4j relevante
4. OpenRouter chama o modelo LLM configurado
5. Resposta renderizada como documento estruturado com seções colapsáveis
6. Sessão e mensagens persistidas no PostgreSQL; dados clínicos relevantes indexados no Neo4j

---

## 4. Interface (Frontend)

### Identidade visual
- Paleta: tons neutros frios (cinza-azulado, branco, preto) com acento em azul-petróleo ou verde-escuro médico
- Tipografia: Inter ou IBM Plex Sans
- Sem avatares, bolhas de chat ou ícones de robô

### Layout principal
```
┌─────────────────────────────────────────────┐
│  CONDUTA          [usuário]      [sair]      │
├──────────────┬──────────────────────────────┤
│              │                              │
│  Sessões     │   [área de resposta clínica] │
│  anteriores  │   formatada em seções:       │
│              │   • Hipótese                 │
│  > Caso 1    │   • Conduta                  │
│  > Caso 2    │   • Prescrição               │
│  > Caso 3    │   • Alertas                  │
│              │                              │
│              ├──────────────────────────────┤
│              │  ┌────────────────────────┐  │
│              │  │ Descreva o caso...     │  │
│              │  └────────────────────────┘  │
│              │        [Analisar]            │
└──────────────┴──────────────────────────────┘
```

### Decisões de UX anti-chat
- Campo de entrada chamado "Caso clínico" — não "mensagem"
- Botão "Analisar" — não "Enviar"
- Resposta como documento estruturado com seções colapsáveis, não conversa
- Sessões anteriores listadas como "casos", não "conversas"
- Indicador de progresso discreto tipo "Processando análise" — não "digitando..."
- Streaming habilitado para resposta aparecer progressivamente

---

## 5. Autenticação e Modelo de Dados

### Auth
- Login com e-mail + senha (bcrypt)
- JWT com expiração de 8h
- Cadastro manual: o próprio desenvolvedor insere usuários diretamente no banco ou via endpoint `POST /admin/users` protegido por uma chave de admin no `.env` (sem UI de cadastro nesta versão)

### PostgreSQL

```sql
users    → id, email, nome, senha_hash, created_at
sessions → id, user_id, titulo, created_at
messages → id, session_id, role (user|assistant), content, created_at
```

### Neo4j — Knowledge Base Clínica

**Nós:**
- `Diagnostico` — CID, nome, sinônimos
- `Medicamento` — nome, classe, apresentações
- `Conduta` — protocolo, fonte (PCDT, SBP etc.)
- `RedFlag` — sinal de alerta vinculado a diagnóstico

**Relacionamentos:**
- `(Diagnostico)-[:TRATA_COM]->(Medicamento)`
- `(Diagnostico)-[:EXIGE_EXCLUSAO]->(Diagnostico)`
- `(Conduta)-[:BASEADA_EM]->(Diagnostico)`
- `(Medicamento)-[:CONTRAINDICADO_EM]->(Condicao)`

Neo4j inicia vazio e é populado progressivamente com casos atendidos e dados de diretrizes (PCDT, SBP, SBC etc.).

---

## 6. Backend — Rotas e Integração OpenRouter

### Rotas (Express)
```
POST /auth/login
POST /auth/logout

GET  /sessions          → lista sessões do usuário autenticado
POST /sessions          → cria nova sessão
GET  /sessions/:id      → carrega histórico completo da sessão

POST /analyze           → endpoint principal de análise
```

### Fluxo do `/analyze`
1. Recebe `{ session_id, content }` + JWT no header Authorization
2. Valida JWT e extrai `user_id`
3. Busca histórico da sessão no PostgreSQL
4. Consulta Neo4j por termos clínicos relevantes mencionados no texto
5. Monta payload OpenRouter:
   ```
   [system prompt médico — configurado no backend]
   [contexto Neo4j relevante, se encontrado]
   [histórico da sessão]
   [nova mensagem do usuário]
   ```
6. Chama OpenRouter com streaming habilitado
7. Persiste mensagem do usuário + resposta no PostgreSQL
8. Retorna stream para o frontend

### OpenRouter
- Modelo configurável via variável de ambiente `OPENROUTER_MODEL`
- Padrão sugerido: `anthropic/claude-sonnet-4-5`
- Suporte a troca de modelo sem deploy (apenas `.env`)

### System Prompt
O system prompt médico (fornecido pelo usuário) é injetado como mensagem de sistema em toda requisição. Define identidade, estrutura de resposta, populações especiais, fontes aceitas e prioridades clínicas.

---

## 7. Estrutura do Projeto

```
conduta/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/       # SCSS
│   │   └── services/     # chamadas à API
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/     # openrouter.js, neo4j.js, pg.js
│   │   ├── middleware/   # auth JWT
│   │   └── db/           # conexões PG + Neo4j
│   └── .env
│
└── docker-compose.yml    # PostgreSQL + Neo4j local
```

---

## 8. Ambiente de Desenvolvimento

- `docker-compose up` → sobe PostgreSQL (porta 5432) + Neo4j (porta 7474/7687)
- `npm run dev` no frontend → porta 5173
- `npm run dev` no backend → porta 3000
- Deploy futuro: fora do escopo desta spec

---

## 9. Fora do Escopo (esta versão)

- OAuth / login social
- App mobile nativo
- Deploy em produção
- Integração com prontuário eletrônico
- Notificações / alertas assíncronos
- Exportação de casos em PDF

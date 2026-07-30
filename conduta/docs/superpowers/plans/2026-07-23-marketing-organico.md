# Marketing Orgânico do Conduta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a base editorial sustentável do Instagram do Conduta e um gerador local de rascunhos sem modificar funcionalidades clínicas.

**Architecture:** A documentação e os conteúdos ficam em `marketing/` como Markdown versionado. Um script Node.js puro lê o backlog e o contexto editorial, escolhe uma pauta pendente com regras de diversidade, cria um draft e atualiza o status da pauta. O script é isolado da aplicação React/Express.

**Tech Stack:** Markdown, Node.js CommonJS, `fs`, `path`, `crypto` não; Vitest apenas para o teste do gerador, sem novas dependências.

## Global Constraints

- Público principal: médicos.
- Escrever em português do Brasil.
- Não usar o termo GPT.
- Não inventar funcionalidades, fontes, casos ou dados de pacientes.
- Não publicar automaticamente nem integrar com Instagram/Meta.
- Não alterar funcionalidades clínicas existentes.
- Posts e pautas devem sinalizar validação humana quando houver conteúdo clínico específico.

### Task 1: Documentação editorial e governança

**Files:**
- Create: `marketing/README.md`
- Create: `marketing/product-audit.md`
- Create: `marketing/brand.md`
- Create: `marketing/audience.md`
- Create: `marketing/features.md`
- Create: `marketing/content-rules.md`
- Create: `marketing/content-pillars.md`
- Create: `marketing/published-posts.md`
- Create: `marketing/AGENTS.md`

- [ ] Documentar cada achado com origem verificável: site, rota, componente, arquivo, configuração ou texto institucional.
- [ ] Separar funcionalidades públicas, autenticadas, administrativas e experimentais.
- [ ] Registrar no `marketing/AGENTS.md` o fluxo de revisão humana e a proibição de alterações clínicas.

### Task 2: Pautas, calendário e comandos editoriais

**Files:**
- Create: `marketing/ideas-backlog.md`
- Create: `marketing/editorial-calendar.md`
- Create: `marketing/prompts/generate-post.md`
- Create: `marketing/prompts/generate-carousel.md`
- Create: `marketing/prompts/generate-reel.md`
- Create: `marketing/prompts/generate-stories.md`
- Create: `marketing/prompts/generate-calendar.md`
- Create: `marketing/prompts/review-medical-marketing.md`
- Create: `marketing/prompts/repurpose-post.md`
- Create: `marketing/prompts/analyze-performance.md`

- [ ] Criar exatamente 100 pautas com IDs únicos e todos os campos pedidos.
- [ ] Distribuir formatos, pilares, etapas de funil, funcionalidades e níveis de esforço sem variações superficiais.
- [ ] Montar 30 dias com três posts semanais, stories de apoio e Reel a cada uma ou duas semanas.
- [ ] Escrever prompts operacionais que obriguem a leitura do contexto e validação humana.

### Task 3: Primeiros 12 drafts e templates

**Files:**
- Create: `marketing/drafts/001-*.md` até `marketing/drafts/012-*.md`
- Create: `marketing/templates/README.md`
- Create: `marketing/templates/carrossel-educacional.md`
- Create: `marketing/templates/apresentacao-funcionalidade.md`
- Create: `marketing/templates/caso-clinico-ficticio.md`
- Create: `marketing/templates/comparacao-hipoteses.md`
- Create: `marketing/templates/checklist.md`
- Create: `marketing/templates/post-posicionamento.md`
- Create: `marketing/templates/screenshot-comentado.md`
- Create: `marketing/templates/capa-reel.md`

- [ ] Escrever 12 posts completos, slide a slide quando aplicável, sem repetir a mesma estrutura em todos.
- [ ] Usar os tokens Barlow/Barlow Condensed, teal `#1a6b73`, navy `#1e2a35`, neutros e estados clínicos apenas com função semântica.
- [ ] Incluir acessibilidade, orientação visual e checklist de segurança em cada draft.

### Task 4: Gerador local orientado a testes

**Files:**
- Create: `marketing/scripts/generate-post.js`
- Create: `marketing/scripts/generate-post.test.js`
- Create: `marketing/.env.example`
- Modify: `package.json`

- [ ] Escrever testes para selecionar pauta pendente, evitar a funcionalidade do último post, criar o arquivo e atualizar o status.
- [ ] Rodar os testes antes da implementação e confirmar falha por ausência do gerador.
- [ ] Implementar leitura dos sete arquivos de contexto pedidos, parsing mínimo do backlog e geração determinística.
- [ ] Rodar os testes novamente e confirmar aprovação.
- [ ] Documentar `npm run marketing:generate` e o futuro ponto de integração externa sem tokens no código.

### Task 5: Verificação e revisão final

**Files:**
- Modify only if verification identifies an issue.

- [ ] Executar `npm test` em `frontend/`.
- [ ] Executar `npm test` em `backend/`, registrando dependências externas indisponíveis se ocorrerem.
- [ ] Executar `npm run build` em `frontend/`.
- [ ] Executar os testes do gerador.
- [ ] Revisar `git diff --stat`, `git diff --check` e confirmar que nenhuma rota/componente clínico foi modificado.
- [ ] Acrescentar uma linha de sessão em `C:\freela\contenta-ui\contenta\log.md`.

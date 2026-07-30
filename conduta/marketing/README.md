# Marketing orgânico do Conduta

Esta pasta reúne o contexto editorial e uma pipeline local para transformar rascunhos Markdown em artefatos revisáveis para Instagram. O processo não acessa a Meta, não publica automaticamente e não altera o produto clínico.

## Arquitetura

- `brand.md`, `audience.md`, `features.md`, `content-rules.md` e `content-pillars.md`: contexto editorial obrigatório.
- `ideas-backlog.md` e `published-posts.md`: pauta, histórico e controle de repetição.
- `drafts/`: fonte dos posts em Markdown.
- `pipeline/post-schema.ts`: contrato TypeScript do modelo normalizado.
- `pipeline/post-pipeline.js`: parser, normalização, escolha de template e validação.
- `pipeline/renderer-html.js`: componentes visuais HTML/CSS isolados, com texto sempre renderizado pelo navegador.
- `templates/`: especificações editoriais dos oito templates recomendados.
- `generated/<id>-<slug>/`: saída local por post: PNGs, JSON, legenda, preview e relatório.
- `screenshots/scenarios/`: cenários declarativos e desativados por padrão para capturas fictícias do sistema.
- `assets/generated/`: ilustrações opcionais geradas por API, quando explicitamente habilitadas.

As cores e fontes reaproveitam o design system confirmado em `frontend/src/styles/_variables.scss`: Barlow, Barlow Condensed, navy `#1e2a35`, teal `#1a6b73`, fundo `#f4f5f7`, superfície branca e borda `#dde3ec`.

## Instalação

```bash
npm install
```

A única dependência de desenvolvimento da pipeline é `playwright-core`. Ela usa o Chrome ou Edge já instalado; não baixa um browser. Se o navegador estiver em outro local, defina `MARKETING_BROWSER_PATH`.

## Criar um novo post

Escreva um Markdown em `drafts/` usando os campos já utilizados pelos posts existentes. O parser aceita o formato atual e também frontmatter YAML simples. O mínimo recomendado é:

```markdown
---
id: P999
status: draft
format: carousel
template: carrossel-educacional
---

# Título do post

## Roteiro slide a slide

**Slide 1 — Gancho:** Título curto.

**Slide 2 — Contexto:** Uma ideia por slide.

## Legenda

Legenda que complemente a arte.

**CTA:** Uma ação coerente.
```

Também é válido seguir exatamente o padrão editorial atual com campos em listas. O template é inferido quando não está declarado: carrosséis sobre hipóteses usam comparação; demonstrações usam screenshot comentado; posts estáticos usam posicionamento; Reels e Stories usam seus respectivos templates.

## Comandos

```bash
# Validar todos os drafts; erro impeditivo retorna código diferente de zero.
npm run marketing:validate

# Renderizar um post.
npm run marketing:render -- marketing/drafts/001-quando-o-caso-ainda-nao-fechou.md

# Renderizar todos os drafts.
npm run marketing:render:all

# Abrir a galeria local em http://127.0.0.1:4173.
npm run marketing:preview

# Ilustração opcional; por padrão não faz chamada externa.
npm run marketing:illustrate -- marketing/drafts/001-post.md

# Capturas reais do produto; por padrão permanece desativado.
npm run marketing:screenshot
```

Cada post renderizado cria `post.json`, `caption.txt`, `preview.html`, `validation-report.json` e PNGs com dimensões exatas: 1080 × 1350 para feed/carrossel e 1080 × 1920 para Story/Reel. Se o conteúdo não couber, a pipeline retorna erro de validação; ela não reduz a fonte automaticamente até ficar ilegível.

## Validação

O relatório verifica campos obrigatórios, formato e ID, legenda, CTA quando necessário, sequência e duplicidade de slides, tamanho de títulos e corpos, quantidade de bullets, alt text, solicitação de screenshots e observações de segurança em conteúdo clínico. Alertas não impeditivos ficam separados dos erros.

As imagens devem ser revisadas visualmente no preview local, inclusive em escala de tela pequena. A pipeline garante dimensões e estrutura; não substitui revisão humana de ortografia, design, conteúdo clínico ou autorização de screenshot.

## Ilustrações

O texto principal nunca é escrito por geração de imagem: ele é renderizado por HTML/CSS. A integração opcional usa `OPENAI_API_KEY`, `MARKETING_ENABLE_AI_IMAGES=true` e o modelo `gpt-image-2` por padrão. Os prompts são complementados com instruções para não gerar texto, logos, prontuários, pacientes identificáveis ou imagens médicas gráficas. O cache usa prompt, modelo, tamanho e qualidade; metadados registram prompt, modelo e data.

Para manter o comportamento seguro, não coloque chave no repositório, não use ilustração para simular a interface do Conduta e prefira formas/ícones locais quando a API não for necessária.

## Screenshots do produto

Os cenários em `screenshots/scenarios/` registram rota, viewport, estado, dados fictícios, máscaras e nome do arquivo. O cenário de feedback está desativado. Para uma captura local, a pessoa responsável deve preparar uma sessão mockada, revisar as áreas ocultas e definir as variáveis descritas em `screenshots/README.md`. Sem isso, o comando não captura nada.

## Fluxo de aprovação

1. O arquivo nasce com `status: draft`.
2. Rode validação e renderização.
3. Faça revisão editorial, clínica, visual e de dados fictícios.
4. Troque para `approved` somente após validação humana.
5. Publique manualmente, se aprovado.
6. Troque para `published` e registre a publicação em `published-posts.md`.

O gerador editorial (`npm run marketing:generate`) continua separado da pipeline visual. Antes de gerar conteúdo, leia os arquivos de contexto e consulte o histórico.

## Solução de problemas

- `playwright-core` ausente: rode `npm install`.
- Browser não encontrado: defina `MARKETING_BROWSER_PATH` com o executável do Chrome/Edge.
- Erro de layout: reduza o texto, redistribua a ideia ou crie outro slide; não esconda o overflow.
- Screenshot ausente: mantenha o post em mockup local ou prepare cenário fictício; nunca use dados reais.
- Erro clínico: corrija o Markdown e marque a validação humana antes de aprovar.
- API de ilustração: mantenha `MARKETING_ENABLE_AI_IMAGES=false` quando não houver chave ou quando formas locais forem suficientes.

## Limitações conhecidas

- A fonte Barlow depende de estar instalada ou disponível no ambiente do navegador; o fallback é Arial/sans-serif.
- O parser entende o padrão editorial atual e frontmatter YAML simples, não YAML arbitrário.
- A captura autenticada do produto exige uma sessão local mockada preparada por uma pessoa; nenhuma credencial é criada ou armazenada pela pipeline.
- Não há integração com Instagram, Meta, banco de dados ou publicação automática.

---
name: Conduta
description: Clinical decision support for general practitioners — precise, human, evidence-backed.
colors:
  verde-azul-profundo: "#1a6b73"
  verde-azul-profundo-hover: "#145a61"
  verde-azul-sutil: "#eaf2f3"
  azul-marinho-discreto: "#1e2a35"
  azul-marinho-hover: "#263545"
  azul-marinho-elevado: "#1e2d3d"
  cinza-tela: "#f4f5f7"
  cinza-sutil: "#fafafa"
  branco-superficie: "#ffffff"
  borda-discreta: "#dde3ec"
  tinta-escura: "#1a1a2e"
  tinta-secundaria: "#5a6a7a"
  tinta-apagada: "#9ca3af"
  texto-sidebar: "#b0c4cc"
  perigo: "#c0392b"
  perigo-fundo: "#fff7ed"
  perigo-borda: "#ea580c"
  alerta: "#e67e22"
  alerta-fundo: "#fffbeb"
  alerta-borda: "#f59e0b"
  sucesso: "#27ae60"
  sucesso-fundo: "#f0fdf4"
  sucesso-borda: "#86efac"
  diagnostico-fundo: "#fef3c7"
  diagnostico-texto: "#92400e"
  medicamento-fundo: "#d1fae5"
  medicamento-texto: "#065f46"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "48px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "normal"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.25
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  pill: "20px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "20px"
  lg: "32px"
  xl: "72px"
components:
  button-primary:
    backgroundColor: "{colors.verde-azul-profundo}"
    textColor: "{colors.branco-superficie}"
    rounded: "{rounded.md}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "{colors.verde-azul-profundo-hover}"
    textColor: "{colors.branco-superficie}"
    rounded: "{rounded.md}"
    padding: "14px 32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-secundaria}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-sidebar:
    backgroundColor: "{colors.verde-azul-profundo}"
    textColor: "{colors.branco-superficie}"
    rounded: "{rounded.md}"
    padding: "9px 14px"
  tag-diagnostico:
    backgroundColor: "{colors.diagnostico-fundo}"
    textColor: "{colors.diagnostico-texto}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  tag-medicamento:
    backgroundColor: "{colors.medicamento-fundo}"
    textColor: "{colors.medicamento-texto}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: Conduta

## 1. Overview

**Creative North Star: "O Caderno Clínico"**

O sistema de design do Conduta é modelado em torno de um bom prontuário: hierarquia clara, densidade informacional calibrada, sem ruído decorativo. Um médico experiente olha para um prontuário bem feito e reconhece imediatamente o que precisa de atenção, o que é contexto, e o que é ação. A interface deve funcionar da mesma forma.

A dualidade dark/light não é estética — é estrutural. A sidebar azul-marinho cria o espaço de navegação e orientação; o conteúdo claro é onde o trabalho acontece. Essa separação de planos comunica função antes de qualquer elemento ser lido. A paleta é intencionalmente contida: o verde-azul profundo aparece em menos de 10% de qualquer tela e sua raridade é a sinalização.

Este sistema rejeita explicitamente: interfaces genéricas de IA sem identidade clínica (fundo branco, caixa de texto, zero contexto médico), software hospitalar dos anos 2000 (telas densas, cinzas, sem hierarquia), SaaS americano genérico (navy-and-gold, hero-metric template, cards idênticos em grid), e apps de telemedicina consumer (verde hospital saturado, fotos de médicos sorridentes, tom aspiracional vazio).

**Key Characteristics:**
- Bimodal dark/light: sidebar Azul Marinho Discreto + conteúdo Cinza Tela
- Acento Verde-Azul Profundo usado com parcimônia; presença rara = sinal forte
- Tipografia única (Inter) em múltiplos pesos, sem fontes de display
- Elevação flat-by-default; sombras apenas em elementos flutuantes
- Sem side-stripe borders, sem gradient text, sem hero-metric template
- Tokens semânticos para cada estado clínico (diagnóstico, medicamento, alerta, perigo, sucesso)

## 2. Colors: A Paleta do Caderno Clínico

Dois polos e um acento. A paleta é deliberadamente restrita: tudo serve ao conteúdo clínico, não ao produto.

### Primary

- **Verde-Azul Profundo** (`#1a6b73`): o acento principal. Botões primários, links de ação, destaques de cabeçalho na análise. Aparece em menos de 10% de qualquer tela. Sua raridade é intencional; quando aparece, significa ação ou destaque relevante.
- **Verde-Azul Profundo Hover** (`#145a61`): estado de hover do acento. 8% mais escuro, mesmo matiz.
- **Verde-Azul Sutil** (`#eaf2f3`): fundo de elementos do usuário (mensagem do médico no chat). A versão de baixo contraste do acento.

### Secondary

- **Azul Marinho Discreto** (`#1e2a35`): cor estrutural da sidebar. Não é um acento; é o plano de navegação. Nunca usar como fundo de conteúdo.
- **Azul Marinho Hover** (`#263545`): estado ativo e hover de itens na sidebar.
- **Azul Marinho Elevado** (`#1e2d3d`): dropdowns e elementos flutuantes sobre a sidebar.

### Neutral

- **Cinza Tela** (`#f4f5f7`): fundo base do app. Levemente azulado, nunca puro cinza.
- **Cinza Sutil** (`#fafafa`): superfície secundária (painel de achados). Um grau acima do Cinza Tela.
- **Branco Superfície** (`#ffffff`): superfícies primárias de conteúdo (cards, session header, inputs).
- **Borda Discreta** (`#dde3ec`): todas as bordas e divisores. Um único valor; nunca variar.
- **Tinta Escura** (`#1a1a2e`): texto primário. Não é preto puro; tem matiz azul-índigo.
- **Tinta Secundária** (`#5a6a7a`): texto de suporte, labels, metadados.
- **Tinta Apagada** (`#9ca3af`): texto de placeholder, labels de seção, datas relativas de sessão.
- **Texto Sidebar** (`#b0c4cc`): texto em superfícies Azul Marinho. Nunca usar em superfícies claras.

### Semantic (estados clínicos)

- **Diagnóstico** (fundo `#fef3c7`, texto `#92400e`): tags de diagnóstico extraídas. Âmbar: urgência controlada.
- **Medicamento** (fundo `#d1fae5`, texto `#065f46`): tags de medicamento. Verde: segurança farmacológica.
- **Perigo** (`#c0392b`, fundo `#fff7ed`, borda `#ea580c`): alertas críticos de sessão longa.
- **Alerta** (`#e67e22`, fundo `#fffbeb`, borda `#f59e0b`): avisos não críticos.
- **Sucesso** (`#27ae60`, fundo `#f0fdf4`, borda `#86efac`): confirmações e estados positivos.

**The One Voice Rule.** O Verde-Azul Profundo é o único acento cromático em superfícies claras. Não introduzir roxo, laranja decorativo ou qualquer segundo acento. Os estados clínicos (âmbar, verde de medicamento) são funcionais, não decorativos — nunca reutilizá-los para fins que não sejam diagnóstico e medicamento.

**The Sidebar Contract Rule.** O Texto Sidebar (`#b0c4cc`) existe exclusivamente em superfícies Azul Marinho. Se um elemento migrar para uma superfície clara, o texto deve mudar para Tinta Secundária. Nunca misturar.

## 3. Typography

**Body Font:** Inter (com fallback -apple-system, BlinkMacSystemFont, sans-serif)

**Caráter:** Uma única família sem serifa em múltiplos pesos. Inter é legível em telas de consultório e pronto-socorro, carrega densidade informacional sem fadiga, e não carrega personalidade de startup. O sistema usa peso como hierarquia principal; tamanho como hierarquia secundária.

### Hierarchy

- **Display** (800, 48px, line-height 1.15): apenas Hero da landing page. Usado uma única vez por página.
- **Headline** (800, 32px, line-height 1.25): títulos de seção da landing. Nunca no app.
- **Title** (700, 20px, line-height 1.3): subtítulos de seção na landing; elementos de destaque no app quando necessário.
- **Body** (400, 14px, line-height 1.6): texto primário de conteúdo no app. Análises da IA, mensagens do médico, descrições. Máximo 65–75ch de largura em passagens longas.
- **Label** (600, 13px, letter-spacing 0.02em): labels de seção, labels de campo, texto de botão de tamanho menor, nomes de usuário. Frequentemente uppercase com letter-spacing nas labels de seção (10px, 600, uppercase, letter-spacing 1-2px).
- **Caption** (400–600, 10–11px): datas relativas nas sessões, contadores, disclaimers.

**The Weight-Before-Size Rule.** A hierarquia é construída primeiro em peso (400 → 600 → 700 → 800), depois em tamanho. Nunca aumentar o tamanho para criar destaque sem razão funcional. O ratio mínimo entre níveis de hierarquia é 1.14x em tamanho; sempre complementado por diferença de peso.

## 4. Elevation

O sistema é plano por padrão. Superfícies em repouso não têm sombra; a profundidade é comunicada por cor de fundo (Cinza Tela → Cinza Sutil → Branco Superfície) e pela dualidade estrutural dark/light.

### Shadow Vocabulary

- **Ambient Low** (`0 1px 3px rgba(0, 0, 0, 0.08)`): sombra mínima para elementos levemente elevados (hero preview card na landing).
- **Float** (`0 4px 12px rgba(0, 0, 0, 0.10)`): dropdowns, painéis flutuantes, tooltips. Único nível onde sombra é perceptível.
- **Sidebar Mobile** (`4px 0 24px rgba(0, 0, 0, 0.35)`): sidebar deslizante no mobile, quando sobreposta ao conteúdo.

### Named Rules

**The Flat-By-Default Rule.** Superfícies são planas em repouso. Sombra aparece apenas em resposta a elevação real (dropdown flutuando sobre conteúdo, sidebar sobreposta no mobile). Se um elemento não flutua sobre outro, não tem sombra.

**The Tonal Layering Rule.** Profundidade percebida dentro de uma mesma superfície é comunicada por cor de fundo, nunca por sombra. A sequência `#f4f5f7 → #fafafa → #ffffff` cria três planos visuais sem nenhuma sombra.

## 5. Components

### Buttons

Táticos e contidos. Nunca arredondados em pill; a geometria é discreta (6px radius).

- **Shape:** cantos levemente arredondados (6px / `{rounded.md}`)
- **Primary:** Verde-Azul Profundo (`#1a6b73`) com texto branco. Padding `14px 32px` na landing, `9px 14px` no app (sidebar). Transition `background 0.15s ease-out`.
- **Hover / Focus:** background Verde-Azul Hover (`#145a61`). Focus-visible: anel de 2px Verde-Azul Profundo com offset 2px.
- **Ghost / Outlined:** border `1px solid rgba(176, 196, 204, 0.3)` sobre fundo Azul Marinho Discreto; texto Texto Sidebar. Hover: border-color + texto mais claros. Usado para ações secundárias na sidebar (Gerenciar assinatura).
- **Disabled:** opacity 0.6, cursor not-allowed.

### Tags Clínicas

A assinatura visual do Conduta. Dois tipos semânticos com cores funcionais:

- **Diagnóstico:** fundo âmbar (`#fef3c7`), texto marrom-escuro (`#92400e`), radius 4px, padding `0.15rem 0.5rem`.
- **Medicamento:** fundo verde-menta (`#d1fae5`), texto verde-escuro (`#065f46`), mesma geometria.
- **Regra:** nunca misturar as cores de tag fora do contexto diagnóstico/medicamento. Não usar âmbar para alertas genéricos; âmbar é só para diagnósticos.

### Sidebar Navigation

O plano de navegação principal. Dark surface com itens claros.

- **Container:** Azul Marinho Discreto (`#1e2a35`), 260px de largura no desktop, full-screen no mobile.
- **Header:** nome "Conduta" em 15px/700/uppercase/letter-spacing 3px, branco. Subtítulo "Apoio clínico" em 12px, Texto Sidebar.
- **Session Item (default):** padding 9px 12px, radius 6px, texto Texto Sidebar, sem fundo.
- **Session Item (hover / active):** fundo Azul Marinho Hover (`#263545`), texto branco.
- **Session Meta:** título em truncate com ellipsis + data relativa (10px, rgba(b0c4cc, 0.45)) em coluna abaixo.
- **Dropdown:** fundo Azul Marinho Elevado (`#1e2d3d`), border `rgba(255,255,255,0.12)`, shadow Float. Sem emojis nos itens.

### Inputs / Fields

- **App (sidebar search):** fundo `rgba(255,255,255,0.08)`, border `rgba(255,255,255,0.12)`, radius 6px, texto branco, placeholder Texto Sidebar a 45% de opacidade. Focus: border-color `rgba(255,255,255,0.25)`.
- **App (feedback textarea):** fundo branco, border Borda Discreta, radius 6px. Focus: border-color Verde-Azul Profundo. Sem outline; apenas shift de border.
- **Label acima do campo:** nunca placeholder como único label; usar label visível.

### Analysis Result

O componente central do produto. Onde a análise clínica acontece.

- **User Message (médico):** fundo Verde-Azul Sutil (`#eaf2f3`), radius 6px, sem border. Distinguido por cor de fundo, não por borda.
- **Assistant Message (IA):** sem fundo; texto direto sobre Cinza Tela. Separado por border-bottom Borda Discreta.
- **Headings h1/h2 na análise:** Verde-Azul Profundo, uppercase, border-bottom 2px Verde-Azul Profundo. Funciona como separador de seção clínica.
- **Blockquote:** fundo cinza neutro (`#f0f4f8`), full-border Borda Discreta, radius 6px. Sem side-stripe.
- **Code inline:** fundo Cinza Tela, border Borda Discreta, radius 3px.

### Landing Badge / Pill

- **Fundo:** Verde-Azul Sutil (`#eaf2f3`), texto Verde-Azul Profundo. Radius 20px (pill).
- **Tipografia:** 11px/700/uppercase/letter-spacing 1.5px.
- **Uso:** uma única badge por Hero section. Nunca empilhar múltiplas badges.

### Banners de Estado de Sessão

Alertas contextuais inline. Nunca modais.

- **Aviso (sessão > 8 mensagens):** fundo `#fffbeb`, border-top `1px solid #f59e0b`, texto `#92400e`. Sem border-bottom.
- **Crítico (sessão > 16 mensagens):** fundo `#fff7ed`, border-top `1px solid #ea580c`, texto `#7c2d12` + botão de ação inline.
- **Geometria:** border em apenas um lado (topo). A faixa ocupa a largura total do conteúdo; não é um card flutuante.

## 6. Do's and Don'ts

### Do:

- **Do** usar Verde-Azul Profundo em menos de 10% de qualquer tela. Sua raridade é o que faz funcionar como sinal.
- **Do** comunicar hierarquia através de peso tipográfico antes de tamanho. 400 → 600 → 700 → 800 é a escala.
- **Do** usar Borda Discreta (`#dde3ec`) como único valor de borda em superfícies claras. Consistência é uma affordance.
- **Do** distinguir mensagens do médico com cor de fundo (Verde-Azul Sutil), não com border-left.
- **Do** manter a sidebar sempre em Azul Marinho Discreto; nunca usar esse tom em superfícies de conteúdo.
- **Do** aplicar `focus-visible` com anel Verde-Azul Profundo (2px, offset 2px) em todos os elementos interativos.
- **Do** confirmar ações destrutivas inline no dropdown, não em `window.confirm()`.
- **Do** usar tokens semânticos de estado clínico: âmbar para diagnósticos, verde-menta para medicamentos, sem reutilização decorativa.

### Don't:

- **Don't** usar `border-left` maior que 1px como acento colorido em cards, alertas ou lista de itens. É o anti-padrão mais frequente. Substituir por fundo tintado ou borda completa.
- **Don't** usar gradiente em texto (`background-clip: text`). Nunca, em nenhuma superfície.
- **Don't** usar glassmorphism (blur + transparência) decorativamente. O único blur do sistema é o backdrop-filter da navbar da landing, com propósito funcional.
- **Don't** criar grids de cards idênticos (ícone + título + parágrafo, repetido). FeaturesSection usa grid, mas cada card tem peso diferente via `destaque`.
- **Don't** abrir modais como primeira resposta a ações do usuário. Usar confirmação inline, toasts, ou estados na própria superfície.
- **Don't** introduzir um segundo acento cromático em superfícies claras. Roxo, laranja decorativo, rosa: proibidos. Os estados clínicos (âmbar, verde) são funcionais, não paleta.
- **Don't** fazer o produto parecer ChatGPT: caixa de texto centralizada sem identidade clínica, sem hierarquia, sem contexto médico visível.
- **Don't** fazer o produto parecer software hospitalar dos anos 2000: telas densas, fontes a 11px, sem espaçamento, formulários intermináveis.
- **Don't** fazer o produto parecer SaaS americano: hero-metric template (número grande + label pequena + stats + gradiente), navy-and-gold, pricing section com checkmarks em grid idêntico.
- **Don't** fazer o produto parecer app de telemedicina consumer: verde hospital saturado, fotos de médicos sorridentes, tom aspiracional sem substância clínica.
- **Don't** variar o valor de borda. `#dde3ec` é a única borda em superfícies claras. Não inventar `#e5e7eb` ou `#d1d5db` localmente.
- **Don't** usar emojis em botões ou itens de menu da interface do app. Reservado para landing page em contexto de copy (DorSection, FeaturesSection).

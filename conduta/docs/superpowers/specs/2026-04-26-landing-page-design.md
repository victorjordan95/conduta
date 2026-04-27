# Design: Landing Page do Conduta

**Data:** 2026-04-26
**Projeto:** Conduta — assistente clínico para médicos em formação
**Escopo:** Landing page de aquisição de usuários para o lançamento do produto

---

## Contexto

O Conduta é um assistente clínico com IA que analisa casos em linguagem natural e retorna diagnóstico diferencial, conduta baseada em protocolos nacionais e red flags automáticos. O produto está pronto para receber usuários e entra em fase de lançamento.

---

## Persona

**Médico em formação inseguro** — recém-formados, residentes, internos e estudantes que ainda não se sentem confiantes em decisões clínicas independentes. A dor central é a solidão da decisão em tempo real: preceptor ocupado, caso que não fecha, medo de errar.

A emoção que a página precisa transmitir: **"Estou fazendo a coisa certa."** Validação, não funcionalidade.

---

## Modelo de Negócio

- **Plano Free:** 15 análises por mês, renova mensalmente, para sempre. Sem cartão de crédito.
- **Plano Pro:** R$39,90/mês, análises ilimitadas (soft cap interno de ~150/mês), histórico de casos, suporte prioritário.
- **Estudantes:** Condição especial via contato direto (não exposta como plano público).

A unidade visível ao usuário é "análise" (não "token").

---

## Abordagem Visual

Combinação de dois estilos:
- **Narrativa emocional (A):** começa com a dor da persona, cria identificação antes de qualquer argumento técnico.
- **Demo do produto (C):** mostra o produto em ação com caso clínico real, o usuário vê o valor antes de se cadastrar.

**Paleta:** cores da app existente — teal `#1a6b73`, navy `#1e2a35`, fundo `#f4f5f7`, superfície `#ffffff`. Fonte Inter.

**Tom:** humano e acolhedor, sem ser informal. Sério sem ser frio. Fala diretamente com a insegurança da persona sem julgamento.

---

## Estrutura da Página (8 seções)

### 1. Hero

**Headline:** "Aquela dúvida clínica que você não quer ter agora tem resposta."

**Subheadline:** Assistente clínico com IA que analisa o caso, sugere conduta e aponta red flags — em segundos.

**CTA primário:** "Começar grátis" (botão teal)
**CTA secundário:** texto "15 análises/mês · sem cartão"

**Elemento visual:** mini-preview do chat do produto logo abaixo do CTA, mostrando um caso em análise com output estruturado (hipótese, red flag, conduta). Cria conexão imediata com a funcionalidade.

**Badge:** pílula "Para médicos em formação" acima do headline.

---

### 2. A Dor

**Título implícito:** "Você já passou por isso"

Três momentos de identificação com ícone + título + descrição curta:

1. 😰 **Preceptor ocupado, caso que não fecha** — pressão do tempo real sem rede de apoio por perto.
2. 🌀 **4 abas abertas, 3 diagnósticos na cabeça** — informação demais, síntese de menos. O Google não sabe o contexto do paciente.
3. 🤔 **"Será que estou fazendo a coisa certa?"** — a dúvida que ninguém fala em voz alta, mas todo mundo sente nos primeiros anos.

**Resolução:** caixa destacada — "O Conduta foi feito para esse momento. Análise clínica contextualizada, em segundos, sem julgamento."

---

### 3. Demo do Produto

**Título:** "Descreva o caso. Receba a análise."

Chat animado com caso clínico real de urgência (pré-eclâmpsia grave — G2P1, 34 semanas, PA 160x110, edema +++, proteinúria 2+). A animação mostra:
1. Usuário digita o caso em linguagem natural
2. Indicador "Analisando caso clínico..."
3. Resposta estruturada: hipótese principal, red flags ativos, conduta imediata com urgência destacada

Efeito de carrossel com pontos de navegação para outros casos de exemplo (pediatria, clínica geral).

**Implementação:** animação CSS pura por etapas (fade-in sequencial das mensagens) — sem biblioteca externa.

---

### 4. Features

**Título:** "Não é o Google. Não é o ChatGPT. É clínico."

Grade 2×2 com borda superior colorida:

| Feature | Benefício |
|---|---|
| 🗣️ Fale como você pensa | Linguagem natural, sem formulários ou CID obrigatório |
| 📋 Baseado em protocolos nacionais | PCDTs do MS e diretrizes de sociedades médicas BR |
| 🚨 Red flags nunca passam despercebidos | Identificados automaticamente, mesmo sem perguntar |
| 🔁 Continue o raciocínio depois | Lembra do caso, ajusta análise com base na evolução |

**Faixa de privacidade** (dark, abaixo da grade): "Seus dados são seus — nenhuma informação de paciente é armazenada com identificação."

---

### 5. Prova Social

**Título:** "Feito por quem entende. Para quem está começando."

**Elemento 1 — Quote de beta tester** (1 depoimento real, anônimo):
> "[texto do depoimento]"
> — Médico residente, testador beta · [cidade]

**Elemento 2 — Credenciais clínicas** (grid 2×2):
- **PCDTs** — Protocolos Clínicos e Diretrizes Terapêuticas MS
- **CFM** — Condutas alinhadas às resoluções do conselho
- **SUS** — Foco em atenção primária e pronto atendimento
- **BR** — 100% em português, contexto brasileiro

---

### 6. Preços

**Título:** "Comece grátis. Evolua quando precisar."

Dois cards lado a lado:

**Gratuito — R$0/para sempre**
- 15 análises por mês
- Diagnóstico diferencial completo
- Red flags automáticos
- Conduta baseada em protocolos
- Sem cartão de crédito
- ~~Histórico de casos~~
- ~~Análises ilimitadas~~

CTA: "Começar grátis" (dark)

**Pro — R$39,90/mês** (badge "Mais popular", borda teal)
- **Análises ilimitadas** (destaque)
- Diagnóstico diferencial completo
- Red flags automáticos
- Conduta baseada em protocolos
- **Histórico completo de casos** (destaque)
- **Suporte prioritário** (destaque)
- Acesso a novos recursos primeiro

CTA: "Assinar Pro" (teal)

**Rodapé da seção:** "Estudante de medicina? Fale com a gente — temos condições especiais." (link)

---

### 7. FAQ

5 perguntas ordenadas por frequência de objeção:

1. **O Conduta substitui o médico ou o preceptor?** — Não, é ferramenta de apoio. Responsabilidade e julgamento final são sempre do médico.
2. **Os dados do meu paciente ficam salvos?** — Não armazenamos dados identificáveis. Não inserir nome, CPF ou dados que identifiquem o paciente.
3. **Funciona para estudante de medicina também?** — Sim, especialmente no internato e residência. Condição especial via chat.
4. **As condutas são baseadas em quê?** — PCDTs do MS, guidelines de sociedades médicas nacionais. Foco em atenção primária e PA no contexto do SUS.
5. **O plano grátis tem limite de tempo?** — Não. 15 análises/mês, renova todo mês, para sempre.

---

### 8. CTA Final

**Fundo:** navy `#1e2a35` — fecha a página com peso visual.

**Headline:** "A próxima dúvida clínica não precisa ser solitária."

*(Espelha o problema da seção 2 e resolve com a ação — loop emocional fechado.)*

**Subheadline:** "15 análises por mês, grátis, sem cartão. Comece agora e sinta a diferença na primeira consulta."

**CTA:** "Criar conta grátis" + link "ver planos"

**Micro-copy:** ✓ Sem cartão de crédito · ✓ Cancele quando quiser · ✓ Acesso imediato

**Footer mínimo:** Conduta · Feito para médicos brasileiros · email de contato

---

## Decisões de Implementação

- **Stack:** React (já existente no projeto) com módulos SCSS, sem nova dependência
- **Animação do chat (seção 3):** CSS puro, fade-in sequencial por etapas com `animation-delay`
- **Fonte:** Inter já carregada na app — reutilizar
- **Responsividade:** mobile-first — a persona acessa pelo celular durante o plantão
- **Domínio sugerido:** `useconduta.com.br` ou `conduta.med.br`
- **Analytics:** instalar evento de clique no CTA principal para medir conversão

---

## O que não está no escopo

- Integração com sistema de pagamento (Stripe/Pagar.me) — etapa posterior
- Sistema de cadastro/auth — redireciona para a app existente
- Blog ou conteúdo SEO — fase de crescimento orgânico posterior
- Versão em inglês

---

## Ordem de Implementação Recomendada

1. Estrutura HTML/JSX das 8 seções com copy final
2. Estilos SCSS (paleta da app, responsividade mobile)
3. Animação do chat na seção 3
4. Integração do CTA com rota de cadastro da app
5. Deploy e teste em mobile real

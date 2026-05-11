# Termos de Uso & Política de Privacidade — Design Spec
**Data:** 2026-05-11
**Status:** Aprovado

---

## 1. Visão Geral

Implementar dois documentos legais (Termos de Uso e Política de Privacidade/LGPD) para o Conduta, com integração na UI em 4 pontos de contato. O objetivo principal é proteger o desenvolvedor (pessoa física) de responsabilização por decisões clínicas tomadas a partir do output da ferramenta, e garantir conformidade com a LGPD antes do lançamento para usuários reais.

**Prestador do serviço:** pessoa física, CPF.
**Público-alvo:** médicos (CRM) e estudantes de medicina.
**Modelo:** freemium.

---

## 2. Documentos Legais

### 2.1 Termos de Uso (`/termos`)

Página estática React com as seguintes seções:

| Seção | Conteúdo |
|-------|----------|
| 1. Natureza do serviço | O Conduta é uma ferramenta de **apoio ao raciocínio clínico** mediada por inteligência artificial. Não realiza diagnóstico, não emite prescrição e não substitui a conduta de profissional habilitado. |
| 2. Público autorizado | Uso permitido a médicos com registro ativo no CRM e a estudantes de medicina **exclusivamente sob supervisão de profissional habilitado**. O cadastro por pessoa fora desse perfil é vedado. |
| 3. Responsabilidade do usuário | Toda decisão clínica — diagnóstica, terapêutica ou prescritiva — é de responsabilidade exclusiva do profissional que a tomar. O usuário reconhece que o output da ferramenta pode conter erros e deve ser sempre verificado criticamente. |
| 4. Limitação de responsabilidade | O prestador do serviço não responde por danos diretos, indiretos, emergentes ou consequenciais decorrentes do uso ou da impossibilidade de uso da ferramenta, incluindo danos a terceiros (pacientes). |
| 5. Indenização | O usuário concorda em defender, indenizar e isentar o prestador de quaisquer reclamações, ações ou despesas (incluindo honorários advocatícios) movidas por terceiros em razão de atos ou omissões do próprio usuário. |
| 6. Vedações | Proibido: uso para laudo pericial ou documento oficial; automação de decisões clínicas sem supervisão humana; compartilhamento de credenciais; uso para fins fora do suporte clínico educacional. |
| 7. Alterações e rescisão | O prestador pode alterar os Termos com aviso de 15 dias por e-mail. O uso continuado após a vigência implica aceite. Contas que violem os Termos podem ser suspensas ou encerradas sem aviso prévio. |
| 8. Lei aplicável e foro | Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de **Mogi das Cruzes/SP** para dirimir controvérsias. |

---

### 2.2 Política de Privacidade — LGPD (`/privacidade`)

Página estática React com as seguintes seções:

| Seção | Conteúdo |
|-------|----------|
| 1. Dados coletados | Nome completo, endereço de e-mail, textos dos casos clínicos inseridos na plataforma, data/hora de acesso e aceite dos Termos. |
| 2. Aviso crítico | **Não insira dados que permitam identificar pacientes** (nome, CPF, data de nascimento, número de prontuário, etc.) nos casos clínicos. A responsabilidade pelo sigilo de dados de pacientes é do profissional de saúde, conforme o CFM e a LGPD. |
| 3. Base legal | Consentimento do titular (Art. 7º, I, LGPD), registrado no momento do cadastro com timestamp. |
| 4. Finalidade | Prestação do serviço de apoio clínico; melhoria do sistema por análise agregada e anonimizada de padrões de uso; comunicações sobre o serviço. |
| 5. Compartilhamento | Os textos dos casos são processados pela API do **OpenRouter** (serviço de terceiro responsável pelo roteamento de modelos de linguagem). Não há venda ou compartilhamento de dados para fins comerciais. |
| 6. Retenção | Dados mantidos enquanto a conta estiver ativa e por 12 meses após o encerramento, salvo obrigação legal de prazo maior. |
| 7. Direitos do titular | Acesso, correção, exclusão, portabilidade e revogação do consentimento mediante solicitação por e-mail ao controlador. Resposta em até 15 dias úteis. |
| 8. Controlador | Victor Jordan, CPF `***.278.258-**`, e-mail: app.conduta@gmail.com |

---

## 3. Integração na UI

### 3.1 Banco de dados
Adicionar coluna ao schema `users` no PostgreSQL:
```sql
ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMPTZ;
```
Preenchida no momento do cadastro. Usuários criados antes da feature ficam com `NULL` (sem aceite forçado retroativo no lançamento).

### 3.2 Cadastro (`/cadastro` — `Register.jsx`)
- Adicionar checkbox antes do botão de submit:
  ```
  ☐ Li e concordo com os Termos de Uso e a Política de Privacidade
  ```
- Links abrem em nova aba (`target="_blank"`).
- Botão "Criar conta" desabilitado enquanto checkbox não estiver marcado.
- Enviar `terms_accepted_at: new Date().toISOString()` no payload de registro.
- Backend salva o timestamp na coluna `terms_accepted_at`.

### 3.3 Dashboard — banner de aviso clínico
- Banner fixo no topo do Dashboard, abaixo do header.
- Não possui botão de fechar.
- Texto: *"As análises do Conduta são sugestões de apoio clínico. A decisão final é sempre responsabilidade do profissional."*
- Estilo: fundo neutro discreto (ex: `#f0f4f8`), ícone de saúde `⚕`, fonte secundária — integrado à paleta existente.

### 3.4 Resultado da análise (`AnalysisResult.jsx`)
- Rodapé em cada bloco de resposta da IA.
- Texto: *"Esta análise é gerada por inteligência artificial e não substitui o julgamento clínico do profissional."*
- Fonte menor (`0.75rem`), cor secundária — presente sem dominar o conteúdo clínico.

### 3.5 Rodapé do Dashboard
- Links fixos no rodapé: `Termos de Uso · Política de Privacidade`
- Abrem em nova aba.

---

## 4. Novas Rotas

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/termos` | `TermosUso.jsx` | Público |
| `/privacidade` | `PoliticaPrivacidade.jsx` | Público |

Rotas adicionadas em `App.jsx`. Ambas as páginas são estáticas (sem chamada de API).

---

## 5. O que NÃO está no escopo

- Aceite forçado para usuários já cadastrados (pode ser feito em iteração futura se necessário).
- Coleta de CRM no cadastro para validar se o usuário é médico (escopo separado).
- Tradução dos documentos para inglês.

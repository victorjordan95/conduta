# Auditoria do produto

**Data da auditoria:** 2026-07-23  
**Escopo:** site público `https://conduta.online/`, código deste repositório, páginas, componentes, rotas, textos institucionais e funcionalidades identificáveis no sistema autenticado.

## Proposta de valor

O Conduta é apresentado como uma ferramenta de apoio ao raciocínio clínico para médicos e residentes. O profissional descreve um caso em linguagem natural e recebe uma análise organizada com hipótese principal, hipóteses diferenciais, alertas, conduta sugerida e critérios de retorno/encaminhamento. A proposta não é substituir o médico, mas funcionar como apoio contextualizado em momentos de dúvida e pressão de tempo.

**Origem:** site — `title`, meta description, hero e seções de dor/demonstração; `PRODUCT.md` — Product Purpose; `frontend/src/components/landing/HeroSection.jsx`; `backend/src/config/system-prompt.js`.

## Público principal

Médicos generalistas, médicos recém-formados, médicos de família e profissionais de atenção primária ou pronto atendimento que lidam com muitos casos variados e precisam organizar o raciocínio com rapidez.

**Origem:** `PRODUCT.md` — Users; site — badge “Para médicos e residentes” e FAQ sobre atenção primária/pronto atendimento; `backend/src/config/system-prompt.js` — medicina generalista em USF e pronto atendimento.

## Públicos secundários

- Residentes e profissionais em formação, desde que o uso seja supervisionado e educativo.
- Médicos que atendem fora da especialidade principal.
- Coordenadores de UBS/UPA e gestores que avaliam ferramentas para equipes.
- Médicos que precisam transformar uma análise em um resumo revisável para prontuário.

**Origem:** `PRODUCT.md`; site — FAQ, seção de confiança e planos; `frontend/src/pages/TermosUso.jsx`.

## Funcionalidades confirmadas

| Funcionalidade | Benefício | Dor profissional | Origem |
|---|---|---|---|
| Entrada de caso em linguagem natural | Reduz o esforço de preencher formulários e permite começar pelo raciocínio do médico | Pressa, múltiplas informações e pouca tolerância a telas rígidas | site — Features/Demo; `frontend/src/components/CaseInput.jsx`; `frontend/src/components/landing/FeaturesSection.jsx` |
| Análise completa | Organiza resumo, hipóteses, raciocínio, conduta, alertas, dados faltantes e encaminhamento | Caso que não fecha e necessidade de revisar o caminho | `backend/src/routes/analyze.js`; `backend/src/config/system-prompt.js`; testes `analyze-mode.test.js` |
| Conduta rápida | Oferece resposta objetiva para casos simples | Falta de tempo para uma análise longa | `frontend/src/components/CaseInput.jsx`; `backend/src/routes/analyze.js` |
| Hipóteses e diferenciais | Ajuda a comparar explicações plausíveis antes de decidir | Muitas hipóteses na cabeça e síntese difícil | site — hero/preços; `backend/src/config/system-prompt.js` |
| Red flags e critérios de encaminhamento | Facilita revisar sinais de alarme e necessidade de escalar cuidado | Risco de esquecer sinais de gravidade sob pressão | site — Features/Demo; `backend/src/config/system-prompt.js` |
| Revisão de dados faltantes e riscos | Torna visíveis perguntas, contraindicações e fatores que mudam a conduta | Informação incompleta, comorbidades, alergias e medicamentos em uso | `backend/src/config/system-prompt.js` |
| Contexto por sessão | Permite continuar o raciocínio quando o paciente retorna | Reavaliar evolução sem reconstruir todo o caso | site — Features; `frontend/src/pages/Dashboard.jsx`; `backend/src/routes/sessions.js` |
| Resumo para prontuário | Gera um rascunho copiável para revisão antes do registro | Tempo gasto organizando evolução e documentação | `frontend/src/components/ProntuarioModal.jsx`; `backend/src/routes/sessions.js`; `backend/src/services/prontuario.js` |
| Histórico de sessões | Permite recuperar casos anteriores dentro do produto conforme o plano | Perder contexto entre atendimentos | `frontend/src/components/Sidebar.jsx`; `backend/src/routes/sessions.js`; site — preços |
| Feedback da resposta | Permite indicar útil, parcial ou incorreta e registrar ajuste | Necessidade de melhorar respostas e sinalizar problemas | `frontend/src/components/AnalysisResult.jsx`; `backend/src/routes/feedback.js`; testes de feedback |
| Base clínica contextualizada | Enriquece a resposta com documentos, diretrizes e conhecimento estruturado | Busca fragmentada em muitas fontes | site — FAQ/Confiança; `backend/src/services/neo4j-search.js`; `backend/src/config/system-prompt.js` |
| Sequências Rápidas / protocolos | Oferece consulta estruturada de protocolos de emergência | Precisar revisar passos organizados em situações críticas | `frontend/src/pages/Protocolos.jsx`; `frontend/src/pages/ProtocoloDetalhe.jsx`; `frontend/src/data/protocolos.js` |
| Limite e planos | Dá acesso inicial gratuito e opção de ampliar uso | Querer experimentar sem compromisso e depois escalar | site — preços; `backend/src/config/plans.js`; `frontend/src/components/UsageCounter.jsx` |
| Classificação de lesões cutâneas | Analisa uma imagem de lesão cutânea como apoio adicional | Precisar de uma triagem inicial específica em contexto autorizado | `frontend/src/components/CaseInput.jsx`; `backend/src/routes/skin.js`; `backend/src/services/skin-classifier.js`; testes `skin.test.js` |

## Diferenciais identificáveis

1. Contexto brasileiro: português, atenção primária/pronto atendimento, PCDTs e referências nacionais.
2. Entrada natural, sem formulário clínico rígido.
3. Resposta estruturada para raciocínio, não apenas uma resposta solta.
4. Continuidade por sessão e resumo para prontuário.
5. Separação explícita entre apoio tecnológico e responsabilidade médica.
6. Interface própria, com hierarquia clínica e modos de análise.

**Origem:** site — Features, Demo, Confiança, FAQ e preços; `PRODUCT.md`; `DESIGN.md`; `frontend/src/components/landing/*`; `backend/src/config/system-prompt.js`.

## Objeções prováveis

- “Posso confiar em uma ferramenta automatizada em casos clínicos?”
- “Isso vai me fazer seguir uma conduta sem conferir o contexto?”
- “O caso ou dados do paciente ficam armazenados?”
- “As fontes e protocolos são adequados à minha realidade local?”
- “Vai me fazer perder tempo em vez de ajudar?”
- “Já uso busca, protocolos ou discussão com colegas; por que adicionar outra ferramenta?”
- “A classificação de imagem é apropriada para uso clínico?”

**Origem:** inferência editorial baseada no posicionamento do site, FAQ, Termos de Uso e nos fluxos de `CaseInput`, `AnalysisResult` e `ProntuarioModal`. A inferência deve ser validada com médicos usuários.

## Mensagens de posicionamento possíveis

- “Organize o caso antes de decidir.”
- “Um segundo par de olhos para o raciocínio clínico.”
- “Da descrição do caso à revisão da conduta, em linguagem natural.”
- “Apoio clínico para momentos em que o caso ainda não fechou.”
- “Contexto brasileiro, raciocínio organizado, decisão continua sendo sua.”

Estas frases são hipóteses de comunicação, não claims comprovados de desfecho clínico.

## Limitações e cuidados

- A saída é apoio e precisa ser revista pelo profissional; não é diagnóstico definitivo nem prescrição automática.
- Protocolos locais, disponibilidade, exame físico, atualização de diretrizes e contexto do paciente podem mudar a decisão.
- Casos demonstrados em conteúdo devem ser fictícios, não identificáveis e sem dados sensíveis.
- A afirmação pública sobre armazenamento precisa seguir a política e os termos atuais; não ampliar o que o código não comprova.
- A classificação de lesões aparece com bloqueios de acesso no código e não deve ser divulgada como recurso geral sem validação de produto.
- A demonstração pública contém condutas obstétricas específicas; qualquer conteúdo baseado nela exige revisão médica e contexto adequado.

**Origem:** `frontend/src/pages/TermosUso.jsx`; `frontend/src/components/AnalysisResult.jsx`; `frontend/src/components/ProntuarioModal.jsx`; `backend/src/config/system-prompt.js`; `backend/src/routes/skin.js`.

## Pontos vagos, contraditórios ou pouco claros

| Ponto | Evidência | Impacto editorial |
|---|---|---|
| O site usa “médicos e residentes”, enquanto os Termos incluem estudantes sob supervisão | site — Hero/FAQ; `frontend/src/pages/TermosUso.jsx` | Definir se estudante é público secundário ou apenas condição de uso educativo |
| O plano gratuito anuncia histórico indisponível, mas o produto possui sessões e histórico no código | site — preços; `frontend/src/pages/Dashboard.jsx`; `backend/src/routes/sessions.js` | Confirmar diferenças reais por plano antes de prometer histórico |
| A interface permite foto apenas quando `user.role === 'admin'`, enquanto os testes também distinguem plano Pro | `frontend/src/components/CaseInput.jsx`; `backend/src/routes/skin.js`; `backend/src/__tests__/skin.test.js` | Não divulgar a classificação sem decisão de disponibilidade |
| O site diz que red flags “nunca passam despercebidos” | `frontend/src/components/landing/FeaturesSection.jsx` | Trocar em conteúdo por “ajuda a revisar sinais de alarme” |
| O site afirma que análises são processadas e descartadas, e também diz que o produto lembra do caso | site — FAQ/Features; `backend/src/routes/sessions.js` | Explicar diferença entre dados identificáveis, sessão e conteúdo enviado antes de usar o claim |
| O site menciona “validado por quem usa” com um depoimento nominal | `frontend/src/components/landing/ProvaSection.jsx` | Confirmar autorização e natureza do depoimento antes de reaproveitar |
| O site apresenta condutas específicas na demo | `frontend/src/components/landing/DemoSection.jsx` | Toda republicação exige revisão médica, fonte e contexto; não transformar em conselho isolado |

## Perguntas para decisão humana

- Quais recursos estão oficialmente liberados para comunicação externa?
- O histórico é realmente condicionado ao plano e como a retenção de sessão deve ser descrita?
- A classificação de lesões será pública, interna ou retirada da comunicação?
- Quem valida posts clínicos e como registrar a fonte de cada caso educativo?
- O depoimento e as credenciais públicas têm autorização vigente?

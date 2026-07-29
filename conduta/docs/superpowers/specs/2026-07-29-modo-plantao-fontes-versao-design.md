# Design: Modo Plantão e fontes/versionamento clínico

**Data:** 2026-07-29  
**Status:** aprovado pelo solicitante para especificação; aguardando revisão do documento antes da implementação

## Objetivo

Reduzir o tempo de acesso às ferramentas clínicas mais usadas e aumentar a confiança nos protocolos e calculadoras exibindo suas referências e estado de revisão.

O escopo é deliberadamente frontend-first: não haverá novo endpoint, geração por IA, persistência adicional ou alteração no fluxo de autenticação.

## Feature 1 — Modo Plantão / Quick Actions

### Experiência

No Dashboard autenticado, o usuário verá um painel de ações rápidas com:

- Novo caso;
- Protocolos;
- Calculadoras;
- busca unificada por protocolos e calculadoras;
- indicação do atalho de teclado para focar a busca.

O painel deve aparecer tanto no estado vazio quanto junto ao workspace de um caso ativo, sem substituir o campo de análise clínica. Os resultados da busca serão filtrados localmente a partir de `protocolos` e `calculadoras`, com navegação para as rotas já existentes.

### Componentes e dados

- Criar `PlantaoQuickActions.jsx` e seu módulo de estilos.
- Derivar um índice leve com `titulo`, `descricao`, `categoria`, `tipo`, `slug` e `href`.
- Usar estado local para termo e foco; não criar estado global.
- Aceitar `/` ou `Ctrl/Cmd+K` quando o foco não estiver em input/textarea.
- Limitar a lista inicial a resultados relevantes, com estado vazio explícito.

### Acessibilidade e responsividade

- Campo com `label` acessível e `role="search"`.
- Resultados navegáveis por teclado e com foco visível.
- Botões com nomes claros, inclusive no mobile.
- Layout em uma coluna no mobile e cards compactos no desktop.

## Feature 2 — Fontes e versão dos conteúdos

### Modelo de metadados

Adicionar metadados não clínicos aos itens existentes:

- `atualizadoEm`: data ou mês da última revisão editorial;
- `referencia`: texto da referência já existente;
- `referenciaUrl`: URL quando houver fonte pública confiável;
- `notaSeguranca`: limitação curta e não ambígua.

Não alterar doses, metas ou condutas clínicas nesta implementação. A data exibida deve refletir apenas o estado conhecido do conteúdo; não usar “atualizado” como sinônimo de validado por médico.

### Apresentação

Criar um bloco reutilizável `SourceVersionCard` nas páginas de detalhe de protocolos e calculadoras, contendo:

- “Referência clínica”;
- “Última revisão editorial”;
- link externo com `target="_blank"` e `rel="noreferrer"`, quando disponível;
- aviso de que o conteúdo é apoio à decisão e não substitui avaliação clínica/protocolo institucional.

Se a URL não existir, exibir a referência como texto sem fabricar um link. A ausência de URL não deve quebrar o layout.

### Dados iniciais

- Reutilizar as URLs já presentes nas calculadoras.
- Para protocolos, começar com referência textual e data editorial comum do conjunto, sem inserir novos links clínicos não revisados nesta tarefa.
- Deixar o componente preparado para changelog, mas não exibir uma seção vazia de “o que mudou”.

## Fluxos e estados de erro

- Busca sem resultado: informar “Nenhum protocolo ou calculadora encontrado” e manter ações principais visíveis.
- Item inexistente: preservar o comportamento atual de redirecionamento das páginas de detalhe.
- Link externo indisponível: renderizar apenas o texto da referência.
- Dados incompletos: aplicar valores padrão seguros e não exibir campos vazios.

## Testes

Antes do código, criar testes que falhem para:

1. Modo Plantão renderizar as ações principais e navegar para `/protocolos` e `/calculadoras`.
2. Busca filtrar um protocolo e uma calculadora por título/categoria.
3. Atalho de teclado focar o campo sem interromper digitação em outros inputs.
4. `SourceVersionCard` exibir referência, data e link quando os metadados existirem.
5. `SourceVersionCard` renderizar sem link quando `referenciaUrl` estiver ausente.

Depois, executar os testes específicos, a suíte frontend e o build de produção.

## Fora de escopo

- IA generativa ou respostas clínicas novas;
- revisão médica do conteúdo existente;
- backend, banco de dados ou autenticação;
- editor administrativo de protocolos;
- changelog completo;
- integração com prontuários, FHIR, HL7, e-SUS ou RNDS.

## Critérios de aceite

- O usuário consegue chegar a protocolos e calculadoras a partir do Dashboard em poucos cliques.
- A busca funciona com dados locais e não gera chamadas de rede.
- Cada detalhe clínico apresenta claramente sua referência e o estado de revisão conhecido.
- O layout funciona em desktop e mobile sem remover ações existentes.
- Os testes novos passam e o build de produção conclui sem erro.

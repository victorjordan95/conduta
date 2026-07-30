# Base de Marketing Orgânico do Conduta

**Data:** 2026-07-23  
**Escopo:** documentação editorial, banco inicial de pautas, calendário, drafts e gerador local de rascunhos.

## Objetivo

Criar uma base versionada para planejar, produzir e revisar conteúdo orgânico do Instagram do Conduta sem depender de lançamentos de funcionalidades, integração com a Meta ou API externa de geração de texto.

## Decisões de design

- A pasta `marketing/` será independente do frontend e do backend clínicos.
- A fonte editorial será Markdown legível por pessoas; não haverá banco de dados.
- O gerador será um script Node.js puro em `marketing/scripts/generate-post.js`, executado a partir de `npm run marketing:generate` na raiz.
- O modo inicial usará templates determinísticos e uma pauta pendente do backlog. Uma futura integração de texto poderá substituir apenas a camada de geração, usando variáveis de ambiente e sem alterar o fluxo local.
- A pauta será marcada como `gerada` no próprio backlog. O arquivo criado nascerá com status `draft` e deverá passar por revisão humana antes de qualquer publicação.
- A seleção considerará títulos, ganchos, dores, funcionalidades e CTAs usados nos drafts existentes, no histórico publicado e nas pautas marcadas como geradas.
- A mesma funcionalidade não será escolhida em dois posts consecutivos quando houver alternativas.
- O gerador não publica, não acessa Instagram e não envia dados clínicos.

## Artefatos

- Documentação: auditoria de produto, marca, audiência, funcionalidades, regras, pilares, calendário e histórico.
- Operação: 100 pautas variadas, 12 posts completos, templates visuais e prompts reutilizáveis.
- Automação: gerador local, exemplo de ambiente, testes unitários e instruções de aprovação/publicação.

## Segurança editorial

Toda comunicação deve ser dirigida a médicos, em português do Brasil, com casos fictícios e educativos. O Conduta será descrito como apoio ao raciocínio clínico. Não serão usadas promessas absolutas, dados reais de pacientes, referências inventadas ou conteúdo que pareça orientação individual.

## Verificação

O gerador terá testes para seleção, anti-repetição, criação do draft e atualização do backlog. Depois da implementação serão executados os testes do gerador, os testes/build disponíveis do frontend e backend, além de uma checagem do diff para confirmar que nenhuma funcionalidade clínica foi alterada.

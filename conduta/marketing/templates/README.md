# Templates visuais

Os templates reaproveitam o design system do Conduta: estética de “caderno clínico”, hierarquia clara, paleta restrita e informação legível sob pressão. Priorizar 1080 × 1350 para feed/carrossel e 1080 × 1920 para Stories/Reels. Todo screenshot deve ser mockup ou anonimizado.

## Tokens compartilhados

- Teal principal: `#1a6b73`; hover/escuro: `#145a61`; teal claro: `#eaf2f3`.
- Navy estrutural: `#1e2a35`; texto principal: `#1a1a2e`; texto secundário: `#5a6a7a`; fundo: `#f4f5f7`; superfície: `#ffffff`; borda: `#dde3ec`.
- Diagnóstico e medicamento só como estados funcionais: âmbar `#fef3c7/#92400e` e verde `#d1fae5/#065f46`.
- Tipografia: Barlow para corpo e Barlow Condensed para títulos de impacto, conforme `frontend/src/styles/_variables.scss` e `DESIGN.md`.
- Logo: canto superior esquerdo ou inferior direito, com área de respiro de 64 px; nunca sobre texto ou alerta.
- Contraste: texto escuro em fundo claro, texto claro apenas sobre navy/teal escuro; não depender apenas de cor.
- Rodapé opcional: “Caso fictício e educativo. Revise contexto e protocolos locais.” em no máximo duas linhas.

## Regras de produção

- Margem segura mínima: 72 px lateral e 64 px vertical.
- Capa: no máximo 12 palavras; corpo: no máximo 35 palavras por slide; CTA: uma ação.
- Usar indicação de slide “01/06” no canto inferior esquerdo, fora da área de texto.
- Ícones lineares simples, um por ideia; evitar ilustrações decorativas e emojis em excesso.
- Em telas pequenas, testar leitura a 25% do tamanho e manter corpo equivalente a pelo menos 30 px no arquivo final.
- Descrever cada imagem com alt text e marcar conteúdo clínico específico para validação.

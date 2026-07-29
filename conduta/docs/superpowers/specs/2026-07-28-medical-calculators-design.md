# Expansão das calculadoras clínicas

## Objetivo

Expandir a área pública de calculadoras clínicas do Conduta com seis ferramentas de uso recorrente por médicos generalistas, de atenção primária e de pronto atendimento, mantendo cálculos determinísticos, transparentes e sem recomendações automáticas.

## Escopo aprovado

Além das calculadoras existentes de IMC e superfície corporal, serão adicionadas:

1. CKD-EPI 2021 para estimativa da taxa de filtração glomerular por creatinina.
2. Cockcroft–Gault para estimativa do clearance de creatinina.
3. CHA₂DS₂-VASc para pontuação de risco tromboembólico em fibrilação atrial.
4. HAS-BLED para pontuação de fatores associados ao risco de sangramento em fibrilação atrial.
5. CURB-65 para estratificação de gravidade em pneumonia adquirida na comunidade.
6. Wells para probabilidade pré-teste de embolia pulmonar.

O escopo não inclui prescrição, indicação de tratamento, ajuste automático de dose, integração com protocolos externos ou coleta/envio de dados.

## Decisão de priorização

Não existe um ranking público único de buscas médicas no Brasil. A escolha combina recorrência em catálogos clínicos, aplicabilidade ao público do Conduta e existência de referências primárias ou institucionais claras. Catálogos de calculadoras e literatura de uso de ferramentas clínicas destacam repetidamente eGFR/CKD-EPI, CHA₂DS₂-VASc, Wells e CURB-65; HAS-BLED complementa a avaliação de fibrilação atrial e Cockcroft–Gault atende situações de estimativa de função renal usadas em contexto medicamentoso.

## Arquitetura

As calculadoras continuarão registradas em `frontend/src/data/calculadoras.js`, mas as funções determinísticas ficarão em `frontend/src/utils/calculadoras.js`. Cada registro seguirá o contrato existente e poderá declarar campos numéricos, seleção única e checkbox:

```js
{
  name: 'idadeAnos',
  label: 'Idade',
  unidade: 'anos',
  type: 'number',
  min: '18',
  step: '1'
}
```

Para opções clínicas, o registro usará `type: 'select'` com `options`, e para itens binários usará `type: 'checkbox'`. O componente de detalhe renderizará esses tipos sem alterar a rota pública ou o fluxo de cálculo.

Todas as funções receberão um objeto normalizado e retornarão ao menos `{ valor }`, podendo incluir `classificacao` e `observacao`. Entradas ausentes, não numéricas ou fora do domínio declarado gerarão erro tratado pela tela. Pontuações serão exibidas como pontos, sem transformar faixas em condutas clínicas.

## Regras clínicas e de comunicação

- CKD-EPI usará a equação de creatinina de 2021 recomendada pela National Kidney Foundation, sem fator racial, para adultos e creatinina em mg/dL.
- Cockcroft–Gault será identificado como estimativa e deixará explícita a limitação relacionada ao tipo de peso usado; a primeira versão usará peso informado diretamente, sem escolher automaticamente peso ideal ou ajustado.
- CHA₂DS₂-VASc exibirá apenas a pontuação e a composição dos pontos. Não exibirá “indicar anticoagulação”.
- HAS-BLED será apresentado como revisão de fatores de sangramento e não como motivo isolado para excluir anticoagulação.
- CURB-65 será usado em adultos com pneumonia adquirida na comunidade; ureia será informada em mmol/L para seguir a definição original, sem conversão silenciosa.
- Wells será a versão de dois níveis para embolia pulmonar, incluindo o item de julgamento clínico “TEP é o diagnóstico mais provável”. O resultado será “TEP improvável” ou “TEP provável”, sempre descrito como probabilidade pré-teste.
- Cada calculadora mostrará fórmula, referência e limitações na página de detalhe.
- Nenhuma calculadora usará IA, fará chamada de rede ou salvará dados inseridos.

## Interface e validação

O formulário atual será estendido de modo compatível com os campos numéricos existentes. Campos select terão opção inicial vazia; checkbox iniciará desmarcado. A validação verificará os números antes do cálculo e permitirá valores zero apenas quando a definição do escore exigir ausência de fator, representada pelo checkbox/select, não por campo numérico ambíguo.

Os testes cobrirão:

- valores conhecidos para cada fórmula ou escore;
- limites e ausência de pontos;
- entradas inválidas;
- registro completo e slugs estáveis;
- renderização dos novos tipos de campo e resultado na tela pública.

## Referências principais

- National Kidney Foundation, CKD-EPI Creatinine Equation (2021): https://www.kidney.org/ckd-epi-creatinine-equation-2021
- National Kidney Foundation, eGFR Calculator: https://www.kidney.org/professionals/gfr_calculator
- European Society of Cardiology, guideline de fibrilação atrial com tabelas CHA₂DS₂-VASc e HAS-BLED: https://www.escardio.org/static-file/Escardio/Guidelines/ehw128_Addenda.pdf
- European Society of Cardiology, guideline de embolia pulmonar com Wells: https://academic.oup.com/eurheartj/article/41/4/543/5556136
- British Thoracic Society/Thorax, estudo de derivação e validação do CURB-65: https://thorax.bmj.com/content/58/5/377
- CDC, Adult BMI Calculator, como referência do cuidado de comunicação das calculadoras públicas: https://www.cdc.gov/bmi/adult-calculator/index.html

## Fora de escopo

ASCVD/PREVENT, HEART, Centor/McIsaac, MELD-Na, qSOFA, NIHSS, calculadoras pediátricas e calculadoras de dose ficam para uma segunda priorização. Elas exigem mais campos, populações específicas, maior cuidado de interpretação ou validação adicional.

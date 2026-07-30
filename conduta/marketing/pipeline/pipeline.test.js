const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseMarketingPost,
  chooseTemplate,
  validateMarketingPost,
  outputDirectoryName,
} = require('./post-pipeline');
const { slideMarkup } = require('./renderer-html');

const sample = `# Post 999 — Exemplo

- **ID:** P999
- **Status:** draft
- **Pilar:** Demonstração do produto
- **Formato:** demonstração de tela
- **Objetivo:** mostrar uma revisão possível
- **Público:** médicos generalistas
- **Etapa do funil:** consideração
- **Funcionalidade relacionada:** feedback da análise
- **Título:** Uma resposta também pode ser revisada
- **Gancho:** Nem toda resposta precisa ser aceita sem revisão.

## Roteiro slide a slide

**Slide 1 — Gancho:** Uma resposta também pode ser revisada.

**Slide 2 — Contexto:** O retorno do médico ajuda a registrar o que precisa ser revisto.

**Slide 3 — CTA:** Veja o fluxo e valide o contexto profissional.

## Legenda

Uma legenda curta para o post.

**CTA:** Conheça o fluxo.

**Hashtags:** #medicina #raciocinioclinico

**Orienta\u00e7\u00e3o visual:** mockup simples.

**Screenshots necess\u00e1rios:** mockup autorizado.

**Elemento visual:** diagrama de três perguntas.

**Observa\u00e7\u00f5es de seguran\u00e7a:** n\u00e3o transformar retorno em verdade cl\u00ednica; revisar com profissional.
`;

test('parser normaliza metadados, slides, legenda, CTA e hashtags', () => {
  const post = parseMarketingPost(sample, 'marketing/drafts/999-exemplo.md');

  assert.equal(post.id, 'P999');
  assert.equal(post.format, 'product-demo');
  assert.equal(post.template, 'screenshot-comentado');
  assert.equal(post.slides.length, 3);
  assert.equal(post.slides[0].role, 'cover');
  assert.equal(post.slides[2].title, 'Próximo passo');
  assert.equal(post.slides[2].body, 'Veja o fluxo e valide o contexto profissional.');
  assert.equal(post.caption, 'Uma legenda curta para o post.');
  assert.deepEqual(post.hashtags, ['#medicina', '#raciocinioclinico']);
  assert.equal(post.screenshots, 'mockup autorizado.');
  assert.equal(post.visualElement, 'diagrama de três perguntas.');
});

test('último slide não exibe o rótulo técnico CTA e permanece centralizado', () => {
  const post = parseMarketingPost(sample, 'marketing/drafts/999-exemplo.md');
  const html = slideMarkup(post, post.slides[2]);

  assert.match(html, /class="canvas template-screenshot-comentado cta centered dark"/);
  assert.doesNotMatch(html, />CTA</);
  assert.doesNotMatch(html, /class="cta"/);
  assert.match(html, /Veja o fluxo e valide o contexto profissional\./);
});

test('escolha de template diferencia formatos editoriais', () => {
  assert.equal(chooseTemplate({ format: 'carousel', title: 'Como comparar hipóteses' }), 'comparacao-hipoteses');
  assert.equal(chooseTemplate({ format: 'static', title: 'Uma posição da marca' }), 'post-posicionamento');
  assert.equal(chooseTemplate({ format: 'story', title: 'Pergunta rápida' }), 'story-vertical');
  assert.equal(chooseTemplate({ format: 'reel-cover', title: 'Capa' }), 'capa-reel');
});

test('validação retorna erro acionável para conteúdo impeditivo', () => {
  const post = parseMarketingPost(sample, 'marketing/drafts/999-exemplo.md');
  post.title = 'x'.repeat(81);
  post.caption = '';
  post.slides[1].body = 'x'.repeat(321);

  const report = validateMarketingPost(post);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((item) => item.field === 'title' && item.suggestion));
  assert.ok(report.errors.some((item) => item.field === 'caption'));
  assert.ok(report.errors.some((item) => item.field === 'slides[2].body'));
});

test('nome de saída mantém ID numérico e slug ordenáveis', () => {
  assert.equal(outputDirectoryName('P007', 'Do caso ao resumo organizado'), '007-do-caso-ao-resumo-organizado');
});

test('P002 usa uma cena editorial diferente em cada slide', () => {
  const post = parseMarketingPost(sample, 'marketing/drafts/002-tres-perguntas-antes-de-abrir-mais-uma-aba.md');
  post.id = 'P002';
  post.visualElement = 'sequência editorial de cenas visuais.';
  post.slides = [
    { number: 1, role: 'cover', title: 'Três perguntas', body: '' },
    { number: 2, role: 'context', title: 'Contexto', body: 'Organize antes de buscar.' },
    { number: 3, role: 'question', title: 'Tempo', body: 'O que mudou?' },
    { number: 4, role: 'question', title: 'Dado ausente', body: 'O que falta?' },
    { number: 5, role: 'question', title: 'Reavaliar', body: 'O que muda o próximo passo?' },
    { number: 6, role: 'feature', title: 'Aplicação', body: 'O Conduta ajuda a organizar.' },
    { number: 7, role: 'cta', title: 'Salve', body: 'Revise depois.' },
  ];

  const scenes = post.slides.map((slide) => {
    const html = slideMarkup(post, slide);
    return html.match(/visual-scene-[a-z-]+/)?.[0];
  });

  assert.deepEqual(scenes, [
    'visual-scene-cover',
    'visual-scene-context',
    'visual-scene-timeline',
    'visual-scene-missing-data',
    'visual-scene-escalation',
    'visual-scene-product',
    'visual-scene-save',
  ]);
  assert.equal(new Set(scenes).size, 7);
});

test('P001 usa uma ilustração humana editorial na arte estática', () => {
  const post = parseMarketingPost(
    `# Post 001 — Quando o caso ainda não fechou\n\n- **ID:** P001\n- **Formato:** post estático\n- **Pilar:** Identificação com a rotina médica\n- **Título:** Quando o caso ainda não fechou\n- **Elemento visual:** ilustração editorial de médico diante do computador.\n\n## Roteiro completo\n\nArte única: uma dúvida clínica ainda precisa ganhar forma.`,
    'marketing/drafts/001-quando-o-caso-ainda-nao-fechou.md',
  );

  const html = slideMarkup(post, post.slides[0]);
  assert.match(html, /visual-scene-doctor/);
  assert.match(html, /doctor-monitor/);
  assert.match(html, /doctor-figure/);
});

test('P030 usa cenas editoriais diferentes para o checklist de registro', () => {
  const post = parseMarketingPost(
    `# Post 030 — Antes de levar um resumo ao prontuário\n\n- **ID:** P030\n- **Formato:** carrossel\n- **Pilar:** Registro e resumo para prontuário\n- **Título:** Antes de levar um resumo ao prontuário\n- **Elemento visual:** sequência editorial de cartões de checklist, documentos e marca de revisão.\n\n## Roteiro completo\n\n**Slide 1 — Gancho:** Um resumo ainda precisa ser revisado.\n\n**Slide 2 — Contexto:** O contexto precisa estar atualizado.\n\n**Slide 3 — Checklist:** Confira antes de registrar.\n\n**Slide 4 — Responsabilidade:** A revisão continua com o médico.\n\n**Slide 5 — Apoio:** O Conduta pode ajudar a organizar.\n\n**Slide 6 — Próximo passo:** Salve antes de registrar.`,
    'marketing/drafts/031-o-que-revisar-antes-de-copiar-um-resumo.md',
  );

  const scenes = post.slides.map((slide) => slideMarkup(post, slide).match(/visual-scene-[a-z-]+/)?.[0]);
  assert.deepEqual(scenes, [
    'visual-scene-cover',
    'visual-scene-context',
    'visual-scene-missing-data',
    'visual-scene-escalation',
    'visual-scene-product',
    'visual-scene-save',
  ]);
  assert.equal(new Set(scenes).size, 6);
});

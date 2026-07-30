const fs = require('node:fs');
const path = require('node:path');

const FORMAT_MAP = new Map([
  ['carrossel', 'carousel'],
  ['carrossel educativo', 'carousel'],
  ['post estático', 'static'],
  ['post estatico', 'static'],
  ['post de identificação', 'static'],
  ['demonstração de tela', 'product-demo'],
  ['demonstracao de tela', 'product-demo'],
  ['demonstração do produto', 'product-demo'],
  ['demonstração', 'product-demo'],
  ['reel', 'reel-cover'],
  ['capa de reel', 'reel-cover'],
  ['story', 'story'],
  ['stories', 'story'],
]);

const ROLE_BY_LABEL = [
  ['cta', 'cta'],
  ['proximo passo', 'cta'],
  ['fechamento', 'cta'],
  ['lembrete', 'cta'],
  ['gancho', 'cover'],
  ['capa', 'cover'],
  ['contexto', 'context'],
  ['problema', 'problem'],
  ['dor', 'problem'],
  ['risco', 'problem'],
  ['apoio', 'feature'],
  ['demonstração', 'feature'],
  ['demonstracao', 'feature'],
  ['funcionalidade', 'feature'],
];

function stripAccents(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeKey(value) {
  return stripAccents(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function cleanMarkdown(value) {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s{2,}/g, ' ');
}

function isTechnicalCtaLabel(label) {
  const normalized = normalizeKey(label);
  return normalized === 'cta' || normalized === 'call to action';
}

function splitCtaCopy(content) {
  const match = String(content || '').match(/^(.+?[.!?])(?:\s+|$)(.*)$/);
  if (match && match[2]) return { title: match[1], body: match[2] };
  return { title: 'Próximo passo', body: String(content || '') };
}

function slugify(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-{2,}/g, '-');
}

function parseScalar(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try { return JSON.parse(trimmed); } catch { return trimmed; }
  }
  return trimmed.replace(/^['"]|['"]$/g, '');
}

function parseFrontmatter(lines) {
  if (lines[0]?.trim() !== '---') return { values: {}, start: 0 };
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (end < 0) return { values: {}, start: 0 };
  const values = {};
  for (const line of lines.slice(1, end)) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (match) values[normalizeKey(match[1])] = parseScalar(match[2]);
  }
  return { values, start: end + 1 };
}

function sectionMap(lines) {
  const sections = new Map();
  let current = null;
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = normalizeKey(heading[1]);
      sections.set(current, []);
    } else if (current) {
      sections.get(current).push(line);
    }
  }
  return sections;
}

function extractFields(lines) {
  const fields = {};
  for (const line of lines) {
    const match = line.match(/^\s*-\s+\*\*([^:]+):\*\*\s*(.*?)\s*$/);
    if (match) fields[normalizeKey(match[1])] = cleanMarkdown(match[2]);
  }
  return fields;
}

function extractBoldField(markdown, labels) {
  const wanted = labels.map((label) => normalizeKey(label));
  const lines = String(markdown || '').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/\*\*([^:]+):\*\*\s*(.+)/);
    if (!match) continue;
    const key = normalizeKey(match[1]);
    if (wanted.some((label) => key === label || key.startsWith(`${label} `))) return cleanMarkdown(match[2]);
  }
  return '';
}

function normalizeFormat(value) {
  const normalized = normalizeKey(value);
  if (FORMAT_MAP.has(normalized)) return FORMAT_MAP.get(normalized);
  for (const [key, format] of FORMAT_MAP.entries()) {
    if (normalized.startsWith(key) || normalized.includes(key)) return format;
  }
  if (normalized.includes('reel')) return 'reel-cover';
  if (normalized.includes('story')) return 'story';
  if (normalized.includes('demonstracao')) return 'product-demo';
  return normalized.replace(/\s+/g, '-') || 'static';
}

function roleFromLabel(label, number) {
  if (number === 1) return 'cover';
  const normalized = normalizeKey(label);
  const found = ROLE_BY_LABEL.find(([needle]) => normalized.includes(needle));
  return found ? found[1] : 'content';
}

function parseSlides(lines, format, fallbackTitle) {
  const slidePattern = /^\s*\*\*(?:Slide|Tela)\s+(\d+)(?:\s*[—-]\s*([^:]+))?:\*\*\s*(.+?)\s*$/i;
  const slides = [];
  for (const line of lines) {
    const match = line.match(slidePattern);
    if (!match) continue;
    const number = Number(match[1]);
    const label = cleanMarkdown(match[2] || '');
    const content = cleanMarkdown(match[3]);
    const role = roleFromLabel(label, number);
    const isCover = role === 'cover';
    const ctaCopy = isTechnicalCtaLabel(label) ? splitCtaCopy(content) : null;
    slides.push({
      number,
      role,
      title: isCover ? content : (ctaCopy ? ctaCopy.title : (label || undefined)),
      body: isCover ? '' : (ctaCopy ? ctaCopy.body : content),
      bullets: [],
      emphasis: [],
      illustrationPrompt: undefined,
      screenshot: undefined,
    });
  }
  if (slides.length) return slides;

  const body = lines
    .filter((line) => line.trim())
    .map((line) => cleanMarkdown(line).replace(/^(?:Arte única|Linha de apoio|Texto):\s*/i, ''))
    .filter(Boolean)
    .join('\n');
  return [{
    number: 1,
    role: format === 'static' ? 'content' : 'cover',
    title: fallbackTitle,
    body,
    bullets: [],
    emphasis: [],
    illustrationPrompt: undefined,
    screenshot: undefined,
  }];
}

function parseCaption(markdown, sections) {
  const lines = sections.get('legenda') || [];
  const captionLines = [];
  for (const line of lines) {
    const normalizedLine = normalizeKey(line.replace(/\*\*/g, ''));
    if (/^(cta|hashtags|orientacao visual|screenshots necessarios|texto alternativo|observacoes de seguranca|elemento visual|checklist)/.test(normalizedLine)) continue;
    if (line.trim()) captionLines.push(cleanMarkdown(line));
  }
  if (captionLines.length) return captionLines.join('\n\n');
  return cleanMarkdown(markdown.match(/##\s+Legenda\s+([\s\S]*?)(?=\n##\s+|$)/i)?.[1] || '');
}

function chooseTemplate(post) {
  const normalizedTitle = normalizeKey(post.title);
  if (post.format === 'carousel') {
    if (/(hipotese|hipoteses|compar)/.test(normalizedTitle)) return 'comparacao-hipoteses';
    if (/(checklist|lista|antes de)/.test(normalizedTitle)) return 'checklist';
    if (/(caso|ficticio)/.test(normalizedTitle)) return 'caso-clinico-ficticio';
    return 'carrossel-educacional';
  }
  if (post.format === 'product-demo') return 'screenshot-comentado';
  if (post.format === 'reel-cover') return 'capa-reel';
  if (post.format === 'story') return 'story-vertical';
  return 'post-posicionamento';
}

function parseMarketingPost(markdown, filePath = 'post.md') {
  const source = String(markdown || '').replace(/^\uFEFF/, '');
  const rawLines = source.split(/\r?\n/);
  const frontmatter = parseFrontmatter(rawLines);
  const lines = rawLines.slice(frontmatter.start);
  const fields = { ...extractFields(lines), ...frontmatter.values };
  const heading = lines.find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, '').replace(/^Post\s+\d+\s*[—-]\s*/i, '').trim() || '';
  const title = fields.titulo || heading;
  const sections = sectionMap(lines);
  const scriptLines = sections.get('roteiro slide a slide') || sections.get('roteiro completo') || [];
  const format = normalizeFormat(fields.formato);
  const caption = parseCaption(source, sections);
  const hashtagsText = fields.hashtags || extractBoldField(source, ['Hashtags']);
  const hashtags = hashtagsText.split(/\s+/).filter((tag) => tag.startsWith('#'));
  const rawId = String(fields.id || '');
  const fileNumber = path.basename(filePath).match(/^(\d+)/)?.[1];
  const id = /^P\d+$/i.test(rawId) ? rawId.toUpperCase() : `P${fileNumber || rawId.match(/\d+/)?.[0] || '000'}`;
  const post = {
    id,
    slug: slugify(fields.titulo || title || path.basename(filePath, path.extname(filePath))),
    status: String(fields.status || 'draft').toLowerCase(),
    format,
    template: '',
    pillar: fields.pilar || '',
    objective: fields.objetivo || '',
    audience: fields.publico || '',
    funnelStage: fields['etapa do funil'] || fields.funil || '',
    relatedFeature: fields['funcionalidade relacionada'] || '',
    pain: fields['dor abordada'] || '',
    title,
    hook: fields.gancho || '',
    caption,
    cta: fields.cta || extractBoldField(source, ['CTA']),
    hashtags,
    slides: parseSlides(scriptLines, format, title),
    visualGuidance: fields['orientacao visual'] || extractBoldField(source, ['Orientação visual']),
    visualElement: fields['elemento visual'] || extractBoldField(source, ['Elemento visual']),
    screenshots: fields['screenshots necessarios'] || extractBoldField(source, ['Screenshots necessários']),
    altText: fields['texto alternativo'] || extractBoldField(source, ['Texto alternativo']),
    safetyNotes: fields['observacoes de seguranca'] || extractBoldField(source, ['Observações de segurança']),
    checklist: fields.checklist || fields['checklist de revisao'] || extractBoldField(source, ['Checklist']),
    sourceFile: filePath,
  };
  post.template = chooseTemplate(post);
  return post;
}

function isClinicalPost(post) {
  if (post.format === 'static' && !/(segur|educa|hipotes|risco|red flag|encamin|medic)/i.test(`${post.pillar} ${post.title}`)) return false;
  const haystack = normalizeKey([
    post.pillar,
    post.relatedFeature,
    post.objective,
    post.title,
    post.format,
  ].join(' '));
  return !/(identificacao|posicionamento|bastidores)/.test(haystack)
    && /(clin|hipotes|medic|risco|red flag|encamin|racioc|prontuario|analise|conduta|sessao)/.test(haystack);
}

function validateMarketingPost(post) {
  const errors = [];
  const warnings = [];
  const add = (collection, code, field, message, suggestion) => collection.push({ code, field, message, suggestion });

  for (const field of ['id', 'title', 'format', 'template', 'caption']) {
    if (!post[field] || !String(post[field]).trim()) add(errors, 'required', field, `Campo obrigatório ausente: ${field}.`, `Preencha ${field} no Markdown.`);
  }
  if (!/^P\d+$/.test(post.id || '')) add(errors, 'id-format', 'id', 'ID deve seguir o padrão P001.', 'Use o ID editorial do post.');
  if (!['draft', 'approved', 'published'].includes(post.status)) add(errors, 'status', 'status', `Status inválido: ${post.status}.`, 'Use draft, approved ou published.');
  if ((post.title || '').length > 80) add(errors, 'title-too-long', 'title', 'Título excede 80 caracteres.', 'Reduza o título ou divida a ideia em outro slide.');
  if (!(post.caption || '').trim()) add(errors, 'caption-empty', 'caption', 'Legenda vazia.', 'Escreva uma legenda curta que complemente a arte.');

  const numbers = post.slides.map((slide) => slide.number);
  const expected = numbers.map((_, index) => index + 1);
  if (JSON.stringify(numbers) !== JSON.stringify(expected)) add(errors, 'slide-sequence', 'slides', 'Sequência de slides incorreta.', 'Renumerar os slides a partir de 1, sem lacunas.');
  const seen = new Set();
  for (const slide of post.slides) {
    const key = `${slide.title || ''}|${slide.body || ''}`.toLowerCase();
    if (seen.has(key)) add(errors, 'duplicate-slide', `slides[${slide.number}]`, 'Slide duplicado.', 'Remova a repetição ou diferencie o conteúdo.');
    seen.add(key);
    if ((slide.body || '').length > 320) add(errors, 'body-too-long', `slides[${slide.number}].body`, 'Texto do slide excede 320 caracteres.', 'Redistribua, divida em outro slide ou reduza o texto; não diminua a fonte até ficar ilegível.');
    if ((slide.title || '').length > 90) add(errors, 'slide-title-too-long', `slides[${slide.number}].title`, 'Título do slide excede 90 caracteres.', 'Reduza o título ou crie um slide adicional.');
    if ((slide.bullets || []).length > 6) add(errors, 'too-many-bullets', `slides[${slide.number}].bullets`, 'Quantidade excessiva de bullets.', 'Limite a seis itens ou distribua o conteúdo.');
  }
  if (['carousel', 'product-demo', 'reel-cover', 'story'].includes(post.format) && !(post.cta || '').trim()) {
    add(errors, 'cta-missing', 'cta', 'CTA ausente para este formato.', 'Inclua uma ação única e coerente com o estágio do funil.');
  }
  if (post.screenshots && !/^(não|nao|nenhum|n[aã]o se aplica)/i.test(post.screenshots) && post.format === 'product-demo') {
    warnings.push({ code: 'screenshot-needed', field: 'screenshots', message: 'O post solicita screenshot ou mockup.', suggestion: 'Use somente captura autorizada com dados fictícios ou o mockup local.' });
  }
  if (isClinicalPost(post) && !/(valid|protocol|profissional|context|fict|educativ|decis|diagnos|condut|revis|nao afirmar|não afirmar|nao prometer|não prometer)/i.test(post.safetyNotes || '')) {
    add(errors, 'disclaimer-missing', 'safetyNotes', 'Conteúdo clínico sem observação de segurança suficiente.', 'Inclua limite de uso, necessidade de contexto e validação profissional.');
  }
  if (!post.altText) warnings.push({ code: 'alt-text-missing', field: 'altText', message: 'Texto alternativo ausente.', suggestion: 'Descreva a informação visual principal.' });
  if (!post.visualGuidance) warnings.push({ code: 'visual-guidance-missing', field: 'visualGuidance', message: 'Orientação visual ausente.', suggestion: 'Defina layout, contraste e material necessário.' });
  return { valid: errors.length === 0, errors, warnings };
}

function outputDirectoryName(id, title) {
  const number = String(id || '').match(/(\d+)/)?.[1] || '000';
  return `${number.padStart(3, '0')}-${slugify(title || id)}`;
}

function parseDraftFile(filePath) {
  return parseMarketingPost(fs.readFileSync(filePath, 'utf8'), filePath);
}

module.exports = {
  FORMAT_MAP,
  chooseTemplate,
  isClinicalPost,
  normalizeFormat,
  outputDirectoryName,
  parseDraftFile,
  parseMarketingPost,
  slugify,
  validateMarketingPost,
};

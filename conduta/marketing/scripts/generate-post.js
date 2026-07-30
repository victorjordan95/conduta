const fs = require('node:fs');
const path = require('node:path');

const CONTEXT_FILES = [
  'brand.md',
  'audience.md',
  'features.md',
  'content-rules.md',
  'content-pillars.md',
  'published-posts.md',
  'ideas-backlog.md',
];

function caminhoMarketing(rootDir) {
  return path.join(rootDir, 'marketing');
}

function lerContexto(rootDir) {
  const marketingDir = caminhoMarketing(rootDir);
  return Object.fromEntries(CONTEXT_FILES.map((nome) => [
    nome,
    fs.readFileSync(path.join(marketingDir, nome), 'utf8'),
  ]));
}

function dividirLinhaTabela(linha) {
  return linha.split('|').slice(1, -1).map((valor) => valor.trim());
}

function lerPautas(markdown) {
  const linhas = markdown.split(/\r?\n/).filter((linha) => /^\| P\d{3} \|/.test(linha));
  return linhas.map((linha) => {
    const valores = dividirLinhaTabela(linha);
    return {
      id: valores[0],
      status: valores[1],
      titulo: valores[2],
      pilar: valores[3],
      formato: valores[4],
      objetivo: valores[5],
      publico: valores[6],
      funil: valores[7],
      funcionalidade: valores[8],
      dor: valores[9],
      abordagem: valores[10],
      cta: valores[11],
      esforco: valores[12],
      screenshot: valores[13],
    };
  });
}

function lerMetadados(markdown) {
  const campos = {};
  for (const linha of markdown.split(/\r?\n/)) {
    const correspondencia = linha.match(/^- \*\*([^*]+):\*\*\s*(.*)$/);
    if (correspondencia) campos[correspondencia[1].toLowerCase()] = correspondencia[2].trim();
  }
  return campos;
}

function lerMetadadosDosDrafts(marketingDir) {
  const draftsDir = path.join(marketingDir, 'drafts');
  if (!fs.existsSync(draftsDir)) return [];
  return fs.readdirSync(draftsDir)
    .filter((nome) => nome.endsWith('.md'))
    .sort()
    .map((nome) => lerMetadados(fs.readFileSync(path.join(draftsDir, nome), 'utf8')));
}

function lerPublicacoes(markdown) {
  return markdown.split(/\r?\n/)
    .filter((linha) => /^\| [^—-][^|]* \|/.test(linha) && !/^\| ID \|/.test(linha))
    .map((linha) => {
      const valores = dividirLinhaTabela(linha);
      return {
        titulo: valores[3],
        funcionalidade: valores[5],
        cta: valores[6],
      };
    });
}

function normalizar(valor = '') {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function selecionarPauta(contexto, metadadosDrafts) {
  const pautas = lerPautas(contexto['ideas-backlog.md']);
  const pendentes = pautas.filter((pauta) => pauta.status === 'pendente');
  if (pendentes.length === 0) throw new Error('Nenhuma pauta pendente encontrada em marketing/ideas-backlog.md.');

  const historicoPublicado = lerPublicacoes(contexto['published-posts.md']);
  const historico = [...metadadosDrafts, ...historicoPublicado];
  const titulosUsados = new Set(historico.map((item) => normalizar(item.título || item.titulo)));
  const doresUsadas = new Set(metadadosDrafts.map((item) => normalizar(item.dor)));
  const ganchosUsados = new Set(metadadosDrafts.map((item) => normalizar(item.gancho)));
  const ctaContagem = new Map();
  for (const item of historico) {
    const cta = normalizar(item.cta);
    if (cta) ctaContagem.set(cta, (ctaContagem.get(cta) || 0) + 1);
  }
  const ultimo = metadadosDrafts.at(-1);
  const ultimaFuncionalidade = normalizar(ultimo?.['funcionalidade relacionada']);

  const elegiveis = pendentes.filter((pauta) => {
    const cta = normalizar(pauta.cta);
    return !titulosUsados.has(normalizar(pauta.titulo))
      && !doresUsadas.has(normalizar(pauta.dor))
      && !ganchosUsados.has(normalizar(pauta.titulo))
      && normalizar(pauta.funcionalidade) !== ultimaFuncionalidade
      && (ctaContagem.get(cta) || 0) < 2;
  });

  return (elegiveis[0] || pendentes.find((pauta) => normalizar(pauta.funcionalidade) !== ultimaFuncionalidade) || pendentes[0]);
}

function slugificar(texto) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);
}

function proximoNumero(draftsDir) {
  const numeros = fs.existsSync(draftsDir)
    ? fs.readdirSync(draftsDir).map((nome) => Number(nome.slice(0, 3))).filter(Number.isFinite)
    : [];
  return String(Math.max(0, ...numeros) + 1).padStart(3, '0');
}

function hashtagsPara(pilar) {
  const base = ['#medicinageral', '#raciocinioclinico', '#medicosbrasileiros'];
  if (normalizar(pilar).includes('educacao')) base.push('#educacaomedica');
  if (normalizar(pilar).includes('demonstracao')) base.push('#tecnologianasaude');
  if (normalizar(pilar).includes('identificacao')) base.push('#rotinamedica');
  return base.join(' ');
}

function gerarConteudo(pauta, numero) {
  const formato = pauta.formato.toLowerCase();
  const eCarrossel = formato.includes('carrossel');
  const roteiro = eCarrossel
    ? `**Slide 1 — Gancho:** ${pauta.titulo}.\n\n**Slide 2 — Contexto:** ${pauta.abordagem}.\n\n**Slide 3 — Desenvolvimento:** Organize o que já está claro, o que falta e o que precisa ser revisado.\n\n**Slide 4 — Aplicação:** Use a estrutura como exercício educativo e adapte ao contexto profissional.\n\n**Slide 5 — Apoio:** O Conduta pode ajudar a organizar ${pauta.funcionalidade.toLowerCase()}, sem substituir decisão clínica.\n\n**Slide 6 — Próximo passo:** ${pauta.cta}. Caso fictício e educativo.`
    : `**Cena 1:** ${pauta.titulo}.\n\n**Cena 2:** ${pauta.abordagem}.\n\n**Cena 3:** Mostre como uma revisão organizada pode apoiar o profissional.\n\n**Cena 4:** Reforce: confira contexto, fontes e protocolos locais.\n\n**Cena 5 — Próximo passo:** ${pauta.cta}.`;

  return `# Post ${numero} — ${pauta.titulo}\n\n- **ID:** ${pauta.id}\n- **Status:** draft\n- **Pilar:** ${pauta.pilar}\n- **Formato:** ${pauta.formato}\n- **Objetivo:** ${pauta.objetivo}\n- **Público:** ${pauta.publico}\n- **Etapa do funil:** ${pauta.funil}\n- **Funcionalidade relacionada:** ${pauta.funcionalidade}\n- **Dor abordada:** ${pauta.dor}\n- **Título:** ${pauta.titulo}\n- **Gancho:** ${pauta.titulo}\n\n## Roteiro completo\n\n${roteiro}\n\n## Legenda\n\n${pauta.abordagem}. O conteúdo deve ajudar a revisar o raciocínio, sem apresentar diagnóstico definitivo ou conduta individual. O caso, se houver, deve ser fictício e não identificável.\n\nO Conduta funciona como apoio ao raciocínio clínico. A decisão continua com o profissional, que deve conferir o contexto e os protocolos locais.\n\n**CTA:** ${pauta.cta}.\n\n**Hashtags:** ${hashtagsPara(pauta.pilar)}\n\n**Orientação visual:** usar o template de ${pauta.formato.toLowerCase()}, com Barlow/Barlow Condensed, teal #1a6b73, navy #1e2a35 e contraste AA.\n\n**Screenshots necessários:** ${pauta.screenshot}. Se houver imagem, usar mockup ou captura autorizada sem dados reais.\n\n**Texto alternativo:** Arte sobre ${pauta.titulo}, com orientação educativa para médicos.\n\n**Observações de segurança:** validar conteúdo clínico com profissional humano; não publicar automaticamente; não inserir dados de pacientes.\n\n**Checklist de revisão:** [ ] regras editoriais lidas; [ ] funcionalidade confirmada; [ ] sem promessa absoluta; [ ] português revisado; [ ] CTA coerente; [ ] acessibilidade conferida; [ ] validação humana registrada.`;
}

function atualizarStatus(markdown, id) {
  const padrao = new RegExp(`(^\\| ${id} \\| )pendente(?= \\|)`, 'm');
  const atualizado = markdown.replace(padrao, '$1gerada');
  if (atualizado === markdown) throw new Error(`Não foi possível atualizar o status da pauta ${id}.`);
  return atualizado;
}

function gerarRascunho({ rootDir = path.resolve(__dirname, '../..') } = {}) {
  const contexto = lerContexto(rootDir);
  const marketingDir = caminhoMarketing(rootDir);
  const draftsDir = path.join(marketingDir, 'drafts');
  const metadadosDrafts = lerMetadadosDosDrafts(marketingDir);
  const pauta = selecionarPauta(contexto, metadadosDrafts);
  const numero = proximoNumero(draftsDir);
  const nome = `${numero}-${slugificar(pauta.titulo)}.md`;
  const filePath = path.join(draftsDir, nome);

  fs.mkdirSync(draftsDir, { recursive: true });
  fs.writeFileSync(filePath, gerarConteudo(pauta, numero), 'utf8');
  fs.writeFileSync(
    path.join(marketingDir, 'ideas-backlog.md'),
    atualizarStatus(contexto['ideas-backlog.md'], pauta.id),
    'utf8',
  );

  return { idea: pauta, filePath };
}

if (require.main === module) {
  try {
    const resultado = gerarRascunho();
    console.log(`Rascunho criado: ${path.relative(process.cwd(), resultado.filePath)}`);
    console.log(`Pauta atualizada: ${resultado.idea.id}`);
  } catch (erro) {
    console.error(`Falha ao gerar rascunho: ${erro.message}`);
    process.exitCode = 1;
  }
}

module.exports = { gerarRascunho, lerPautas, selecionarPauta, gerarConteudo };

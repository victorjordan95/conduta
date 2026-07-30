const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

const {
  outputDirectoryName,
  parseDraftFile,
  validateMarketingPost,
} = require('../pipeline/post-pipeline');
const { dimensionsFor, renderSlideHtml, writePreviewHtml } = require('../pipeline/renderer-html');

const ROOT = path.resolve(__dirname, '..', '..');
const DRAFTS_DIR = path.join(ROOT, 'marketing', 'drafts');
const GENERATED_DIR = path.join(ROOT, 'marketing', 'generated');

function browserPath() {
  const configured = process.env.MARKETING_BROWSER_PATH;
  const candidates = [
    configured,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24 || buffer.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function draftFiles() {
  return fs.readdirSync(DRAFTS_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(DRAFTS_DIR, name));
}

function resolveDraftPath(input) {
  const candidate = path.resolve(ROOT, input || '');
  if (!fs.existsSync(candidate) || !candidate.startsWith(DRAFTS_DIR)) {
    throw new Error(`Rascunho inválido ou fora de marketing/drafts: ${input}`);
  }
  return candidate;
}

async function renderPost(filePath) {
  const post = parseDraftFile(filePath);
  const report = validateMarketingPost(post);
  const dimensions = dimensionsFor(post.format);
  const outputPath = path.join(GENERATED_DIR, outputDirectoryName(post.id, post.title));
  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(path.join(outputPath, 'post.json'), `${JSON.stringify(post, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputPath, 'caption.txt'), `${post.caption}\n\n${post.cta ? `CTA: ${post.cta}\n` : ''}${post.hashtags.join(' ')}\n`, 'utf8');

  if (!report.valid) {
    const failedReport = { ...report, post: { id: post.id, sourceFile: post.sourceFile }, generatedFiles: [] };
    fs.writeFileSync(path.join(outputPath, 'validation-report.json'), `${JSON.stringify(failedReport, null, 2)}\n`, 'utf8');
    throw new Error(`Validação impeditiva em ${path.basename(filePath)}: ${report.errors.map((error) => `${error.field} — ${error.message}`).join('; ')}`);
  }

  const browser = browserPath();
  if (!browser) {
    report.errors.push({ code: 'browser-missing', field: 'renderer', message: 'Nenhum Chrome/Chromium/Edge disponível para gerar PNG.', suggestion: 'Defina MARKETING_BROWSER_PATH ou instale um navegador Chromium local.' });
    report.valid = false;
    fs.writeFileSync(path.join(outputPath, 'validation-report.json'), `${JSON.stringify({ ...report, post: { id: post.id, sourceFile: post.sourceFile } }, null, 2)}\n`, 'utf8');
    throw new Error('Navegador Chromium não encontrado. Nenhum PNG foi gerado.');
  }

  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'conduta-marketing-'));
  const generatedFiles = ['post.json', 'caption.txt'];
  const browserInstance = await chromium.launch({
    executablePath: browser,
    headless: true,
    args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
  });
  try {
    const page = await browserInstance.newPage({ viewport: dimensions, deviceScaleFactor: 1 });
    for (const slide of post.slides) {
      const htmlPath = path.join(tempPath, `slide-${String(slide.number).padStart(2, '0')}.html`);
      const pngPath = path.join(outputPath, `slide-${String(slide.number).padStart(2, '0')}.png`);
      fs.writeFileSync(htmlPath, renderSlideHtml(post, slide), 'utf8');
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts?.ready);
      await page.screenshot({ path: pngPath, type: 'png' });
      const actual = pngDimensions(pngPath);
      if (!actual || actual.width !== dimensions.width || actual.height !== dimensions.height) {
        throw new Error(`Dimensão incorreta no slide ${slide.number}: esperado ${dimensions.width}x${dimensions.height}, recebido ${actual ? `${actual.width}x${actual.height}` : 'PNG inválido'}.`);
      }
      generatedFiles.push(path.basename(pngPath));
    }
  } finally {
    await browserInstance.close();
    fs.rmSync(tempPath, { recursive: true, force: true });
  }

  report.dimensions = dimensions;
  report.browser = path.basename(browser);
  writePreviewHtml(path.join(outputPath, 'preview.html'), post, report, path.basename(outputPath));
  generatedFiles.push('preview.html', 'validation-report.json');
  report.generatedFiles = generatedFiles;
  fs.writeFileSync(path.join(outputPath, 'validation-report.json'), `${JSON.stringify({ ...report, post: { id: post.id, sourceFile: post.sourceFile } }, null, 2)}\n`, 'utf8');
  return { post, report, outputPath, generatedFiles };
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Uso: npm run marketing:render -- marketing/drafts/001-post.md');
    process.exitCode = 1;
    return;
  }
  try {
    const result = await renderPost(resolveDraftPath(input));
    console.log(`Renderizado ${result.post.id}: ${result.outputPath}`);
    console.log(`${result.generatedFiles.length} arquivos gerados; ${result.report.warnings.length} alerta(s).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  browserPath,
  draftFiles,
  pngDimensions,
  renderPost,
  resolveDraftPath,
};

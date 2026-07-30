const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

const { parseDraftFile, validateMarketingPost, outputDirectoryName } = require('../pipeline/post-pipeline');
const { dimensionsFor, renderSlideHtml, writePreviewHtml } = require('../pipeline/renderer-html');
const { browserPath, pngDimensions } = require('./render-post');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE = path.join(ROOT, 'marketing', 'drafts', '038-caso-ficticio-retorno-com-sintoma-novo.md');
const GENERATED_DIR = path.join(ROOT, 'marketing', 'generated');

async function renderSquarePost() {
  const sourcePost = parseDraftFile(SOURCE);
  const report = validateMarketingPost(sourcePost);
  if (!report.valid) throw new Error(report.errors.map((item) => `${item.field} — ${item.message}`).join('; '));

  const post = { ...sourcePost, format: 'square' };
  const dimensions = dimensionsFor(post.format);
  const outputPath = path.join(GENERATED_DIR, `${outputDirectoryName(post.id, post.title)}-square`);
  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(path.join(outputPath, 'post.json'), `${JSON.stringify(post, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputPath, 'caption.txt'), `${post.caption}\n\n${post.hashtags.join(' ')}\n`, 'utf8');

  const browser = browserPath();
  if (!browser) throw new Error('Navegador Chromium não encontrado.');
  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'conduta-marketing-square-'));
  const browserInstance = await chromium.launch({ executablePath: browser, headless: true, args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'] });
  const generatedFiles = ['post.json', 'caption.txt'];
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
        throw new Error(`Dimensão incorreta no slide ${slide.number}.`);
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
  console.log(`Renderizado quadrado ${post.id}: ${outputPath}`);
}

renderSquarePost().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

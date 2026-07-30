const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { parseDraftFile } = require('../pipeline/post-pipeline');
const { resolveDraftPath } = require('./render-post');

const ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(ROOT, 'marketing', 'assets', 'generated');

function cacheKey(prompt, model, size, quality) {
  return crypto.createHash('sha256').update(JSON.stringify({ prompt, model, size, quality })).digest('hex').slice(0, 24);
}

function safePrompt(prompt) {
  return `${prompt}. Editorial illustration for Conduta, clean professional composition, generous negative space, no text, no letters, no logos, no identifiable patients, no real medical records, no graphic medical imagery, non-sensationalist, suitable for a medical education brand.`;
}

async function generateIllustrations(filePath, { force = false } = {}) {
  const post = parseDraftFile(filePath);
  const prompts = post.slides.flatMap((slide) => slide.illustrationPrompt ? [{ slide: slide.number, prompt: slide.illustrationPrompt }] : []);
  if (!prompts.length) return { post, generated: [], skipped: 'Nenhum illustrationPrompt foi declarado no post.' };
  if (String(process.env.MARKETING_ENABLE_AI_IMAGES).toLowerCase() !== 'true') return { post, generated: [], skipped: 'MARKETING_ENABLE_AI_IMAGES não está true; nenhuma chamada externa foi feita.' };
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY é obrigatória quando MARKETING_ENABLE_AI_IMAGES=true.');

  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  const size = process.env.OPENAI_IMAGE_SIZE || '1024x1536';
  const quality = process.env.OPENAI_IMAGE_QUALITY || 'medium';
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const generated = [];
  for (const item of prompts) {
    const prompt = safePrompt(item.prompt);
    const key = cacheKey(prompt, model, size, quality);
    const imagePath = path.join(OUTPUT_DIR, `${key}.png`);
    const metadataPath = path.join(OUTPUT_DIR, `${key}.json`);
    if (fs.existsSync(imagePath) && fs.existsSync(metadataPath) && !force) {
      generated.push({ slide: item.slide, image: imagePath, cached: true });
      continue;
    }
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, size, quality, output_format: 'png' }),
    });
    if (!response.ok) throw new Error(`OpenAI Images API retornou HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json();
    const itemData = data.data?.[0];
    if (!itemData?.b64_json) throw new Error('A resposta da API não contém b64_json; nenhum arquivo foi salvo.');
    fs.writeFileSync(imagePath, Buffer.from(itemData.b64_json, 'base64'));
    fs.writeFileSync(metadataPath, `${JSON.stringify({ postId: post.id, slide: item.slide, prompt, model, size, quality, generatedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
    generated.push({ slide: item.slide, image: imagePath, cached: false });
  }
  return { post, generated };
}

async function main() {
  const input = process.argv[2];
  if (!input) { console.error('Uso: npm run marketing:illustrate -- marketing/drafts/001-post.md [--force]'); process.exitCode = 1; return; }
  try {
    const result = await generateIllustrations(resolveDraftPath(input), { force: process.argv.includes('--force') });
    if (result.skipped) console.log(result.skipped);
    else console.log(`${result.generated.length} ilustração(ões) processada(s) para ${result.post.id}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { cacheKey, generateIllustrations, safePrompt };

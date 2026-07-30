const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const SCENARIOS_DIR = path.join(ROOT, 'marketing', 'screenshots', 'scenarios');
const OUTPUT_DIR = path.join(ROOT, 'marketing', 'assets', 'screenshots');

async function main() {
  const scenarios = fs.readdirSync(SCENARIOS_DIR).filter((file) => file.endsWith('.json')).map((file) => JSON.parse(fs.readFileSync(path.join(SCENARIOS_DIR, file), 'utf8')));
  if (String(process.env.MARKETING_SCREENSHOT_ALLOW).toLowerCase() !== 'true' || !process.env.MARKETING_SCREENSHOT_BASE_URL) {
    console.log(`${scenarios.length} cenário(s) encontrado(s), mas screenshots estão desativados ou o app local não foi configurado. Nenhuma captura foi feita.`);
    return;
  }
  const browser = process.env.MARKETING_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(browser)) throw new Error('Browser configurado não encontrado. Defina MARKETING_BROWSER_PATH.');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const enabled = scenarios.filter((item) => item.enabled !== false);
  const browserInstance = await chromium.launch({ executablePath: browser, headless: true, args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'] });
  try {
    for (const scenario of enabled) {
      if (!/local|mock/i.test(scenario.stateRequired || '')) throw new Error(`Cenário ${scenario.name} não declara estado local/mockado; captura interrompida por segurança.`);
      const output = path.join(OUTPUT_DIR, scenario.output);
      const url = new URL(scenario.route, process.env.MARKETING_SCREENSHOT_BASE_URL).toString();
      const page = await browserInstance.newPage({ viewport: scenario.viewport, deviceScaleFactor: 1 });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.screenshot({ path: output, type: 'png', fullPage: false, animations: 'disabled' });
      await page.close();
      if (!fs.existsSync(output)) throw new Error(`Falha segura no cenário ${scenario.name}: arquivo não foi criado.`);
      console.log(`Screenshot salvo: ${output}`);
    }
  } finally {
    await browserInstance.close();
  }
}

if (require.main === module) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { main };

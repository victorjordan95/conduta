const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { draftFiles } = require('./render-post');
const { parseDraftFile } = require('../pipeline/post-pipeline');

const ROOT = path.resolve(__dirname, '..', '..');
const GENERATED_DIR = path.join(ROOT, 'marketing', 'generated');
const PORT = Number(process.env.MARKETING_PREVIEW_PORT || 4173);

function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dashboard() {
  const cards = draftFiles().map((file) => {
    const post = parseDraftFile(file);
    const directory = fs.readdirSync(GENERATED_DIR, { withFileTypes: true }).find((entry) => entry.isDirectory() && fs.existsSync(path.join(GENERATED_DIR, entry.name, 'post.json')) && JSON.parse(fs.readFileSync(path.join(GENERATED_DIR, entry.name, 'post.json'), 'utf8')).id === post.id);
    return `<article><div class="tag">${escapeHtml(post.id)} · ${escapeHtml(post.format)}</div><h2>${escapeHtml(post.title)}</h2><p>${escapeHtml(post.template)} · ${directory ? 'renderizado' : 'ainda não renderizado'}</p>${directory ? `<a href="/generated/${encodeURIComponent(directory.name)}/preview.html">Abrir preview</a>` : '<span class="muted">Rode marketing:render para gerar</span>'}</article>`;
  }).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conduta — Preview de marketing</title><style>body{margin:0;background:#f4f5f7;color:#1a1a2e;font:16px/1.5 Barlow,Arial,sans-serif}main{max-width:1180px;margin:auto;padding:42px 24px}h1{font:800 54px/1.05 'Barlow Condensed',Arial,sans-serif;color:#1e2a35}header{margin-bottom:30px}header p{color:#5a6a7a}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}article{background:#fff;border:1px solid #dde3ec;border-radius:10px;padding:20px;box-shadow:0 4px 12px #1e2a3510}h2{font:700 28px/1.1 'Barlow Condensed',Arial,sans-serif;color:#1e2a35}.tag{color:#1a6b73;font-weight:700;font-size:13px;letter-spacing:.04em;text-transform:uppercase}a{display:inline-block;margin-top:10px;padding:9px 13px;border-radius:6px;background:#1a6b73;color:#fff;text-decoration:none;font-weight:700}.muted{color:#64707d;font-size:14px}</style></head><body><main><header><h1>Preview de marketing</h1><p>Galeria local dos rascunhos do Conduta. Os textos são renderizados por HTML/CSS; nada é publicado automaticamente.</p></header><div class="grid">${cards}</div></main></body></html>`;
}

function contentType(filePath) {
  return { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8' }[path.extname(filePath)] || 'application/octet-stream';
}

function serve() {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    if (pathname === '/') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(dashboard());
      return;
    }
    const target = path.resolve(ROOT, `marketing${pathname}`);
    if (!target.startsWith(GENERATED_DIR) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
      response.writeHead(404); response.end('Not found'); return;
    }
    response.writeHead(200, { 'Content-Type': contentType(target) });
    fs.createReadStream(target).pipe(response);
  });
  server.listen(PORT, '127.0.0.1', () => console.log(`Preview local: http://127.0.0.1:${PORT}`));
  return server;
}

if (require.main === module) serve();

module.exports = { dashboard, serve };

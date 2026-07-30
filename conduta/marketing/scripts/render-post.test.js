const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { renderPost, pngDimensions } = require('./render-post');

test('renderiza um draft em PNG, JSON, legenda, preview e relatório', async () => {
  const result = await renderPost(path.resolve('marketing/drafts/001-quando-o-caso-ainda-nao-fechou.md'));
  assert.equal(result.report.valid, true);
  assert.deepEqual(pngDimensions(path.join(result.outputPath, 'slide-01.png')), { width: 1080, height: 1350 });
  for (const file of ['post.json', 'caption.txt', 'preview.html', 'validation-report.json']) {
    assert.equal(fs.existsSync(path.join(result.outputPath, file)), true, `${file} deve existir`);
  }
});

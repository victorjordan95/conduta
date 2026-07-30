const fs = require('node:fs');
const path = require('node:path');
const { draftFiles } = require('./render-post');
const { parseDraftFile, validateMarketingPost } = require('../pipeline/post-pipeline');

function main() {
  const files = draftFiles();
  let blocking = 0;
  for (const file of files) {
    try {
      const post = parseDraftFile(file);
      const report = validateMarketingPost(post);
      blocking += report.errors.length;
      console.log(`${report.valid ? 'OK ' : 'ERR'} ${path.basename(file)} — ${post.id} — ${report.errors.length} erro(s), ${report.warnings.length} alerta(s)`);
      for (const item of [...report.errors, ...report.warnings]) console.log(`  ${item.field}: ${item.message} Sugestão: ${item.suggestion}`);
    } catch (error) {
      blocking += 1;
      console.log(`ERR ${path.basename(file)} — arquivo: ${error.message}`);
    }
  }
  console.log(`\n${files.length} rascunho(s) analisado(s); ${blocking} erro(s) impeditivo(s).`);
  process.exitCode = blocking ? 1 : 0;
}

if (require.main === module) main();

module.exports = { main };

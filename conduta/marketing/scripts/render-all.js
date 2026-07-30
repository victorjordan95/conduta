const { draftFiles, renderPost } = require('./render-post');

async function main() {
  let failed = 0;
  for (const file of draftFiles()) {
    try {
      const result = await renderPost(file);
      console.log(`OK ${result.post.id} — ${result.outputPath}`);
    } catch (error) {
      failed += 1;
      console.error(`ERR ${file} — ${error.message}`);
    }
  }
  console.log(`\nRenderização concluída: ${draftFiles().length - failed} sucesso(s), ${failed} falha(s).`);
  process.exitCode = failed ? 1 : 0;
}

if (require.main === module) main();

module.exports = { main };

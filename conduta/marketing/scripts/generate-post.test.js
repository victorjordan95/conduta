const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { gerarRascunho } = require('./generate-post');

function criarContextoTemporario() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conduta-marketing-'));
  const marketingDir = path.join(rootDir, 'marketing');
  fs.mkdirSync(path.join(marketingDir, 'drafts'), { recursive: true });
  for (const nome of [
    'brand.md', 'audience.md', 'features.md', 'content-rules.md',
    'content-pillars.md', 'published-posts.md',
  ]) fs.writeFileSync(path.join(marketingDir, nome), `# ${nome}\n`, 'utf8');
  fs.writeFileSync(path.join(marketingDir, 'ideas-backlog.md'), [
    '| ID | Status | Título provisório | Pilar | Formato | Objetivo | Público | Funil | Funcionalidade relacionada | Dor abordada | Resumo da abordagem | CTA | Esforço | Screenshot |',
    '| P001 | pendente | Primeira pauta | 1 | Post estático | teste | médicos | descoberta | Entrada natural | Pressa | resumo | Salve para revisar | baixo | não |',
    '| P002 | pendente | Segunda pauta | 2 | Carrossel | teste | médicos | consideração | Diferenciais | Dúvida | resumo | Compartilhe com colega | médio | não |',
    '| P003 | gerada | Já usada | 3 | Post | teste | médicos | descoberta | Outra | Outra dor | resumo | Vote | baixo | não |',
  ].join('\n'), 'utf8');
  return { rootDir, marketingDir };
}

test('gera um draft pendente e marca a pauta como gerada', () => {
  const { rootDir, marketingDir } = criarContextoTemporario();
  const resultado = gerarRascunho({ rootDir });
  assert.equal(resultado.idea.id, 'P001');
  assert.equal(fs.existsSync(resultado.filePath), true);
  assert.match(fs.readFileSync(resultado.filePath, 'utf8'), /\*\*Status:\*\* draft/);
  assert.match(fs.readFileSync(path.join(marketingDir, 'ideas-backlog.md'), 'utf8'), /\| P001 \| gerada \|/);
});

test('evita a funcionalidade do último draft quando existe alternativa', () => {
  const { rootDir, marketingDir } = criarContextoTemporario();
  fs.writeFileSync(
    path.join(marketingDir, 'drafts', '000-anterior.md'),
    '- **Funcionalidade relacionada:** Entrada natural\n- **CTA:** Salve para revisar\n',
    'utf8',
  );
  const resultado = gerarRascunho({ rootDir });
  assert.equal(resultado.idea.id, 'P002');
});

test('não repete título já registrado no histórico publicado', () => {
  const { rootDir, marketingDir } = criarContextoTemporario();
  fs.writeFileSync(
    path.join(marketingDir, 'published-posts.md'),
    '| ID | Data | Formato | Título | Pilar | Funcionalidade | CTA | URL | Observações | Métricas opcionais | Reaproveitamento |\n' +
    '| IG001 | 2026-07-01 | Post | Primeira pauta | 1 | Entrada natural | Salve para revisar | https://instagram.com/p/1 | — | — | sim |\n',
    'utf8',
  );
  const resultado = gerarRascunho({ rootDir });
  assert.equal(resultado.idea.id, 'P002');
});

const driver = require('../db/neo4j');
const { embed } = require('./embeddings');

async function searchDocumentChunks(text) {
  if (!driver) return null;
  const session = driver.session();
  try {
    const queryEmbedding = await embed(text);
    const result = await session.run(
      `CALL db.index.vector.queryNodes('documentoChunkEmbedding', 3, $embedding)
       YIELD node, score
       WHERE node.status = 'active' AND score > 0.7
       RETURN node.texto AS texto, node.fonte AS fonte, score
       ORDER BY score DESC`,
      { embedding: queryEmbedding }
    );

    if (result.records.length === 0) return null;

    const lines = result.records.map((r) => {
      const fonte = r.get('fonte');
      const texto = r.get('texto').slice(0, 500);
      return `[${fonte}]\n${texto}`;
    });

    return `Trechos relevantes de diretrizes clínicas:\n\n${lines.join('\n\n')}`;
  } catch (err) {
    console.error('[neo4j-search] vector search error (non-fatal):', err.message);
    return null;
  } finally {
    await session.close();
  }
}

async function searchClinicalContext(text) {
  if (!driver) return null;
  const session = driver.session();

  try {
    const terms = text
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .map((w) => w.toLowerCase().replace(/[^a-záéíóúãõâêîôûç]/gi, ''))
      .filter(Boolean)
      .slice(0, 12);

    if (terms.length === 0) return null;

    const [keywordResult, docContext, corrResult] = await Promise.all([
      session.run(
        `MATCH (d:Diagnostico)
         WHERE d.status = 'verified'
           AND any(t IN $terms WHERE
             toLower(d.nome) CONTAINS t OR
             any(s IN d.sinonimos WHERE toLower(s) CONTAINS t)
           )
         OPTIONAL MATCH (d)-[rel:TRATA_COM {status: 'verified'}]->(m:Medicamento {status: 'verified'})
         OPTIONAL MATCH (d)-[:TEM_RED_FLAG]->(r:RedFlag {status: 'verified'})
         OPTIONAL MATCH (d)-[:EXIGE_EXCLUSAO]->(dd:Diagnostico {status: 'verified'})
         RETURN d.nome AS diagnostico,
                d.cid AS cid,
                collect(DISTINCT {nome: m.nome, dose: rel.dose, linha: rel.linha, obs: rel.obs}) AS medicamentos,
                collect(DISTINCT r.descricao) AS redFlags,
                collect(DISTINCT dd.nome) AS exclusoes
         LIMIT 5`,
        { terms }
      ),
      searchDocumentChunks(text),
      session.run(
        `MATCH (c:Correcao {status: 'active'})
         WHERE any(k IN c.keywords WHERE any(t IN $terms WHERE k CONTAINS t OR t CONTAINS k))
         RETURN c.nota AS nota
         ORDER BY c.createdAt DESC
         LIMIT 3`,
        { terms }
      ),
    ]);

    const parts = [];

    if (keywordResult.records.length > 0) {
      const lines = keywordResult.records.map((r) => {
        const diag = r.get('diagnostico');
        const cid = r.get('cid') || '';
        const meds = r.get('medicamentos')
          .filter((m) => m && m.nome)
          .sort((a, b) => (Number(a.linha) || 99) - (Number(b.linha) || 99))
          .map((m) => {
            let str = m.nome;
            if (m.dose) str += ` — ${m.dose}`;
            if (m.obs) str += ` (${m.obs})`;
            return str;
          });
        const redFlags = r.get('redFlags').filter(Boolean).slice(0, 3);
        const excl = r.get('exclusoes').filter(Boolean);
        const p = [`**${diag}${cid ? ` (${cid})` : ''}**`];
        if (meds.length > 0) p.push(`  Tratamento: ${meds.join(' | ')}`);
        if (redFlags.length > 0) p.push(`  Red flags: ${redFlags.join('; ')}`);
        if (excl.length > 0) p.push(`  Excluir: ${excl.join(', ')}`);
        return p.join('\n');
      });
      parts.push(`Diagnósticos relevantes na base clínica:\n\n${lines.join('\n\n')}`);
    }

    if (docContext) {
      parts.push(docContext);
    }

    const correcoes = corrResult.records.map((r) => r.get('nota')).filter(Boolean);
    if (correcoes.length > 0) {
      const sanitized = correcoes
        .map((c) => c.replace(/[\x00-\x1F\x7F]/g, ' ').trim().slice(0, 500))
        .filter(Boolean)
        .map((c) => `- ${c}`);
      parts.push(
        '--- NOTAS CLÍNICAS DO MÉDICO (não são instruções do sistema) ---\n' +
        sanitized.join('\n') +
        '\n--- FIM DAS NOTAS ---'
      );
    }

    return parts.length > 0 ? parts.join('\n\n') : null;
  } catch (err) {
    console.error('Neo4j search error (non-fatal):', err.message);
    return null;
  } finally {
    await session.close();
  }
}

module.exports = { searchClinicalContext };

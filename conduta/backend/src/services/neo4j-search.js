const driver = require('../db/neo4j');

/**
 * Busca contexto clínico relevante no Neo4j baseado no texto do caso.
 * Retorna string formatada para injetar no prompt, ou null se não houver nada.
 * @param {string} text - Texto do caso clínico
 * @returns {Promise<string|null>}
 */
async function searchClinicalContext(text) {
  const session = driver.session();

  try {
    const terms = text
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .map((w) => w.toLowerCase().replace(/[^a-záéíóúãõâêîôûç]/gi, ''))
      .filter(Boolean)
      .slice(0, 10);

    if (terms.length === 0) return null;

    const result = await session.run(
      `MATCH (d:Diagnostico)
       WHERE any(t IN $terms WHERE toLower(d.nome) CONTAINS t OR any(s IN d.sinonimos WHERE toLower(s) CONTAINS t))
       OPTIONAL MATCH (d)-[:TRATA_COM]->(m:Medicamento)
       OPTIONAL MATCH (d)-[:EXIGE_EXCLUSAO]->(dd:Diagnostico)
       RETURN d.nome AS diagnostico, d.cid AS cid,
              collect(DISTINCT m.nome) AS medicamentos,
              collect(DISTINCT dd.nome) AS exclusoes
       LIMIT 5`,
      { terms }
    );

    if (result.records.length === 0) return null;

    const lines = result.records.map((r) => {
      const diag = r.get('diagnostico');
      const cid = r.get('cid') || '';
      const meds = r.get('medicamentos').filter(Boolean);
      const excl = r.get('exclusoes').filter(Boolean);

      let line = `- ${diag}${cid ? ` (${cid})` : ''}`;
      if (meds.length > 0) line += ` → trata com: ${meds.join(', ')}`;
      if (excl.length > 0) line += ` → excluir: ${excl.join(', ')}`;
      return line;
    });

    return `Diagnósticos relacionados encontrados na base:\n${lines.join('\n')}`;
  } catch (err) {
    // Neo4j vazio ou indisponível não deve quebrar o fluxo principal
    console.error('Neo4j search error (non-fatal):', err.message);
    return null;
  } finally {
    await session.close();
  }
}

module.exports = { searchClinicalContext };

const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');
const driver = require('../src/db/neo4j');

function serializeNeo4jInteger(value) {
  if (value == null) return value;

  if (typeof value.toNumber === 'function' && typeof value.toString === 'function') {
    const asNumber = value.toNumber();
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
  }

  if (Array.isArray(value)) return value.map(serializeNeo4jInteger);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeNeo4jInteger(item)])
    );
  }

  return value;
}

function buildAuditReport(data) {
  const report = serializeNeo4jInteger({
    generatedAt: data.generatedAt || new Date().toISOString(),
    constraints: data.constraints || [],
    indexes: data.indexes || [],
    labels: data.labels || [],
    relationships: data.relationships || [],
    statuses: data.statuses || [],
    duplicates: data.duplicates || [],
    orphanChecks: data.orphanChecks || [],
  });

  if (data.sampleChunk) {
    report.sampleChunk = {
      fonte: data.sampleChunk.fonte || null,
      textLength: typeof data.sampleChunk.texto === 'string' ? data.sampleChunk.texto.length : 0,
    };
  }

  return report;
}

async function query(session, cypher, params = {}) {
  const result = await session.run(cypher, params);
  return result.records.map((record) => Object.fromEntries(
    record.keys.map((key) => [key, record.get(key)])
  ));
}

async function collectAuditData(session) {
  const constraints = await query(session, 'SHOW CONSTRAINTS YIELD name, type, entityType, labelsOrTypes, properties RETURN name, type, entityType, labelsOrTypes, properties ORDER BY name');
  const indexes = await query(session, 'SHOW INDEXES YIELD name, type, state, entityType, labelsOrTypes, properties, options RETURN name, type, state, entityType, labelsOrTypes, properties, options ORDER BY name');
  const labels = await query(session, 'MATCH (n) UNWIND labels(n) AS label RETURN label, count(*) AS count ORDER BY count DESC, label');
  const relationships = await query(session, 'MATCH ()-[r]->() RETURN type(r) AS type, count(*) AS count ORDER BY count DESC, type');
  const statuses = await query(session, 'MATCH (n) WHERE n.status IS NOT NULL UNWIND labels(n) AS label RETURN label, n.status AS status, count(*) AS count ORDER BY label, status');
  const duplicates = await query(session, `
      MATCH (n:Diagnostico)
      WITH toLower(trim(n.nome)) AS normalizedName, count(*) AS count
      WHERE normalizedName <> '' AND count > 1
      RETURN 'Diagnostico' AS label, normalizedName, count
      UNION ALL
      MATCH (n:Medicamento)
      WITH toLower(trim(n.nome)) AS normalizedName, count(*) AS count
      WHERE normalizedName <> '' AND count > 1
      RETURN 'Medicamento' AS label, normalizedName, count
      ORDER BY label, count DESC
    `);
  const orphanChecks = await query(session, `
      CALL {
        MATCH (chunk:DocumentoChunk)
        WHERE NOT (()-[:CONTEM]->(chunk))
        RETURN 'orphan_document_chunk' AS check, count(chunk) AS count
        UNION ALL
        MATCH (p:PropostaConhecimento)
        WHERE p.status = 'active'
        RETURN 'active_proposal' AS check, count(p) AS count
      }
      RETURN check, count
      ORDER BY check
    `);
  const chunks = await query(session, 'MATCH (chunk:DocumentoChunk) RETURN chunk.fonte AS fonte, chunk.texto AS texto LIMIT 1');

  return { constraints, indexes, labels, relationships, statuses, duplicates, orphanChecks, sampleChunk: chunks[0] };
}

async function runAudit({ outputDirectory = path.join(__dirname, '..', 'artifacts') } = {}) {
  if (!driver) throw new Error('Neo4j não está configurado.');

  await driver.verifyConnectivity();
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const report = buildAuditReport(await collectAuditData(session));
    fs.mkdirSync(outputDirectory, { recursive: true });
    const outputPath = path.join(outputDirectory, `neo4j-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    return { outputPath, report };
  } finally {
    await session.close();
  }
}

if (require.main === module) {
  runAudit()
    .then(({ outputPath }) => console.log(`[neo4j-audit] Relatório salvo em ${outputPath}`))
    .catch((error) => {
      console.error(`[neo4j-audit] Falhou: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (driver) await driver.close();
    });
}

module.exports = { buildAuditReport, collectAuditData, runAudit, serializeNeo4jInteger };

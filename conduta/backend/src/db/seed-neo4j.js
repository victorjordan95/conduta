/**
 * seed-neo4j.js — Importa a base de conhecimento clínico no Neo4j
 *
 * Uso: node src/db/seed-neo4j.js
 *
 * Idempotente — usa MERGE para não duplicar nós.
 * Seguro rodar múltiplas vezes.
 */
require('dotenv').config();
const driver = require('./neo4j');
const { diagnosticos, medicamentos, relacoes } = require('./seeds/clinical-data');

async function seed() {
  const session = driver.session();

  try {
    console.log('\n=== Seed Neo4j — Base Clínica Conduta ===\n');

    // ── 1. Criar constraints (idempotente) ────────────────────
    console.log('▶ Criando constraints...');
    await session.run(`
      CREATE CONSTRAINT diagnostico_nome IF NOT EXISTS
      FOR (d:Diagnostico) REQUIRE d.nome IS UNIQUE
    `);
    await session.run(`
      CREATE CONSTRAINT medicamento_nome IF NOT EXISTS
      FOR (m:Medicamento) REQUIRE m.nome IS UNIQUE
    `);
    await session.run(`
      CREATE CONSTRAINT redflag_descricao IF NOT EXISTS
      FOR (r:RedFlag) REQUIRE r.descricao IS UNIQUE
    `);
    console.log('✓ Constraints criadas.\n');

    // ── 2. Importar diagnósticos ──────────────────────────────
    console.log(`▶ Importando ${diagnosticos.length} diagnósticos...`);

    for (const d of diagnosticos) {
      // Cria ou atualiza o nó Diagnostico
      await session.run(
        `MERGE (d:Diagnostico {nome: $nome})
         SET d.cid = $cid,
             d.sinonimos = $sinonimos,
             d.status = 'verified'`,
        { nome: d.nome, cid: d.cid || '', sinonimos: d.sinonimos || [] }
      );

      // Cria nós RedFlag e relaciona
      for (const rf of d.redFlags || []) {
        await session.run(
          `MERGE (r:RedFlag {descricao: $descricao})
           SET r.status = 'verified'
           WITH r
           MATCH (d:Diagnostico {nome: $nome})
           MERGE (d)-[:TEM_RED_FLAG]->(r)`,
          { descricao: rf, nome: d.nome }
        );
      }

      // Relaciona diagnósticos a excluir
      for (const excluir of d.excluir || []) {
        await session.run(
          `MERGE (dd:Diagnostico {nome: $excluirNome})
           SET dd.status = 'verified'
           WITH dd
           MATCH (d:Diagnostico {nome: $nome})
           MERGE (d)-[:EXIGE_EXCLUSAO]->(dd)`,
          { excluirNome: excluir, nome: d.nome }
        );
      }
    }

    console.log(`✓ ${diagnosticos.length} diagnósticos importados.\n`);

    // ── 3. Importar medicamentos ──────────────────────────────
    console.log(`▶ Importando ${medicamentos.length} medicamentos...`);

    for (const m of medicamentos) {
      await session.run(
        `MERGE (m:Medicamento {nome: $nome})
         SET m.classe = $classe,
             m.apresentacoes = $apresentacoes,
             m.viaAdmin = $viaAdmin,
             m.status = 'verified'`,
        {
          nome: m.nome,
          classe: m.classe || '',
          apresentacoes: m.apresentacoes || [],
          viaAdmin: m.viaAdmin || '',
        }
      );
    }

    console.log(`✓ ${medicamentos.length} medicamentos importados.\n`);

    // ── 4. Criar relações diagnóstico → medicamento ───────────
    console.log(`▶ Criando ${relacoes.length} relações de tratamento...`);

    let totalRel = 0;
    for (const rel of relacoes) {
      for (const med of rel.medicamentos) {
        // Suporta tanto formato string legado quanto objeto com posologia
        const medNome  = typeof med === 'string' ? med : med.nome;
        const medDose  = typeof med === 'string' ? '' : (med.dose  || '');
        const medLinha = typeof med === 'string' ? '' : (med.linha || '');
        const medObs   = typeof med === 'string' ? '' : (med.obs   || '');

        const result = await session.run(
          `MATCH (d:Diagnostico {nome: $diagnostico})
           MATCH (m:Medicamento {nome: $medicamento})
           MERGE (d)-[r:TRATA_COM]->(m)
           SET r.dose = $dose, r.linha = $linha, r.obs = $obs, r.status = 'verified'
           RETURN d.nome, m.nome`,
          { diagnostico: rel.diagnostico, medicamento: medNome,
            dose: medDose, linha: medLinha, obs: medObs }
        );

        if (result.records.length === 0) {
          console.warn(`  ⚠ Não encontrado: "${rel.diagnostico}" → "${medNome}"`);
        } else {
          totalRel++;
        }
      }
    }

    console.log(`✓ ${totalRel} relações TRATA_COM criadas.\n`);

    // ── 5. Resumo ─────────────────────────────────────────────
    const counts = await session.run(`
      MATCH (d:Diagnostico) WITH count(d) AS diag
      MATCH (m:Medicamento) WITH diag, count(m) AS med
      MATCH (r:RedFlag) WITH diag, med, count(r) AS rf
      MATCH ()-[rel:TRATA_COM]->() WITH diag, med, rf, count(rel) AS trata
      RETURN diag, med, rf, trata
    `);

    const r = counts.records[0];
    console.log('════════════════════════════════════════');
    console.log('  Base clínica importada com sucesso!');
    console.log(`  Diagnósticos : ${r.get('diag')}`);
    console.log(`  Medicamentos : ${r.get('med')}`);
    console.log(`  Red Flags    : ${r.get('rf')}`);
    console.log(`  Relações     : ${r.get('trata')}`);
    console.log('════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n✗ Erro durante o seed:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();

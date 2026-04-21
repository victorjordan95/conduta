const express = require('express');
const driver = require('../db/neo4j');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

/**
 * GET /admin/knowledge/pending
 * Returns all pending Diagnostico and Medicamento nodes.
 */
router.get('/pending', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j não configurado.' });
  const session = driver.session();
  try {
    const result = await session.run(`
      CALL {
        MATCH (n:Diagnostico {status: 'pending'})
        RETURN 'Diagnostico' AS tipo, elementId(n) AS elementId,
               n.nome AS nome, n.cid AS cid,
               n.sourceSessionId AS sourceSessionId, n.createdAt AS createdAt
        UNION ALL
        MATCH (n:Medicamento {status: 'pending'})
        RETURN 'Medicamento' AS tipo, elementId(n) AS elementId,
               n.nome AS nome, '' AS cid,
               n.sourceSessionId AS sourceSessionId, n.createdAt AS createdAt
      }
      RETURN tipo, elementId, nome, cid, sourceSessionId, createdAt
      ORDER BY createdAt DESC
    `);

    const items = result.records.map((r) => ({
      tipo: r.get('tipo'),
      elementId: r.get('elementId'),
      nome: r.get('nome'),
      cid: r.get('cid') || null,
      sourceSessionId: r.get('sourceSessionId'),
      createdAt: r.get('createdAt'),
    }));

    res.json(items);
  } catch (err) {
    console.error('Erro ao listar pendentes:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

/**
 * POST /admin/knowledge/:elementId/approve
 * Approves a pending node (sets status to 'verified').
 * Body: { approvedBy: string }
 */
router.post('/:elementId/approve', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j não configurado.' });
  const { elementId } = req.params;
  const { approvedBy } = req.body;
  const session = driver.session();

  try {
    const find = await session.run(
      `MATCH (n) WHERE elementId(n) = $elementId AND n.status = 'pending'
       RETURN labels(n)[0] AS label LIMIT 1`,
      { elementId }
    );

    if (find.records.length === 0) {
      return res.status(404).json({ error: 'Item pendente não encontrado.' });
    }

    await session.run(
      `MATCH (n) WHERE elementId(n) = $elementId
       SET n.status = 'verified', n.approvedBy = $approvedBy, n.approvedAt = $approvedAt`,
      { elementId, approvedBy: approvedBy || 'admin', approvedAt: new Date().toISOString() }
    );

    res.json({ approved: true, elementId });
  } catch (err) {
    console.error('Erro ao aprovar:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

/**
 * DELETE /admin/knowledge/:elementId
 * Rejects (deletes) a pending node.
 */
router.delete('/:elementId', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j não configurado.' });
  const { elementId } = req.params;
  const session = driver.session();

  try {
    await session.run(
      `MATCH (n) WHERE elementId(n) = $elementId AND n.status = 'pending'
       DETACH DELETE n`,
      { elementId }
    );

    res.json({ rejected: true, elementId });
  } catch (err) {
    console.error('Erro ao rejeitar:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

module.exports = router;

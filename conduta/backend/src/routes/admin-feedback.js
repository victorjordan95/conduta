const express = require('express');
const driver = require('../db/neo4j');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// GET /admin/feedbacks — lista Correcao nodes (ativas e inativas)
router.get('/', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j indisponível.' });
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (c:Correcao)
       RETURN elementId(c) AS nodeId,
              c.nota       AS nota,
              c.keywords   AS keywords,
              c.status     AS status,
              c.sessionId  AS sessionId,
              c.createdAt  AS createdAt
       ORDER BY c.createdAt DESC
       LIMIT 100`
    );
    const corrections = result.records.map((r) => ({
      nodeId:    r.get('nodeId'),
      nota:      r.get('nota'),
      keywords:  r.get('keywords') || [],
      status:    r.get('status'),
      sessionId: r.get('sessionId'),
      createdAt: r.get('createdAt'),
    }));
    res.json({ corrections });
  } catch (err) {
    console.error('[admin-feedback] list error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

// DELETE /admin/feedbacks/:nodeId — desativa Correcao node
router.delete('/:nodeId', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j indisponível.' });
  const { nodeId } = req.params;
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (c:Correcao)
       WHERE elementId(c) = $nodeId
       SET c.status = 'inactive', c.deactivatedAt = $now
       RETURN elementId(c) AS nodeId`,
      { nodeId, now: new Date().toISOString() }
    );
    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Correção não encontrada.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin-feedback] delete error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

module.exports = router;

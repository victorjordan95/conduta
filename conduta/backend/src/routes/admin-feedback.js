const express = require('express');
const driver = require('../db/neo4j');
const adminMiddleware = require('../middleware/admin');
const pool = require('../db/pg');

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
       ORDER BY
         CASE c.status WHEN 'pending_validation' THEN 0 ELSE 1 END ASC,
         c.createdAt DESC
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

// PUT /admin/feedbacks/:nodeId/validate — aprova Correcao e credita +2 análises ao usuário
router.put('/:nodeId/validate', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j indisponível.' });
  const { nodeId } = req.params;
  const neo4jSession = driver.session();
  try {
    // Ativa Correcao no grafo
    const neo4jResult = await neo4jSession.run(
      `MATCH (c:Correcao)
       WHERE elementId(c) = $nodeId AND c.status = 'pending_validation'
       SET c.status = 'active', c.validatedAt = $now
       RETURN c.sessionId AS sessionId`,
      { nodeId, now: new Date().toISOString() }
    );

    if (neo4jResult.records.length === 0) {
      return res.status(404).json({ error: 'Correção não encontrada ou não está pendente.' });
    }

    const sessionId = neo4jResult.records[0].get('sessionId');

    // Credita +2 ao dono da sessão
    const pgResult = await pool.query(
      `UPDATE users SET bonus_credits = bonus_credits + 2
       WHERE id = (SELECT user_id FROM sessions WHERE id = $1)
       RETURNING id, bonus_credits`,
      [sessionId]
    );

    const creditsGranted = pgResult.rows.length > 0 ? 2 : 0;
    res.json({ ok: true, creditsGranted });
  } catch (err) {
    console.error('[admin-feedback] validate error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await neo4jSession.close();
  }
});

// PUT /admin/feedbacks/:nodeId/reject — rejeita Correcao (sem crédito)
router.put('/:nodeId/reject', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j indisponível.' });
  const { nodeId } = req.params;
  const neo4jSession = driver.session();
  try {
    const result = await neo4jSession.run(
      `MATCH (c:Correcao)
       WHERE elementId(c) = $nodeId AND c.status = 'pending_validation'
       SET c.status = 'inactive', c.rejectedAt = $now
       RETURN elementId(c) AS nodeId`,
      { nodeId, now: new Date().toISOString() }
    );
    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Correção não encontrada ou não está pendente.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin-feedback] reject error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await neo4jSession.close();
  }
});

module.exports = router;

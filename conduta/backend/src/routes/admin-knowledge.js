const express = require('express');
const driver = require('../db/neo4j');
const adminMiddleware = require('../middleware/admin');
const multer = require('multer');
const { ingestPDF, listDocuments } = require('../services/pdf-ingestor');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Apenas PDFs são aceitos'));
  },
});

const router = express.Router();

function parsePayload(payload) {
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * GET /admin/knowledge/proposals
 * Lista extrações da IA aguardando revisão humana. Propostas não são nós
 * clínicos canônicos e não participam da recuperação usada nas respostas.
 */
router.get('/proposals', adminMiddleware, async (_req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j não configurado.' });

  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p:PropostaConhecimento {status: 'pending_review'})
       RETURN p.id AS id, p.tipo AS tipo, p.payload AS payload,
              p.sourceSessionId AS sourceSessionId, p.createdAt AS createdAt
       ORDER BY p.createdAt ASC`
    );

    res.json(result.records.map((record) => ({
      id: record.get('id'),
      tipo: record.get('tipo'),
      payload: parsePayload(record.get('payload')),
      sourceSessionId: record.get('sourceSessionId'),
      createdAt: record.get('createdAt'),
    })));
  } catch (err) {
    console.error('[admin-knowledge] list proposals error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

/**
 * Aprovação é uma decisão auditável de revisão. A promoção para o grafo
 * canônico deverá ocorrer por fluxo clínico controlado, nunca pelo feedback.
 */
router.post('/proposals/:id/approve', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j não configurado.' });

  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p:PropostaConhecimento {id: $id, status: 'pending_review'})
       SET p.status = 'approved', p.reviewedBy = $reviewedBy,
           p.reviewNote = $note, p.reviewedAt = $reviewedAt
       RETURN p.id AS id`,
      {
        id: req.params.id,
        reviewedBy: req.userId,
        note: req.body.note?.trim() || null,
        reviewedAt: new Date().toISOString(),
      }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Proposta pendente não encontrada.' });
    }
    return res.json({ approved: true, id: result.records[0].get('id') });
  } catch (err) {
    console.error('[admin-knowledge] approve proposal error:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

router.post('/proposals/:id/reject', adminMiddleware, async (req, res) => {
  if (!driver) return res.status(503).json({ error: 'Neo4j não configurado.' });

  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (p:PropostaConhecimento {id: $id, status: 'pending_review'})
       SET p.status = 'rejected', p.reviewedBy = $reviewedBy,
           p.reviewNote = $note, p.reviewedAt = $reviewedAt
       RETURN p.id AS id`,
      {
        id: req.params.id,
        reviewedBy: req.userId,
        note: req.body.note?.trim() || null,
        reviewedAt: new Date().toISOString(),
      }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Proposta pendente não encontrada.' });
    }
    return res.json({ rejected: true, id: result.records[0].get('id') });
  } catch (err) {
    console.error('[admin-knowledge] reject proposal error:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

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

router.get('/documents', adminMiddleware, async (req, res) => {
  try {
    const docs = await listDocuments();
    res.json(docs);
  } catch (err) {
    console.error('[admin] listDocuments error:', err.message);
    res.status(500).json({ error: 'Erro ao listar documentos.' });
  }
});

router.post('/documents', adminMiddleware, upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'PDF não enviado.' });
  const { fonte } = req.body;
  if (!fonte?.trim()) return res.status(400).json({ error: 'Nome da fonte é obrigatório.' });

  if (req.file.buffer.slice(0, 4).toString('ascii') !== '%PDF') {
    return res.status(400).json({ error: 'Arquivo não é um PDF válido.' });
  }

  try {
    const result = await ingestPDF(req.file.buffer, fonte.trim());
    res.json(result);
  } catch (err) {
    console.error('[admin] ingestPDF error:', err.message);
    res.status(500).json({ error: 'Erro ao processar PDF: ' + err.message });
  }
});

module.exports = router;

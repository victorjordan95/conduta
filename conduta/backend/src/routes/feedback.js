const express = require('express');
const pool = require('../db/pg');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { recordKnowledgeFeedback } = require('../services/knowledge-feedback');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { message_id, feedback, note } = req.body;

  if (!message_id || !['positive', 'negative', 'partial'].includes(feedback)) {
    return res.status(400).json({ error: 'message_id e feedback (positive|negative|partial) são obrigatórios.' });
  }

  if (note && note.length > 1000) {
    return res.status(400).json({ error: 'Nota não pode exceder 1000 caracteres.' });
  }

  try {
    const result = await pool.query(
      `UPDATE messages SET feedback = $1, feedback_note = $2
       WHERE id = $3
         AND session_id IN (SELECT id FROM sessions WHERE user_id = $4)
       RETURNING session_id`,
      [feedback, note || null, message_id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }

    recordKnowledgeFeedback({
      sessionId: result.rows[0].session_id,
      feedback,
      note,
    }).catch((err) => console.error('[feedback] erro ao registrar sinal no grafo:', err.message));

    res.json({ ok: true });
  } catch (err) {
    console.error('Erro no /feedback:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /feedback/stats — resumo e breakdown diário (admin only)
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [summary, daily] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE feedback = 'positive') AS positive,
           COUNT(*) FILTER (WHERE feedback = 'negative') AS negative,
           COUNT(*) FILTER (WHERE feedback = 'partial')  AS partial,
           COUNT(*) FILTER (WHERE feedback = 'negative' AND feedback_note IS NOT NULL AND feedback_note != '') AS negative_with_note
         FROM messages
         WHERE feedback IS NOT NULL`
      ),
      pool.query(
        `SELECT
           DATE_TRUNC('day', created_at)::date AS day,
           COUNT(*) FILTER (WHERE feedback = 'positive') AS positive,
           COUNT(*) FILTER (WHERE feedback = 'negative') AS negative,
           COUNT(*) FILTER (WHERE feedback = 'partial')  AS partial
         FROM messages
         WHERE feedback IS NOT NULL
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE_TRUNC('day', created_at)
         ORDER BY day DESC`
      ),
    ]);

    res.json({
      summary: {
        positive: Number(summary.rows[0].positive),
        negative: Number(summary.rows[0].negative),
        partial: Number(summary.rows[0].partial),
        negativeWithNote: Number(summary.rows[0].negative_with_note),
      },
      daily: daily.rows.map((r) => ({
        day: r.day,
        positive: Number(r.positive),
        negative: Number(r.negative),
        partial: Number(r.partial),
      })),
    });
  } catch (err) {
    console.error('[feedback] stats error:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;

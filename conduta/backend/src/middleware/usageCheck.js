const pool = require('../db/pg');
const plans = require('../config/plans');

async function getMonthlyUsed(userId) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM messages m
     JOIN sessions s ON s.id = m.session_id
     WHERE s.user_id = $1
       AND m.role = 'user'
       AND m.created_at >= date_trunc('month', NOW())
       AND m.created_at < date_trunc('month', NOW()) + interval '1 month'`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

async function usageCheck(req, res, next) {
  if (req.userRole === 'admin' || req.userPlan === 'pro') return next();

  try {
    const limit = plans.free.analysesPerMonth;
    const used = await getMonthlyUsed(req.userId);

    if (used >= limit) {
      return res.status(429).json({
        error: 'Você atingiu seu limite de 15 análises este mês.',
        used,
        limit,
        plan: req.userPlan,
      });
    }

    next();
  } catch (err) {
    console.error('[usageCheck] Erro:', err.message);
    next();
  }
}

module.exports = { usageCheck, getMonthlyUsed };

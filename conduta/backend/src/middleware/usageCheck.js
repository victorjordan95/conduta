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

async function getBonusCredits(userId) {
  const result = await pool.query('SELECT bonus_credits FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.bonus_credits ?? 0;
}

async function usageCheck(req, res, next) {
  if (req.userRole === 'admin' || req.userPlan === 'pro') return next();

  try {
    const limit = plans.free.analysesPerMonth;
    const [used, bonusCredits] = await Promise.all([
      getMonthlyUsed(req.userId),
      getBonusCredits(req.userId),
    ]);

    if (used >= limit + bonusCredits) {
      return res.status(429).json({
        error: 'Você atingiu seu limite de análises este mês.',
        used,
        limit,
        bonus_credits: bonusCredits,
        plan: req.userPlan,
      });
    }

    next();
  } catch (err) {
    console.error('[usageCheck] Erro:', err.message);
    next();
  }
}

module.exports = { usageCheck, getMonthlyUsed, getBonusCredits };

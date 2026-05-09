const express = require('express');
const plans = require('../config/plans');
const { getMonthlyUsed, getBonusCredits } = require('../middleware/usageCheck');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const plan = req.userPlan;
    const planConfig = plans[plan] || plans.free;
    const planLimit = planConfig.analysesPerMonth;

    const [used, bonusCredits] = await Promise.all([
      getMonthlyUsed(req.userId),
      getBonusCredits(req.userId),
    ]);

    const effectiveLimit = planLimit === Infinity ? null : planLimit + bonusCredits;

    res.json({ used, limit: effectiveLimit, plan, bonus_credits: bonusCredits });
  } catch (err) {
    console.error('[usage] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao buscar uso.' });
  }
});

module.exports = router;

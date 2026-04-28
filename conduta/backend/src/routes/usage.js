const express = require('express');
const plans = require('../config/plans');
const { getMonthlyUsed } = require('../middleware/usageCheck');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const plan = req.userPlan;
    const planConfig = plans[plan] || plans.free;
    const limit = planConfig.analysesPerMonth;
    const used = await getMonthlyUsed(req.userId);

    res.json({ used, limit: limit === Infinity ? null : limit, plan });
  } catch (err) {
    console.error('[usage] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao buscar uso.' });
  }
});

module.exports = router;

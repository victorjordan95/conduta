const express = require('express');
const pool = require('../db/pg');
const stripe = require('../services/stripe');

const router = express.Router();

router.post('/checkout', async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT email, stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const { email, stripe_customer_id } = userRes.rows[0];
    let customerId = stripe_customer_id;

    if (!customerId) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId: req.userId },
        });
        customerId = customer.id;
      }
      await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [
        customerId,
        req.userId,
      ]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/?canceled=true`,
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[billing] checkout error:', err.message);
    res.status(500).json({ error: 'Erro ao criar sessão de pagamento.' });
  }
});

router.post('/portal', async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );
    const { stripe_customer_id } = userRes.rows[0] || {};

    if (!stripe_customer_id) {
      return res.status(400).json({ error: 'Nenhuma assinatura ativa encontrada.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: process.env.FRONTEND_URL,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[billing] portal error:', err.message);
    res.status(500).json({ error: 'Erro ao abrir portal de assinatura.' });
  }
});

async function webhookHandler(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[billing] webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        await pool.query(
          'UPDATE users SET plan = $1 WHERE stripe_customer_id = $2',
          ['pro', session.customer]
        );
        console.log(`[billing] plan→pro para customer=${session.customer}`);
      }
    }

    if (
      event.type === 'customer.subscription.deleted' ||
      (event.type === 'customer.subscription.updated' &&
        event.data.object.status === 'canceled')
    ) {
      const sub = event.data.object;
      await pool.query(
        'UPDATE users SET plan = $1 WHERE stripe_customer_id = $2',
        ['free', sub.customer]
      );
      console.log(`[billing] plan→free para customer=${sub.customer}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[billing] webhook handler error:', err.message);
    res.status(500).json({ error: 'Erro interno no webhook.' });
  }
}

module.exports = router;
module.exports.webhookHandler = webhookHandler;

const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[billing] STRIPE_SECRET_KEY não definida — serviço de billing desabilitado');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder', {
  apiVersion: '2024-06-20',
});

module.exports = stripe;

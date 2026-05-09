describe('stripe service', () => {
  it('carrega sem lançar erro quando STRIPE_SECRET_KEY está definida', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    jest.resetModules();
    expect(() => require('../services/stripe')).not.toThrow();
    delete process.env.STRIPE_SECRET_KEY;
  });
});

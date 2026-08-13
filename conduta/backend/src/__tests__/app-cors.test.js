const request = require('supertest');

describe('CORS do aplicativo', () => {
  let app;

  beforeAll(() => {
    process.env.CORS_ORIGIN =
      'https://conduta.online,https://www.conduta.online,https://conduta.vercel.app';

    expect(() => {
      app = require('../app');
    }).not.toThrow();
  });

  it('aceita preflight PATCH em qualquer rota sem quebrar a inicialização', async () => {
    const response = await request(app)
      .options('/rota-inexistente/aninhada')
      .set('Origin', 'https://conduta.online')
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('https://conduta.online');
    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
  });
});

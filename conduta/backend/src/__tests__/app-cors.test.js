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

  it('rejeita origem não permitida com 403 em vez de 500', async () => {
    const response = await request(app).get('/health').set('Origin', 'https://evil.example');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Origem não permitida.' });
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejeita preflight de origem não permitida com 403', async () => {
    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('permite requisição sem header Origin (server-to-server, webhooks)', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

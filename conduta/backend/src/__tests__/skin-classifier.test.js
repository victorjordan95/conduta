const { classificar } = require('../services/skin-classifier');

beforeEach(() => {
  process.env.HF_API_TOKEN = 'hf_test';
  process.env.HF_SKIN_MODEL = 'test/model';
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
  delete process.env.HF_API_TOKEN;
  delete process.env.HF_SKIN_MODEL;
});

describe('classificar', () => {
  it('retorna texto formatado com top 3 diagnósticos em português', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { label: 'MEL', score: 0.87 },
        { label: 'NV', score: 0.09 },
        { label: 'BCC', score: 0.02 },
        { label: 'AK', score: 0.01 },
      ],
    });

    const resultado = await classificar(Buffer.from('fake'), 'image/jpeg');

    expect(resultado).toContain('Melanoma (87%)');
    expect(resultado).toContain('Nevo melanocítico (9%)');
    expect(resultado).toContain('Carcinoma basocelular (2%)');
    expect(resultado).toContain('⚠️');
  });

  it('lança erro com status 503 quando HF retorna 503', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(classificar(Buffer.from('fake'), 'image/jpeg')).rejects.toMatchObject({ status: 503 });
  });

  it('lança erro com status 502 para outros erros do HF', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(classificar(Buffer.from('fake'), 'image/jpeg')).rejects.toMatchObject({ status: 502 });
  });

  it('lança erro 502 quando HF_API_TOKEN não está definido', async () => {
    delete process.env.HF_API_TOKEN;
    await expect(classificar(Buffer.from('fake'), 'image/jpeg')).rejects.toMatchObject({ status: 502 });
  });
});

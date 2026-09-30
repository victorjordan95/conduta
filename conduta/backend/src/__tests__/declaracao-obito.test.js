const { normalizarDO, extrairJSON, DO_PROMPT } = require('../services/declaracao-obito');

describe('declaracao-obito', () => {
  it('normaliza saída incompleta do modelo para o formato completo', () => {
    const out = normalizarDO({
      sexo: 'masculino',
      idade: 72,
      parte1: [{ causa: 'Choque séptico', intervalo: '1 dia', cid: 'R57.2' }, { causa: 'Pneumonia', cid: 'J18.9' }],
      alertas: ['Falta CRM', '', null],
      campo_estranho: 'ignorar',
    });

    expect(out.sexo).toBe('masculino');
    expect(out.idade).toBe('72');
    expect(out.nome).toBe('');
    expect(out.parte1).toHaveLength(4);
    expect(out.parte1[1]).toEqual({ causa: 'Pneumonia', intervalo: '', cid: 'J18.9' });
    expect(out.parte1[3]).toEqual({ causa: '', intervalo: '', cid: '' });
    expect(out.parte2).toHaveLength(2);
    expect(out.alertas).toEqual(['Falta CRM']);
    expect(out).not.toHaveProperty('campo_estranho');
  });

  it('não aceita objetos como valor de campo texto', () => {
    expect(normalizarDO({ nome: { x: 1 }, parte1: 'lixo' }).nome).toBe('');
    expect(normalizarDO(undefined).parte1).toHaveLength(4);
  });

  it('extrai JSON mesmo cercado de markdown', () => {
    expect(extrairJSON('```json\n{"sexo":"feminino"}\n```')).toEqual({ sexo: 'feminino' });
    expect(() => extrairJSON('sem json aqui')).toThrow();
  });

  it('prompt cobre regras de segurança da DO', () => {
    expect(DO_PROMPT).toMatch(/CAUSA BÁSICA/);
    expect(DO_PROMPT).toMatch(/IML/);
    expect(DO_PROMPT).toMatch(/parada cardiorrespiratória/);
    expect(DO_PROMPT).toMatch(/Nunca invente/);
  });
});

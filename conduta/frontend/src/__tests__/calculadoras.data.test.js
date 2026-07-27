import { describe, expect, it } from 'vitest';
import { calculadoras, getCalculadora } from '../data/calculadoras';

describe('registry de calculadoras', () => {
  it('contém apenas calculadoras públicas com metadados completos', () => {
    expect(calculadoras.map((item) => item.slug)).toEqual([
      'imc',
      'superficie-corporal',
    ]);

    calculadoras.forEach((item) => {
      expect(item.titulo).toBeTruthy();
      expect(item.descricao).toBeTruthy();
      expect(item.campos.length).toBeGreaterThan(0);
      expect(item.formula).toBeTruthy();
      expect(item.referencia).toBeTruthy();
      expect(item.limitacao).toBeTruthy();
      expect(item.calculate).toEqual(expect.any(Function));
    });
  });

  it('busca calculadora por slug e retorna null para slug desconhecido', () => {
    expect(getCalculadora('imc')).toBe(calculadoras[0]);
    expect(getCalculadora('nao-existe')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  calcularImc,
  calcularSuperficieCorporal,
  validarEntradas,
} from '../utils/calculadoras';

describe('calculadoras determinísticas', () => {
  it('calcula IMC e classificação para valores válidos', () => {
    expect(calcularImc({ pesoKg: 70, alturaCm: 175 })).toEqual({
      valor: 22.86,
      classificacao: 'Eutrofia',
    });
  });

  it('calcula superfície corporal pela fórmula de Mosteller', () => {
    expect(calcularSuperficieCorporal({ pesoKg: 70, alturaCm: 175 })).toEqual({
      valor: 1.84,
    });
  });

  it('rejeita peso ou altura ausentes, zero, negativos ou não numéricos', () => {
    expect(() => validarEntradas({ pesoKg: 0, alturaCm: 175 })).toThrow();
    expect(() => validarEntradas({ pesoKg: 70, alturaCm: '175' })).toThrow();
  });
});

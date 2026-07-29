import { describe, expect, it } from 'vitest';
import { buildClinicalSearchIndex, searchClinicalTools } from '../utils/clinicalSearch';

describe('clinicalSearch', () => {
  it('cria links locais para protocolos e calculadoras', () => {
    const index = buildClinicalSearchIndex();

    expect(index).toEqual(expect.arrayContaining([
      expect.objectContaining({ tipo: 'protocolo', href: '/protocolos/sri' }),
      expect.objectContaining({ tipo: 'calculadora', href: '/calculadoras/imc' }),
    ]));
  });

  it('busca sem diferenciar acentos, caixa ou categoria', () => {
    const results = searchClinicalTools(buildClinicalSearchIndex(), 'via aerea');

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((item) => item.tipo === 'protocolo')).toBe(true);
  });

  it('retorna todos os itens para uma busca vazia e nenhum para termo ausente', () => {
    const index = buildClinicalSearchIndex();

    expect(searchClinicalTools(index, '')).toHaveLength(index.length);
    expect(searchClinicalTools(index, 'termo inexistente')).toEqual([]);
  });
});

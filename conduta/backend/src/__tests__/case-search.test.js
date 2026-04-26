const mockQuery = jest.fn();
const mockEmbed = jest.fn().mockResolvedValue(new Array(1536).fill(0.1));

jest.mock('../db/pg', () => ({ query: mockQuery }));
jest.mock('../services/embeddings', () => ({ embed: mockEmbed }));

const { searchSimilarCases } = require('../services/case-search');

beforeEach(() => {
  mockQuery.mockClear();
  mockEmbed.mockReset();
  mockEmbed.mockResolvedValue(new Array(1536).fill(0.1));
});

describe('searchSimilarCases', () => {
  it('retorna null quando não há casos similares', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const result = await searchSimilarCases('Paciente com tosse', 'user-1');
    expect(result).toBeNull();
  });

  it('retorna null quando casos não têm summary', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ content: 'tosse há 3 dias', summary: null }],
    });
    const result = await searchSimilarCases('Paciente com tosse', 'user-1');
    expect(result).toBeNull();
  });

  it('retorna contexto formatado com hipótese e conduta', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          content: 'Paciente 35 anos com tosse produtiva há 7 dias, febre 38.5',
          summary: { hipotese: 'Pneumonia bacteriana', conduta: 'Amoxicilina 500mg 8/8h', alertas: [] },
        },
      ],
    });

    const result = await searchSimilarCases('tosse febre adulto', 'user-1');

    expect(result).toContain('Casos similares atendidos anteriormente');
    expect(result).toContain('Pneumonia bacteriana');
    expect(result).toContain('Amoxicilina 500mg 8/8h');
  });

  it('não lança erro quando embed falha', async () => {
    mockEmbed.mockRejectedValue(new Error('network error'));
    await expect(searchSimilarCases('tosse', 'user-1')).resolves.toBeNull();
  });

  it('exclui o próprio userId da busca', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await searchSimilarCases('tosse', 'user-abc');
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('user_id != $1');
    expect(params[0]).toBe('user-abc');
  });
});

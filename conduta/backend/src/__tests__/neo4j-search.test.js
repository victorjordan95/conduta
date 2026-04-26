const mockRun = jest.fn().mockResolvedValue({ records: [] });
const mockClose = jest.fn().mockResolvedValue(undefined);
const mockEmbed = jest.fn().mockResolvedValue(new Array(1536).fill(0.1));

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockRun, close: mockClose })),
}));

jest.mock('../services/embeddings', () => ({ embed: mockEmbed }));

const { searchClinicalContext } = require('../services/neo4j-search');

beforeEach(() => {
  mockRun.mockClear();
  mockEmbed.mockClear();
});

describe('searchClinicalContext', () => {
  it('inclui filtro status = verified na query de diagnósticos', async () => {
    await searchClinicalContext('dor no peito paciente diabético');
    const queries = mockRun.mock.calls.map(([q]) => q);
    const keywordQuery = queries.find((q) => q.includes('Diagnostico'));
    expect(keywordQuery).toContain("status = 'verified'");
  });

  it('retorna null quando não há registros', async () => {
    const result = await searchClinicalContext('xyzabc123');
    expect(result).toBeNull();
  });

  it('chama embed para busca vetorial nos DocumentoChunk', async () => {
    await searchClinicalContext('dor no peito');
    expect(mockEmbed).toHaveBeenCalledWith('dor no peito');
  });
});

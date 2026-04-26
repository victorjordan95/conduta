const mockNeo4jRun = jest.fn().mockResolvedValue({ records: [] });
const mockNeo4jClose = jest.fn().mockResolvedValue(undefined);
const mockEmbed = jest.fn().mockResolvedValue(new Array(1536).fill(0.1));
const mockPdfParse = jest.fn();

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockNeo4jRun, close: mockNeo4jClose })),
}));

jest.mock('../services/embeddings', () => ({ embed: mockEmbed }));

jest.mock('pdf-parse', () => mockPdfParse);

const { chunkText, ingestPDF } = require('../services/pdf-ingestor');

beforeEach(() => {
  mockNeo4jRun.mockClear();
  mockEmbed.mockClear();
  mockPdfParse.mockClear();
});

describe('chunkText', () => {
  it('divide texto em chunks com aproximadamente CHUNK_SIZE palavras', () => {
    const words = Array(1000).fill('palavra');
    const text = words.join(' ');
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c) => {
      const wordCount = c.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(420);
    });
  });

  it('retorna array vazio para texto vazio', () => {
    expect(chunkText('')).toEqual([]);
  });
});

describe('ingestPDF', () => {
  it('cria nós DocumentoChunk no Neo4j para cada chunk', async () => {
    mockPdfParse.mockResolvedValue({ text: Array(500).fill('dado clínico').join(' ') });

    const result = await ingestPDF(Buffer.from('fake'), 'PCDT Asma 2023');

    expect(mockEmbed).toHaveBeenCalled();
    expect(mockNeo4jRun).toHaveBeenCalled();
    const createCall = mockNeo4jRun.mock.calls.find(([q]) => q.includes('CREATE') && q.includes('DocumentoChunk'));
    expect(createCall).toBeDefined();
    expect(createCall[1].fonte).toBe('PCDT Asma 2023');
    expect(result.chunks).toBeGreaterThan(0);
    expect(result.fonte).toBe('PCDT Asma 2023');
  });
});

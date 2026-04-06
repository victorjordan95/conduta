/**
 * Verifies that searchClinicalContext only queries verified nodes.
 * Mocks the Neo4j driver to inspect the Cypher query used.
 */

const mockRun = jest.fn().mockResolvedValue({ records: [] });
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockRun, close: mockClose })),
}));

const { searchClinicalContext } = require('../services/neo4j-search');

beforeEach(() => {
  mockRun.mockClear();
});

describe('searchClinicalContext', () => {
  it('includes status = verified filter in Cypher query', async () => {
    await searchClinicalContext('dor no peito paciente diabético');
    expect(mockRun).toHaveBeenCalledTimes(1);
    const [query] = mockRun.mock.calls[0];
    expect(query).toContain("status = 'verified'");
  });

  it('returns null when no records found', async () => {
    const result = await searchClinicalContext('xyzabc123');
    expect(result).toBeNull();
  });
});

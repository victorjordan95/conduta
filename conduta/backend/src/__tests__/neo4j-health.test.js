const { getNeo4jHealth, resetNeo4jHealthCache } = require('../services/neo4j-health');

describe('getNeo4jHealth', () => {
  const originalUri = process.env.NEO4J_URI;

  beforeEach(() => {
    resetNeo4jHealthCache();
    process.env.NEO4J_URI = 'bolt://neo4j:7687';
  });

  afterAll(() => {
    process.env.NEO4J_URI = originalUri;
  });

  it('reports unavailable when a configured Neo4j cannot be reached', async () => {
    const health = await getNeo4jHealth({
      driver: { verifyConnectivity: jest.fn().mockRejectedValue(new Error('ServiceUnavailable')) },
      useCache: false,
    });

    expect(health).toEqual({ configured: true, status: 'unavailable' });
  });

  it('reports disabled when Neo4j is not configured', async () => {
    delete process.env.NEO4J_URI;

    const health = await getNeo4jHealth({ useCache: false });

    expect(health).toEqual({ configured: false, status: 'disabled' });
  });
});

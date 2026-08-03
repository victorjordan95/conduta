const { buildAuditReport, collectAuditData, serializeNeo4jInteger } = require('../../scripts/neo4j-audit');

describe('neo4j audit report', () => {
  it('serializes Neo4j integers and reports chunk length without exposing clinical text', () => {
    const report = buildAuditReport({
      labels: [{ label: 'DocumentoChunk', count: { toNumber: () => 2 } }],
      sampleChunk: { texto: 'conteúdo que não pode ser exportado', fonte: 'PCDT' },
    });

    expect(serializeNeo4jInteger({ toNumber: () => 2 })).toBe(2);
    expect(report.labels).toEqual([{ label: 'DocumentoChunk', count: 2 }]);
    expect(report.sampleChunk).toEqual({ fonte: 'PCDT', textLength: 35 });
    expect(JSON.stringify(report)).not.toContain('conteúdo que não pode ser exportado');
  });

  it('collects audit queries sequentially within one Neo4j session', async () => {
    let activeQuery = false;
    const session = {
      run: jest.fn(async () => {
        if (activeQuery) throw new Error('Queries cannot share an implicit transaction');
        activeQuery = true;
        await new Promise((resolve) => setImmediate(resolve));
        activeQuery = false;
        return { records: [] };
      }),
    };

    await expect(collectAuditData(session)).resolves.toMatchObject({ labels: [], indexes: [] });
  });
});

const { applyMigration, loadMigrations, splitStatements } = require('../db/migrate-neo4j');

describe('Neo4j migration runner', () => {
  it('skips an already applied migration', async () => {
    const session = {
      run: jest.fn().mockResolvedValue({ records: [{ get: () => '001_schema_migrations' }] }),
      executeWrite: jest.fn(),
    };

    const result = await applyMigration(session, {
      id: '001_schema_migrations',
      cypher: 'CREATE CONSTRAINT test IF NOT EXISTS FOR (n:Test) REQUIRE n.id IS UNIQUE;',
    });

    expect(result).toEqual({ id: '001_schema_migrations', applied: false });
    expect(session.run).toHaveBeenCalledTimes(1);
    expect(session.executeWrite).not.toHaveBeenCalled();
  });

  it('applies schema statements before writing its marker in a separate transaction', async () => {
    const tx = { run: jest.fn().mockResolvedValue({}) };
    const session = {
      run: jest.fn().mockResolvedValue({ records: [] }),
      executeWrite: jest.fn(async (work) => work(tx)),
    };

    const result = await applyMigration(session, {
      id: '002_clinical_graph_v2',
      cypher: 'CREATE INDEX test_a IF NOT EXISTS FOR (n:Test) ON (n.a); CREATE INDEX test_b IF NOT EXISTS FOR (n:Test) ON (n.b);',
    });

    expect(result).toEqual({ id: '002_clinical_graph_v2', applied: true });
    expect(session.run).toHaveBeenCalledTimes(3);
    expect(tx.run).toHaveBeenCalledTimes(1);
    expect(tx.run.mock.calls[0][0]).toContain('CREATE (m:SchemaMigration');
  });

  it('splits semicolon-delimited Cypher files', () => {
    expect(splitStatements('A; B;')).toEqual(['A', 'B']);
  });

  it('includes the targeted migration that removes superseded high-risk guidance', () => {
    const migrations = loadMigrations().map((migration) => migration.id);

    expect(migrations).toContain('003_remove_superseded_high_risk_guidance');
  });
});

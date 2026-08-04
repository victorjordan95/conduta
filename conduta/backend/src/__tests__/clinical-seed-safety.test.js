const fs = require('fs');
const path = require('path');

describe('clinical seed lifecycle safety', () => {
  const seedSource = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed-neo4j.js'), 'utf8');

  it('does not certify clinical seed data automatically', () => {
    expect(seedSource).toContain("const SEEDED_STATUS = 'pending'");
    expect(seedSource).not.toContain("status = 'verified'");
  });

  it('preserves an existing review status when a seed is rerun', () => {
    expect(seedSource).toContain('ON CREATE SET d.cid = $cid');
    expect(seedSource).toContain('ON MATCH SET d.cid = $cid');
    expect(seedSource).toContain('ON CREATE SET r.dose = $dose');
    expect(seedSource).toContain('ON MATCH SET r.dose = $dose');
  });
});

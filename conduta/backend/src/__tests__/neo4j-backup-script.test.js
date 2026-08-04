const fs = require('fs');
const path = require('path');

describe('Neo4j backup script', () => {
  it('requires explicit downtime approval for an offline Community dump', () => {
    const script = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'neo4j-backup.ps1'), 'utf8');
    const requireDowntime = script.indexOf('and -not $AllowDowntime');
    const dumpDatabase = script.indexOf('database dump neo4j');

    expect(requireDowntime).toBeGreaterThan(-1);
    expect(script).toContain('[switch]$AllowDowntime');
    expect(dumpDatabase).toBeGreaterThan(requireDowntime);
  });

  it('restarts the service after an approved maintenance backup', () => {
    const script = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'neo4j-backup.ps1'), 'utf8');

    expect(script).toContain('docker compose -f $composeFile stop neo4j');
    expect(script).toContain('docker compose -f $composeFile start neo4j');
  });
});

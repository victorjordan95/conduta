const graphDriver = require('../db/neo4j');

const HEALTH_CACHE_MS = 30_000;
let cachedHealth = null;

function isNeo4jConfigured() {
  return Boolean(process.env.NEO4J_URI);
}

async function getNeo4jHealth({ driver = graphDriver, now = Date.now(), useCache = true } = {}) {
  if (!isNeo4jConfigured()) return { configured: false, status: 'disabled' };

  if (useCache && cachedHealth && now - cachedHealth.checkedAt < HEALTH_CACHE_MS) {
    return cachedHealth.value;
  }

  let value;
  if (!driver) {
    value = { configured: true, status: 'unavailable' };
  } else {
    try {
      await driver.verifyConnectivity();
      value = { configured: true, status: 'ok' };
    } catch (err) {
      console.warn('[Neo4j] readiness check failed:', err.name || 'Error');
      value = { configured: true, status: 'unavailable' };
    }
  }

  if (useCache) cachedHealth = { checkedAt: now, value };
  return value;
}

function resetNeo4jHealthCache() {
  cachedHealth = null;
}

module.exports = { getNeo4jHealth, isNeo4jConfigured, resetNeo4jHealthCache };

const pool = require('../db/pg');
const graphDriver = require('../db/neo4j');
const { processNeo4jOutbox } = require('../services/neo4j-outbox');

function startNeo4jOutboxProcessor({ intervalMs = 30_000 } = {}) {
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;
    try {
      await processNeo4jOutbox({ pool, graphDriver });
    } catch (err) {
      console.error('[neo4j-outbox] processor error:', err.message);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}

module.exports = { startNeo4jOutboxProcessor };

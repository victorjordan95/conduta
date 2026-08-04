const DELETE_SESSION_REFERENCES = 'delete_session_references';
const CLEANUP_SESSION_REFERENCES = `
  MATCH (n)
  WHERE n.sourceSessionId = $sessionId OR $sessionId IN coalesce(n.sessions, [])
  REMOVE n.sourceSessionId
  SET n.sessions = [sessionId IN coalesce(n.sessions, []) WHERE sessionId <> $sessionId]
  WITH n
  WHERE size(coalesce(n.sessions, [])) = 0
    AND n.status IN ['pending_review', 'pending_validation']
  DETACH DELETE n
`;

function eventDedupeKey(type, payload) {
  if (type === DELETE_SESSION_REFERENCES && payload?.sessionId) {
    return `${type}:${payload.sessionId}`;
  }
  throw new Error('Evento Neo4j inválido.');
}

async function enqueueNeo4jEvent(pgClient, { type, payload }) {
  const dedupeKey = eventDedupeKey(type, payload);
  await pgClient.query(
    `INSERT INTO neo4j_outbox (event_type, payload, dedupe_key)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (dedupe_key) DO NOTHING`,
    [type, JSON.stringify(payload), dedupeKey]
  );
}

async function claimNextEvent(client) {
  const result = await client.query(
    `WITH next_event AS (
       SELECT id
       FROM neo4j_outbox
       WHERE status = 'pending' AND available_at <= NOW()
       ORDER BY created_at
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     UPDATE neo4j_outbox AS outbox
     SET status = 'processing', attempts = outbox.attempts + 1
     FROM next_event
     WHERE outbox.id = next_event.id
     RETURNING outbox.id, outbox.event_type, outbox.payload`
  );
  return result.rows[0] || null;
}

async function processEvent(graphDriver, event) {
  if (event.event_type !== DELETE_SESSION_REFERENCES) {
    throw new Error(`Tipo de evento Neo4j não suportado: ${event.event_type}`);
  }
  if (!event.payload?.sessionId) throw new Error('Evento sem sessionId.');

  const session = graphDriver.session();
  try {
    await session.run(CLEANUP_SESSION_REFERENCES, { sessionId: event.payload.sessionId });
  } finally {
    await session.close();
  }
}

async function rescheduleEvent(client, eventId, err) {
  await client.query(
    `UPDATE neo4j_outbox
     SET status = CASE WHEN attempts >= 10 THEN 'failed' ELSE 'pending' END,
         available_at = NOW() + (INTERVAL '1 second' * LEAST(3600, POWER(2, attempts))),
         last_error = $2
     WHERE id = $1`,
    [eventId, String(err.message || err).slice(0, 1000)]
  );
}

async function processNeo4jOutbox({ pool, graphDriver, maxEvents = 10 }) {
  let processed = 0;
  let failed = 0;

  for (let index = 0; index < maxEvents; index += 1) {
    const client = await pool.connect();
    try {
      const event = await claimNextEvent(client);
      if (!event) break;

      try {
        if (!graphDriver) throw new Error('Neo4j indisponível.');
        await processEvent(graphDriver, event);
        await client.query(
          `UPDATE neo4j_outbox
           SET status = 'completed', completed_at = NOW(), last_error = NULL
           WHERE id = $1`,
          [event.id]
        );
        processed += 1;
      } catch (err) {
        await rescheduleEvent(client, event.id, err);
        failed += 1;
        console.error('[neo4j-outbox] event failed:', err.message);
      }
    } finally {
      client.release();
    }
  }

  return { processed, failed };
}

module.exports = {
  CLEANUP_SESSION_REFERENCES,
  DELETE_SESSION_REFERENCES,
  enqueueNeo4jEvent,
  processNeo4jOutbox,
};

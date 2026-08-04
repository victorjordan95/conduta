const { enqueueNeo4jEvent, processNeo4jOutbox } = require('../services/neo4j-outbox');

describe('neo4j outbox', () => {
  it('enqueues an idempotent cleanup event through the current PostgreSQL transaction', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };

    await enqueueNeo4jEvent(client, {
      type: 'delete_session_references',
      payload: { sessionId: 'session-1' },
    });

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO neo4j_outbox'),
      ['delete_session_references', JSON.stringify({ sessionId: 'session-1' }), 'delete_session_references:session-1']
    );
  });

  it('marks a claimed cleanup event complete after an idempotent graph cleanup', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'event-1', event_type: 'delete_session_references', payload: { sessionId: 'session-1' } }] })
        .mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };
    const pool = { connect: jest.fn().mockResolvedValue(client) };
    const graphSession = { run: jest.fn().mockResolvedValue({}), close: jest.fn().mockResolvedValue() };
    const graphDriver = { session: jest.fn(() => graphSession) };

    const result = await processNeo4jOutbox({ pool, graphDriver, maxEvents: 1 });

    expect(result).toEqual({ processed: 1, failed: 0 });
    expect(graphSession.run).toHaveBeenCalledWith(expect.stringContaining('sourceSessionId = $sessionId'), { sessionId: 'session-1' });
    expect(client.query).toHaveBeenLastCalledWith(
      expect.stringContaining("status = 'completed'"),
      ['event-1']
    );
    expect(client.release).toHaveBeenCalled();
  });
});

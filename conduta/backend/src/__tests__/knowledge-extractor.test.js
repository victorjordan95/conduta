const mockCreate = jest.fn();
const mockNeo4jRun = jest.fn().mockResolvedValue({ records: [] });
const mockNeo4jClose = jest.fn().mockResolvedValue(undefined);

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }))
);

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockNeo4jRun, close: mockNeo4jClose })),
}));

const { extractAndPersist } = require('../services/knowledge-extractor');

beforeEach(() => {
  mockCreate.mockClear();
  mockNeo4jRun.mockClear();
});

describe('extractAndPersist', () => {
  it('calls OpenRouter with the response text and sessionId', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ diagnosticos: [], medicamentos: [], relacoes: [] }) } }],
    });

    await extractAndPersist('Paciente com SCA, usar AAS e heparina.', 'session-abc');

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[1].content).toContain('Paciente com SCA, usar AAS e heparina.');
  });

  it('creates pending Diagnostico nodes for new diagnoses', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            diagnosticos: [{ nome: 'Novo Diagnóstico Raro', cid: 'X99', sinonimos: ['raro'], redFlags: ['febre alta'], excluir: [] }],
            medicamentos: [],
            relacoes: [],
          }),
        },
      }],
    });
    // First call checks if node exists (returns empty), second creates it
    mockNeo4jRun.mockResolvedValueOnce({ records: [] });

    await extractAndPersist('Texto clínico.', 'session-xyz');

    const createCall = mockNeo4jRun.mock.calls.find(([q]) => q.includes('CREATE') && q.includes('Diagnostico'));
    expect(createCall).toBeDefined();
    expect(createCall[1]).toMatchObject({ nome: 'Novo Diagnóstico Raro', sourceSessionId: 'session-xyz' });
  });

  it('skips nodes that already exist as verified', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            diagnosticos: [{ nome: 'Hipertensão Arterial Sistêmica', sinonimos: [], redFlags: [], excluir: [] }],
            medicamentos: [],
            relacoes: [],
          }),
        },
      }],
    });
    // Simulate node already existing
    mockNeo4jRun.mockResolvedValueOnce({ records: [{ get: () => 'verified' }] });

    await extractAndPersist('Texto clínico.', 'session-exists');

    const createCall = mockNeo4jRun.mock.calls.find(([q]) => q.includes('CREATE') && q.includes('Diagnostico'));
    expect(createCall).toBeUndefined();
  });

  it('does not throw if OpenRouter returns malformed JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'texto livre sem json' } }],
    });
    await expect(extractAndPersist('Caso clínico.', 'session-bad')).resolves.not.toThrow();
  });
});

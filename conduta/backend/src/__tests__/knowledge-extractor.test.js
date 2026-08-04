const mockCreate = jest.fn();
const mockNeo4jRun = jest.fn().mockResolvedValue({ records: [] });
const mockNeo4jClose = jest.fn().mockResolvedValue(undefined);
const mockCreateProposal = jest.fn().mockResolvedValue({ id: 'proposal-1', status: 'pending_review' });

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }))
);

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockNeo4jRun, close: mockNeo4jClose })),
}));

jest.mock('../services/knowledge-proposals', () => ({
  createProposal: mockCreateProposal,
}));

const { extractAndPersist } = require('../services/knowledge-extractor');

beforeEach(() => {
  mockCreate.mockClear();
  mockNeo4jRun.mockClear();
  mockCreateProposal.mockClear();
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

  it('creates one pending proposal for extracted clinical knowledge', async () => {
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
    await extractAndPersist('Texto clínico.', 'session-xyz');

    expect(mockCreateProposal).toHaveBeenCalledWith({
      type: 'clinical_extraction',
      sourceSessionId: 'session-xyz',
      payload: expect.objectContaining({
        diagnosticos: [expect.objectContaining({ nome: 'Novo Diagnóstico Raro' })],
      }),
    });
  });

  it('keeps extracted entities pending even when a matching canonical node exists', async () => {
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
    await extractAndPersist('Texto clínico.', 'session-exists');

    expect(mockCreateProposal).toHaveBeenCalledTimes(1);
  });

  it('does not throw if OpenRouter returns malformed JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'texto livre sem json' } }],
    });
    await expect(extractAndPersist('Caso clínico.', 'session-bad')).resolves.not.toThrow();
  });
});

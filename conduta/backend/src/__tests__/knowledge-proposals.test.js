const mockRun = jest.fn();
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockRun, close: mockClose })),
}));

const { createFeedbackSignal, createProposal } = require('../services/knowledge-proposals');

beforeEach(() => {
  mockRun.mockReset();
  mockClose.mockClear();
});

describe('knowledge proposals', () => {
  it('stores extracted knowledge as a pending proposal', async () => {
    mockRun.mockResolvedValue({ records: [{ get: () => 'proposal-1' }] });

    const result = await createProposal({
      type: 'clinical_extraction',
      payload: { diagnosticos: [{ nome: 'Asma' }] },
      sourceSessionId: 'session-1',
    });

    expect(result).toEqual({ id: 'proposal-1', status: 'pending_review' });
    expect(mockRun.mock.calls[0][0]).toContain('CREATE (p:PropostaConhecimento');
    expect(mockRun.mock.calls[0][1]).toMatchObject({ sourceSessionId: 'session-1', status: 'pending_review' });
  });

  it('stores user feedback as a signal without changing clinical node status', async () => {
    mockRun.mockResolvedValue({ records: [{ get: () => 'signal-1' }] });

    const result = await createFeedbackSignal({
      type: 'positive',
      note: 'Boa orientação',
      sourceSessionId: 'session-1',
    });

    expect(result).toEqual({ id: 'signal-1', status: 'recorded' });
    const cypher = mockRun.mock.calls[0][0];
    expect(cypher).toContain('CREATE (s:SinalFeedback');
    expect(cypher).not.toContain("status = 'verified'");
  });
});

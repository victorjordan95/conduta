jest.mock('../services/knowledge-proposals', () => ({
  createFeedbackSignal: jest.fn(),
}));

const { createFeedbackSignal } = require('../services/knowledge-proposals');
const { DEFAULT_NEGATIVE_NOTE, recordKnowledgeFeedback } = require('../services/knowledge-feedback');

describe('recordKnowledgeFeedback', () => {
  beforeEach(() => {
    createFeedbackSignal.mockReset();
  });

  it('records positive feedback as a review signal', async () => {
    createFeedbackSignal.mockResolvedValue({ id: 'signal-1', status: 'recorded' });

    await recordKnowledgeFeedback({
      sessionId: 'session-1',
      feedback: 'positive',
      note: 'Conduta clara',
    });

    expect(createFeedbackSignal).toHaveBeenCalledWith({
      type: 'positive',
      note: 'Conduta clara',
      sourceSessionId: 'session-1',
    });
  });

  it('does not copy clinical message content into a negative feedback signal', async () => {
    await recordKnowledgeFeedback({ sessionId: 'session-1', feedback: 'negative' });

    expect(createFeedbackSignal).toHaveBeenCalledWith({
      type: 'negative',
      note: DEFAULT_NEGATIVE_NOTE,
      sourceSessionId: 'session-1',
    });
  });
});

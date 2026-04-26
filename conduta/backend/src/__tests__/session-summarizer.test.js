const mockCreate = jest.fn();
const mockQuery = jest.fn().mockResolvedValue({ rows: [] });

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }))
);

jest.mock('../db/pg', () => ({ query: mockQuery }));

const { generateAndSave } = require('../services/session-summarizer');

beforeEach(() => {
  mockCreate.mockClear();
  mockQuery.mockClear();
});

describe('generateAndSave', () => {
  it('chama LLM com o texto da resposta e persiste summary válido', async () => {
    const summary = { hipotese: 'Pneumonia', conduta: 'Amoxicilina 500mg', alertas: ['SpO2 < 94%'] };
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(summary) } }],
    });

    await generateAndSave('session-123', 'Texto da análise clínica...');

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[1].content).toContain('Texto da análise clínica');

    expect(mockQuery).toHaveBeenCalledWith(
      'UPDATE sessions SET summary = $1 WHERE id = $2',
      [JSON.stringify(summary), 'session-123']
    );
  });

  it('não lança erro quando LLM retorna JSON inválido', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'não é json' } }],
    });

    await expect(generateAndSave('session-x', 'texto')).resolves.not.toThrow();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('não lança erro quando LLM falha', async () => {
    mockCreate.mockRejectedValue(new Error('timeout'));
    await expect(generateAndSave('session-x', 'texto')).resolves.not.toThrow();
  });
});

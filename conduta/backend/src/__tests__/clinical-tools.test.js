const mockCreate = jest.fn();

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }))
);

const {
  TOOL_NAMES,
  buildClinicalToolPrompt,
  generateClinicalTool,
} = require('../services/clinical-tools');

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  mockCreate.mockReset();
});

describe('clinical-tools', () => {
  it('monta revisão medicamentosa com os fatores informados e guardrails', () => {
    const prompt = buildClinicalToolPrompt('medication_review', {
      medications: 'losartana e metformina',
      allergies: 'penicilina',
      pregnancy: 'não se aplica',
      renalHepatic: 'DRC estágio 3',
      otherFactors: 'idoso, queda recente',
    });

    expect(prompt).toContain('losartana e metformina');
    expect(prompt).toContain('penicilina');
    expect(prompt).toContain('DRC estágio 3');
    expect(prompt).toContain('não substitua');
  });

  it('gera uma ferramenta usando as mensagens da sessão', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '## Perguntas prioritárias\n- Qual a duração?' } }],
    });

    const result = await generateClinicalTool('clarifying_questions', [
      { role: 'user', content: 'Paciente com febre há dois dias.' },
      { role: 'assistant', content: 'Revisar sinais de gravidade.' },
    ]);

    expect(result).toContain('Perguntas prioritárias');
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0].messages.at(-1).content).toContain('febre há dois dias');
  });

  it('rejeita ferramenta desconhecida', async () => {
    await expect(generateClinicalTool('diagnostico_automatico', [])).rejects.toMatchObject({
      code: 'INVALID_CLINICAL_TOOL',
    });
    expect(Object.keys(TOOL_NAMES)).toEqual([
      'clarifying_questions',
      'evolution_comparison',
      'handoff',
      'medication_review',
    ]);
  });
});

const { REVIEW_PROMPT, QUICK_PROMPT } = require('../services/openrouter');

describe('prompts clínicos', () => {
  it('REVIEW_PROMPT exige seção de alertas de medicação na estrutura', () => {
    expect(REVIEW_PROMPT).toContain('## Alertas de medicação');
    expect(REVIEW_PROMPT).toContain('Sem alertas relevantes para os medicamentos sugeridos');
  });

  it('REVIEW_PROMPT instrui tabela comparadora de hipóteses', () => {
    expect(REVIEW_PROMPT).toContain('| Hipótese | A favor | Contra | Como diferenciar |');
  });

  it('REVIEW_PROMPT exige encaminhamento com tipo, prioridade e justificativa', () => {
    expect(REVIEW_PROMPT).toContain('**Prioridade**');
    expect(REVIEW_PROMPT).toContain('**Justificativa**');
    expect(REVIEW_PROMPT).toContain('**Levar consigo**');
  });

  it('QUICK_PROMPT define estrutura mínima da conduta rápida', () => {
    expect(QUICK_PROMPT).toContain('Hipótese provável');
    expect(QUICK_PROMPT).toContain('Encaminhar se');
    expect(QUICK_PROMPT).toContain('encaminhamento urgente');
  });
});

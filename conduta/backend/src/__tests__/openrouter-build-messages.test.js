const { buildMessages } = require('../services/openrouter');
const SYSTEM_PROMPT = require('../config/system-prompt');

const MAX = 6;

describe('buildMessages', () => {
  it('inclui system prompt sempre', () => {
    const msgs = buildMessages([], 'oi', null, null);
    expect(msgs[0]).toEqual({ role: 'system', content: SYSTEM_PROMPT });
  });

  it('inclui neo4jContext como system message quando fornecido', () => {
    const msgs = buildMessages([], 'oi', 'contexto neo4j', null);
    expect(msgs[1]).toEqual({
      role: 'system',
      content: 'Contexto da base de conhecimento clínica:\ncontexto neo4j',
    });
  });

  it('inclui sessionSummary como system message quando fornecido', () => {
    const summary = { hipotese: 'Pneumonia', conduta: 'Antibióticos', alertas: ['Febre alta'] };
    const msgs = buildMessages([], 'oi', null, summary);
    const systemMsgs = msgs.filter((m) => m.role === 'system');
    expect(systemMsgs.length).toBe(2);
    expect(systemMsgs[1].content).toContain('Pneumonia');
    expect(systemMsgs[1].content).toContain('Febre alta');
  });

  it('inclui newMessage como última mensagem', () => {
    const msgs = buildMessages([], 'nova mensagem', null, null);
    expect(msgs[msgs.length - 1]).toEqual({ role: 'user', content: 'nova mensagem' });
  });

  it('envia histórico completo quando sessionSummary é null (degradação graciosa)', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`,
    }));
    const msgs = buildMessages(history, 'nova', null, null);
    const historyMsgs = msgs.filter((m) => m.role !== 'system');
    // histórico completo (10) + newMessage (1) = 11
    expect(historyMsgs.length).toBe(11);
    expect(historyMsgs[0].content).toBe('msg0');
  });

  it('trunca histórico para as últimas MAX mensagens quando sessionSummary está presente', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`,
    }));
    const summary = { hipotese: 'x', conduta: 'y', alertas: [] };
    const msgs = buildMessages(history, 'nova', null, summary);
    const historyMsgs = msgs.filter((m) => m.role !== 'system');
    // slice(-6) do history (6) + newMessage (1) = 7
    expect(historyMsgs.length).toBe(MAX + 1);
    expect(historyMsgs[0].content).toBe('msg4');
    const summaryMsg = msgs.filter((m) => m.role === 'system').slice(-1)[0];
    expect(summaryMsg.content).toContain('Nenhum');
  });

  it('sessionSummary null não adiciona system message de contexto clínico', () => {
    const msgs = buildMessages([], 'oi', null, null);
    // apenas: system prompt + user message = 2
    expect(msgs.length).toBe(2);
  });

  it('inclui neo4jContext e sessionSummary como mensagens separadas quando ambos fornecidos', () => {
    const summary = { hipotese: 'H', conduta: 'C', alertas: [] };
    const msgs = buildMessages([], 'oi', 'ctx', summary);
    const systemMsgs = msgs.filter((m) => m.role === 'system');
    expect(systemMsgs.length).toBe(3);
    expect(systemMsgs[1].content).toContain('Contexto da base de conhecimento');
    expect(systemMsgs[2].content).toContain('Contexto clínico desta sessão');
  });
});

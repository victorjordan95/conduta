const { createFeedbackSignal } = require('./knowledge-proposals');

const DEFAULT_NEGATIVE_NOTE = 'Resposta marcada como incorreta pelo usuário.';

/**
 * Registra feedback como sinal para revisão humana. O feedback do usuário
 * nunca altera, aprova ou remove conhecimento clínico canônico.
 */
async function recordKnowledgeFeedback({ sessionId, feedback, note }) {
  const normalizedNote = note?.trim() || (feedback === 'negative' ? DEFAULT_NEGATIVE_NOTE : null);

  return createFeedbackSignal({
    type: feedback,
    note: normalizedNote,
    sourceSessionId: sessionId,
  });
}

module.exports = { DEFAULT_NEGATIVE_NOTE, recordKnowledgeFeedback };

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './AnalysisResult.module.scss';

function FeedbackButtons({ messageId, current, onFeedback }) {
  const [sentValue, setSentValue] = useState(null);
  const [askingNote, setAskingNote] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!messageId) return null;

  const displayValue = sentValue ?? current;

  async function handlePositive() {
    if (displayValue) return;
    setSentValue('positive');
    try {
      await onFeedback(messageId, 'positive', '');
    } catch {
      setSentValue(null);
    }
  }

  function handleNegativeClick() {
    if (displayValue) return;
    setAskingNote(true);
  }

  async function submitNegative() {
    setSubmitting(true);
    setSentValue('negative');
    setAskingNote(false);
    try {
      await onFeedback(messageId, 'negative', note.trim());
    } catch {
      setSentValue(null);
      setAskingNote(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (displayValue) {
    return (
      <div className={styles.feedbackDone}>
        {displayValue === 'positive'
          ? '👍 Obrigado — o conhecimento desta resposta foi reforçado.'
          : '👎 Correção registrada — casos similares serão alertados.'}
      </div>
    );
  }

  if (askingNote) {
    return (
      <div className={styles.feedbackNote}>
        <p className={styles.feedbackNoteLabel}>O que estava incorreto nesta resposta?</p>
        <textarea
          className={styles.feedbackNoteInput}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: dose de amoxicilina errada para o peso informado, diagnóstico diferencial importante omitido..."
          rows={3}
          autoFocus
        />
        <div className={styles.feedbackNoteActions}>
          <button
            className={styles.feedbackNoteSubmit}
            onClick={submitNegative}
            disabled={submitting}
          >
            {submitting ? 'Enviando...' : 'Enviar correção'}
          </button>
          <button
            className={styles.feedbackNoteSkip}
            onClick={() => { setNote(''); submitNegative(); }}
            disabled={submitting}
          >
            Pular explicação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feedback}>
      <span className={styles.feedbackLabel}>Esta resposta foi útil?</span>
      <button className={styles.feedbackBtn} onClick={handlePositive} title="Útil">👍</button>
      <button className={styles.feedbackBtn} onClick={handleNegativeClick} title="Não útil">👎</button>
    </div>
  );
}

export default function AnalysisResult({ messages, streaming, loading, onFeedback }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>Carregando histórico...</p>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>Descreva o caso abaixo para iniciar a análise</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {messages.map((msg, i) =>
        msg.role === 'user' ? (
          <div key={i} className={styles.userMessage}>
            <span className={styles.userLabel}>Você</span>
            <p className={styles.userContent}>{msg.content}</p>
          </div>
        ) : (
          <div key={i} className={styles.assistantMessage}>
            <div className={styles.content}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              {streaming && i === messages.length - 1 && (
                <span className={styles.cursor} />
              )}
            </div>
            {(!streaming || i < messages.length - 1) && (
              <FeedbackButtons
                messageId={msg.id}
                current={msg.feedback}
                onFeedback={onFeedback}
              />
            )}
          </div>
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
}

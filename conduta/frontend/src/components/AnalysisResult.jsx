import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './AnalysisResult.module.scss';

function FeedbackButtons({ messageId, current, onFeedback }) {
  const [sentValue, setSentValue] = useState(null);
  const [askingNote, setAskingNote] = useState(null); // null | 'negative' | 'partial'
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const MAX_NOTA = 1000;

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
    setAskingNote('negative');
  }

  function handlePartialClick() {
    if (displayValue) return;
    setAskingNote('partial');
  }

  async function submitNote() {
    if (note.length > MAX_NOTA) return;
    const tipo = askingNote;
    setSubmitting(true);
    setErroEnvio(null);
    setSentValue(tipo);
    setAskingNote(null);
    try {
      await onFeedback(messageId, tipo, note.trim());
    } catch (err) {
      setSentValue(null);
      setAskingNote(tipo);
      setErroEnvio(err.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (displayValue) {
    return (
      <div className={styles.feedbackDone}>
        {displayValue === 'positive'
          ? '👍 Obrigado — o conhecimento desta resposta foi reforçado.'
          : displayValue === 'partial'
          ? '✏️ Ajuste registrado — obrigado pelo retorno.'
          : '👎 Correção registrada — casos similares serão alertados.'}
      </div>
    );
  }

  if (askingNote) {
    const isPartial = askingNote === 'partial';
    return (
      <div className={styles.feedbackNote}>
        <p className={styles.feedbackNoteLabel}>
          {isPartial ? 'O que precisa de ajuste nesta resposta?' : 'O que estava incorreto nesta resposta?'}
        </p>
        <textarea
          className={styles.feedbackNoteInput}
          value={note}
          onChange={(e) => { setNote(e.target.value); setErroEnvio(null); }}
          placeholder="Ex: dose de amoxicilina errada para o peso informado, diagnóstico diferencial importante omitido..."
          rows={3}
          autoFocus
          maxLength={MAX_NOTA}
        />
        <div className={styles.feedbackNoteMeta}>
          {erroEnvio && <span className={styles.feedbackErro}>{erroEnvio}</span>}
          <span className={note.length > MAX_NOTA * 0.9 ? styles.feedbackContadorAlerta : styles.feedbackContador}>
            {note.length}/{MAX_NOTA}
          </span>
        </div>
        <div className={styles.feedbackNoteActions}>
          <button
            className={styles.feedbackNoteSubmit}
            onClick={submitNote}
            disabled={submitting || note.length > MAX_NOTA}
          >
            {submitting ? 'Enviando...' : isPartial ? 'Enviar ajuste' : 'Enviar correção'}
          </button>
          <button
            className={styles.feedbackNoteSkip}
            onClick={() => { setNote(''); submitNote(); }}
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
      <button className={styles.feedbackBtnPartial} onClick={handlePartialClick} title="Boa, mas precisa de ajuste">✏️ Bom, mas...</button>
      <button className={styles.feedbackBtn} onClick={handleNegativeClick} title="Incorreta">👎</button>
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
      <div className={styles.container} data-coachmark="results">
        <p className={styles.empty}>Descreva o caso abaixo para iniciar a análise</p>
      </div>
    );
  }

  return (
    <div className={styles.container} data-coachmark="results">
      {messages.map((msg, i) =>
        msg.role === 'user' ? (
          <div key={i} className={styles.userMessage}>
            <span className={styles.userLabel}>Você</span>
            <p className={styles.userContent}>{msg.content}</p>
          </div>
        ) : (
          <div key={i} className={styles.assistantMessage}>
            <div className={styles.content}>
              {streaming && i === messages.length - 1 && !msg.content ? (
                <div className={styles.skeleton}>
                  <div className={styles.skeletonLine} style={{ width: '80%' }} />
                  <div className={styles.skeletonLine} style={{ width: '65%' }} />
                  <div className={styles.skeletonLine} style={{ width: '90%' }} />
                  <div className={styles.skeletonLine} style={{ width: '55%' }} />
                  <div className={styles.skeletonLine} style={{ width: '75%' }} />
                </div>
              ) : (
                <>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {streaming && i === messages.length - 1 && (
                    <span className={styles.cursor} />
                  )}
                </>
              )}
            </div>
            {(!streaming || i < messages.length - 1) && (
              <FeedbackButtons
                messageId={msg.id}
                current={msg.feedback}
                onFeedback={onFeedback}
              />
            )}
            {(!streaming || i < messages.length - 1) && (
              <p className={styles.aiDisclaimer}>
                Esta análise é gerada por inteligência artificial e não substitui o julgamento clínico do profissional.
              </p>
            )}
          </div>
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './AnalysisResult.module.scss';

function IconePolegar({ baixo }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={baixo ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function IconeLapis() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 18.5 2 20l1.5-5.5L17 3z" />
    </svg>
  );
}

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
          ? 'Obrigado. O conhecimento desta resposta foi reforçado.'
          : displayValue === 'partial'
          ? 'Ajuste registrado. Obrigado pelo retorno.'
          : 'Correção registrada. Casos similares serão alertados.'}
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
      <button className={styles.feedbackBtn} onClick={handlePositive} title="Útil" aria-label="Resposta útil">
        <IconePolegar />
      </button>
      <button className={styles.feedbackBtnPartial} onClick={handlePartialClick} title="Boa, mas precisa de ajuste">
        <IconeLapis /> Bom, mas...
      </button>
      <button className={styles.feedbackBtn} onClick={handleNegativeClick} title="Incorreta" aria-label="Resposta incorreta">
        <IconePolegar baixo />
      </button>
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
        <div className={styles.skeleton}>
          <div className={styles.skeletonLine} style={{ width: '72%' }} />
          <div className={styles.skeletonLine} style={{ width: '88%' }} />
          <div className={styles.skeletonLine} style={{ width: '55%' }} />
          <div className={styles.skeletonLine} style={{ width: '80%', marginTop: '24px' }} />
          <div className={styles.skeletonLine} style={{ width: '65%' }} />
          <div className={styles.skeletonLine} style={{ width: '91%' }} />
          <div className={styles.skeletonLine} style={{ width: '48%' }} />
        </div>
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
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

import { useState, useRef, useMemo, useEffect } from 'react';
import { analyzeCase, classificarLesao } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './CaseInput.module.scss';

export default function CaseInput({ sessionId, usage, onAnalysisStart, onChunk, onAnalysisDone, onUsageUpdate, onSessionMsgCount }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [foto, setFoto] = useState(null);
  const [classificando, setClassificando] = useState(false);
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('conduta_mode');
    return saved === 'rapida' ? 'rapida' : 'completa';
  });
  const fileInputRef = useRef(null);

  const fotoUrl = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto]);

  useEffect(() => {
    return () => {
      if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    };
  }, [fotoUrl]);

  const isPro = user?.role === 'admin';
  const limitReached = usage && usage.limit !== null && usage.used >= usage.limit;

  function handleModeChange(novoModo) {
    setMode(novoModo);
    localStorage.setItem('conduta_mode', novoModo);
  }

  function handleFotoChange(e) {
    const arquivo = e.target.files?.[0];
    if (arquivo) setFoto(arquivo);
    e.target.value = '';
  }

  async function submitCase() {
    if (!content.trim() || analyzing || limitReached) return;

    setError('');
    setAnalyzing(true);
    let analiseIniciada = false;

    try {
      let textoFinal = content.trim();

      if (foto) {
        setClassificando(true);
        const { classificacao } = await classificarLesao(foto);
        setClassificando(false);
        textoFinal = `${classificacao}\n\n---\n\n${textoFinal}`;
      }

      onAnalysisStart(textoFinal);
      analiseIniciada = true;
      setContent('');
      setFoto(null);
      await analyzeCase(sessionId, textoFinal, onChunk, onSessionMsgCount, mode);
    } catch (err) {
      setClassificando(false);
      if (err.code === 'USAGE_LIMIT' && err.usage) {
        onUsageUpdate(err.usage);
      } else {
        setError(err.message || 'Erro ao processar análise. Verifique a conexão e tente novamente.');
      }
    } finally {
      setAnalyzing(false);
      if (analiseIniciada) onAnalysisDone();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    submitCase();
  }

  const statusText = classificando
    ? 'Classificando imagem...'
    : analyzing
    ? 'Analisando...'
    : null;

  return (
    <div className={styles.container} data-coachmark="case-input">
      {limitReached && (
        <div className={styles.limitBanner}>
          <span>Você atingiu seu limite de {usage.limit} análises este mês.</span>
          <a href="/#precos" className={styles.upgradeLink}>
            Assinar Pro — R$39,90/mês
          </a>
        </div>
      )}
      <div className={styles.labelRow}>
        <span className={styles.label}>Caso clínico</span>
        <span className={styles.hint}>
          Texto livre — descreva com os dados que você tem{' '}
          <kbd className={styles.kbd}>Ctrl+Enter</kbd> para enviar
        </span>
      </div>
      <div className={styles.modeToggle} role="radiogroup" aria-label="Modo de análise">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'rapida'}
          className={`${styles.modeBtn}${mode === 'rapida' ? ` ${styles.modeBtnActive}` : ''}`}
          onClick={() => handleModeChange('rapida')}
          disabled={analyzing}
        >
          Conduta rápida
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'completa'}
          className={`${styles.modeBtn}${mode === 'completa' ? ` ${styles.modeBtnActive}` : ''}`}
          onClick={() => handleModeChange('completa')}
          disabled={analyzing}
        >
          Análise completa
        </button>
        <span className={styles.modeHint}>
          {mode === 'rapida'
            ? 'Resposta objetiva para casos simples'
            : 'Hipóteses, raciocínio, conduta e alertas'}
        </span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputRow}>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submitCase();
              }
            }}
            placeholder="Descreva o caso como escreveria num prontuário — idade, queixa principal, sinais vitais, tempo de evolução, comorbidades..."
            disabled={analyzing || limitReached}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={!content.trim() || analyzing || limitReached}
          >
            {classificando ? 'Classificando...' : analyzing ? 'Analisando...' : 'Analisar'}
          </button>
        </div>
        {isPro && (
          <div className={styles.fotoArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className={styles.fotoInput}
              onChange={handleFotoChange}
            />
            {foto ? (
              <div className={styles.fotoPreview}>
                <img
                  src={fotoUrl}
                  alt="Preview da lesão"
                  className={styles.fotoThumb}
                />
                <span className={styles.fotoNome}>{foto.name}</span>
                <button
                  type="button"
                  className={styles.fotoRemover}
                  onClick={() => setFoto(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.fotoBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzing}
                >
                  Anexar foto de lesão de pele
                </button>
                <p className={styles.fotoAviso}>
                  Apenas fotos de lesões cutâneas. Não adequado para radiografias, fraturas ou outras imagens médicas.
                </p>
              </>
            )}
          </div>
        )}
        {(error || statusText) && (
          <div className={styles.statusLine}>
            {error
              ? <span className={styles.errorText} role="alert">{error}</span>
              : <span className={styles.progress}>{statusText}</span>
            }
          </div>
        )}
      </form>
    </div>
  );
}

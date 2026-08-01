import { useState, useRef, useMemo, useEffect } from 'react';
import { analyzeCase, classificarLesao } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useMediaQuery from '../utils/useMediaQuery';
import styles from './CaseInput.module.scss';

// label = o que aparece (discreto); name = o que o leitor de tela e o tooltip dizem
const MODES = [
  { id: 'rapida', label: 'Rápida', name: 'Conduta rápida', hint: 'Resposta objetiva para casos simples' },
  { id: 'completa', label: 'Completa', name: 'Análise completa', hint: 'Hipóteses, raciocínio, conduta e alertas' },
];

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
  const textareaRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const fotoUrl = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto]);

  useEffect(() => {
    return () => {
      if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    };
  }, [fotoUrl]);

  // cresce com o texto até o teto do CSS; vazio volta ao min-height do CSS,
  // senão o placeholder longo reservaria três linhas de tela sem nada escrito
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '';
    if (content) el.style.height = `${el.scrollHeight}px`;
  }, [content]);

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

  const activeHint = MODES.find((m) => m.id === mode)?.hint;

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
      <form onSubmit={handleSubmit}>
        <div className={`${styles.composer}${analyzing || limitReached ? ` ${styles.composerDisabled}` : ''}`}>
          <label className={styles.srOnly} htmlFor="case-textarea">Caso clínico</label>
          <textarea
            id="case-textarea"
            ref={textareaRef}
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submitCase();
              }
            }}
            rows={2}
            // no mobile o placeholder longo ocupava três linhas de tela antes de
            // qualquer texto; a versão curta ensina o mesmo formato em duas
            placeholder={isMobile
              ? 'Idade, queixa, sinais vitais, evolução...'
              : 'Descreva o caso como escreveria num prontuário — idade, queixa principal, sinais vitais, tempo de evolução, comorbidades...'}
            disabled={analyzing || limitReached}
          />

          {isPro && (
            <div className={styles.fotoArea}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className={styles.fotoInput}
                onChange={handleFotoChange}
              />
              {foto && (
                <div className={styles.fotoPreview}>
                  <img src={fotoUrl} alt="Preview da lesão" className={styles.fotoThumb} />
                  <span className={styles.fotoNome}>{foto.name}</span>
                  <button
                    type="button"
                    className={styles.fotoRemover}
                    onClick={() => setFoto(null)}
                    aria-label="Remover foto"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={styles.bar}>
            <div className={styles.modeToggle} role="radiogroup" aria-label="Modo de análise">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === m.id}
                  aria-label={m.name}
                  title={`${m.name}: ${m.hint}`}
                  className={`${styles.modeBtn}${mode === m.id ? ` ${styles.modeBtnActive}` : ''}`}
                  onClick={() => handleModeChange(m.id)}
                  disabled={analyzing}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {isPro && !foto && (
              <button
                type="button"
                className={styles.fotoBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
                title="Apenas lesões cutâneas. Não adequado para radiografias ou outras imagens médicas."
              >
                <span aria-hidden="true">⊕</span> Anexar foto de lesão de pele
              </button>
            )}

            <span className={styles.hint}>
              <kbd className={styles.kbd}>Ctrl+Enter</kbd> envia
            </span>

            <button
              type="submit"
              className={styles.button}
              disabled={!content.trim() || analyzing || limitReached}
            >
              {classificando ? 'Classificando...' : analyzing ? 'Analisando...' : 'Analisar'}
            </button>
          </div>
        </div>

        <div className={styles.subLine}>
          {error ? (
            <span className={styles.errorText} role="alert">{error}</span>
          ) : statusText ? (
            <span className={styles.progress}>{statusText}</span>
          ) : (
            <span className={styles.modeHint}>{activeHint}</span>
          )}
        </div>
      </form>
    </div>
  );
}

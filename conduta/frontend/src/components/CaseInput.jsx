import { useState, useRef } from 'react';
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
  const fileInputRef = useRef(null);

  const isPro = user?.plan === 'pro' || user?.role === 'admin';
  const limitReached = usage && usage.limit !== null && usage.used >= usage.limit;

  function handleFotoChange(e) {
    const arquivo = e.target.files?.[0];
    if (arquivo) setFoto(arquivo);
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || analyzing || limitReached) return;

    setError('');
    setAnalyzing(true);

    try {
      let textoFinal = content.trim();

      if (foto) {
        setClassificando(true);
        const { classificacao } = await classificarLesao(foto);
        setClassificando(false);
        textoFinal = `${classificacao}\n\n---\n\n${textoFinal}`;
      }

      onAnalysisStart(textoFinal);
      await analyzeCase(sessionId, textoFinal, onChunk, onSessionMsgCount);
      setContent('');
      setFoto(null);
    } catch (err) {
      setClassificando(false);
      if (err.code === 'USAGE_LIMIT' && err.usage) {
        onUsageUpdate(err.usage);
      } else {
        setError(err.message || 'Erro ao processar análise. Verifique a conexão e tente novamente.');
      }
    } finally {
      setAnalyzing(false);
      onAnalysisDone();
    }
  }

  const statusText = classificando
    ? 'Classificando imagem...'
    : analyzing
    ? 'Processando análise...'
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
      <div className={styles.label}>Caso clínico</div>
      <form onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Descreva o caso como escreveria num prontuário — idade, queixa principal, sinais vitais, tempo de evolução, comorbidades..."
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
            {foto ? (
              <div className={styles.fotoPreview}>
                <img
                  src={URL.createObjectURL(foto)}
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
                  📎 Anexar foto de lesão de pele
                </button>
                <p className={styles.fotoAviso}>
                  Apenas fotos de lesões cutâneas. Não adequado para radiografias, fraturas ou outras imagens médicas.
                </p>
              </>
            )}
          </div>
        )}
        <div className={styles.footer}>
          <span className={styles.hint}>
            {error ? (
              <span style={{ color: '#c0392b' }}>{error}</span>
            ) : statusText ? (
              <span className={styles.progress}>{statusText}</span>
            ) : (
              'Texto livre — descreva com os dados que você tem'
            )}
          </span>
          <button
            type="submit"
            className={styles.button}
            disabled={!content.trim() || analyzing || limitReached}
          >
            {classificando ? 'Classificando...' : analyzing ? 'Analisando...' : 'Analisar'}
          </button>
        </div>
      </form>
    </div>
  );
}

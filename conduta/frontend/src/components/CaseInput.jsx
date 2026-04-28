import { useState } from 'react';
import { analyzeCase } from '../services/api';
import styles from './CaseInput.module.scss';

export default function CaseInput({ sessionId, usage, onAnalysisStart, onChunk, onAnalysisDone, onUsageUpdate }) {
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const limitReached = usage && usage.limit !== null && usage.used >= usage.limit;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || analyzing || limitReached) return;

    setError('');
    setAnalyzing(true);

    try {
      onAnalysisStart(content.trim());
      await analyzeCase(sessionId, content.trim(), onChunk);
      setContent('');
    } catch (err) {
      if (err.code === 'USAGE_LIMIT' && err.usage) {
        onUsageUpdate(err.usage);
      } else {
        setError('Erro ao processar análise. Verifique a conexão e tente novamente.');
      }
    } finally {
      setAnalyzing(false);
      onAnalysisDone();
    }
  }

  return (
    <div className={styles.container}>
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
        <div className={styles.footer}>
          <span className={styles.hint}>
            {error ? (
              <span style={{ color: '#c0392b' }}>{error}</span>
            ) : analyzing ? (
              <span className={styles.progress}>Processando análise...</span>
            ) : (
              'Texto livre — descreva com os dados que você tem'
            )}
          </span>
          <button
            type="submit"
            className={styles.button}
            disabled={!content.trim() || analyzing || limitReached}
          >
            {analyzing ? 'Analisando...' : 'Analisar'}
          </button>
        </div>
      </form>
    </div>
  );
}

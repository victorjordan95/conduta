import { useState } from 'react';
import { analyzeCase } from '../services/api';
import styles from './CaseInput.module.scss';

export default function CaseInput({ sessionId, onAnalysisStart, onChunk, onAnalysisDone }) {
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || analyzing) return;

    setError('');
    setAnalyzing(true);

    try {
      onAnalysisStart(content.trim());
      await analyzeCase(sessionId, content.trim(), onChunk);
      setContent('');
    } catch (err) {
      setError('Erro ao processar análise. Verifique a conexão e tente novamente.');
    } finally {
      setAnalyzing(false);
      onAnalysisDone();
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.label}>Caso clínico</div>
      <form onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Descreva o caso como escreveria num prontuário — idade, queixa principal, sinais vitais, tempo de evolução, comorbidades..."
          disabled={analyzing}
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
            disabled={!content.trim() || analyzing}
          >
            {analyzing ? 'Analisando...' : 'Analisar'}
          </button>
        </div>
      </form>
    </div>
  );
}

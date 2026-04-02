import ReactMarkdown from 'react-markdown';
import styles from './AnalysisResult.module.scss';

export default function AnalysisResult({ content, analyzing }) {
  if (!content && !analyzing) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>
          Descreva o caso abaixo para iniciar a análise
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <ReactMarkdown>{content}</ReactMarkdown>
        {analyzing && <span className={styles.cursor} />}
      </div>
    </div>
  );
}

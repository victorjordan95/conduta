import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import CaseInput from '../components/CaseInput';
import AnalysisResult from '../components/AnalysisResult';
import styles from './Dashboard.module.scss';

export default function Dashboard() {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  function handleSelectSession(id) {
    setActiveSessionId(id);
    setAnalysis('');
  }

  return (
    <div className={styles.layout}>
      <Sidebar
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
      />

      <main className={styles.main}>
        {!activeSessionId ? (
          <div className={styles.empty}>
            <p>Selecione ou inicie um caso</p>
            <span>Use o painel lateral para criar um novo caso ou retomar um anterior</span>
          </div>
        ) : (
          <>
            <AnalysisResult content={analysis} analyzing={analyzing} />
            <CaseInput
              sessionId={activeSessionId}
              onAnalysisStart={() => {
                setAnalysis('');
                setAnalyzing(true);
              }}
              onChunk={(chunk) => setAnalysis((prev) => prev + chunk)}
              onAnalysisDone={() => setAnalyzing(false)}
            />
          </>
        )}
      </main>
    </div>
  );
}

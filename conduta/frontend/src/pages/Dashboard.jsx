import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CaseInput from '../components/CaseInput';
import AnalysisResult from '../components/AnalysisResult';
import UsageCounter from '../components/UsageCounter';
import Coachmark from '../components/Coachmark';
import { getSession, submitFeedback, getUsage, downloadSessionPdf, getSessionEntities } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.scss';

function EntitiesPanel({ sessionId }) {
  const [open, setOpen] = useState(false);
  const [entities, setEntities] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setOpen(false);
    setEntities(null);
    setLoading(false);
    setError(null);
  }, [sessionId]);

  async function handleToggle() {
    if (!sessionId) return;
    if (!open && entities === null) {
      setLoading(true);
      try {
        const data = await getSessionEntities(sessionId);
        setEntities(data);
      } catch (err) {
        setError('Erro ao carregar entidades.');
      } finally {
        setLoading(false);
      }
    }
    setOpen((prev) => !prev);
  }

  const total = entities ? entities.diagnosticos.length + entities.medicamentos.length : 0;

  return (
    <div className={styles.entitiesPanel} data-coachmark="entities">
      <button className={styles.entitiesToggle} onClick={handleToggle}>
        {open ? '▴' : '▾'} Entidades extraídas{entities !== null ? ` (${total})` : ''}
      </button>
      {open && (
        <div className={styles.entitiesBody}>
          {loading && <span className={styles.entitiesInfo}>Carregando...</span>}
          {error && <span className={styles.entitiesError}>{error}</span>}
          {entities !== null && total === 0 && !loading && (
            <span className={styles.entitiesInfo}>Nenhuma entidade encontrada.</span>
          )}
          {entities && entities.diagnosticos.length > 0 && (
            <div className={styles.entitiesGroup}>
              <span className={styles.entitiesLabel}>Diagnósticos</span>
              <div className={styles.entitiesTags}>
                {entities.diagnosticos.map((d, i) => (
                  <span
                    key={i}
                    className={styles.tagDiag}
                    title={d.status === 'pending' ? 'Aguardando revisão' : 'Verificado'}
                  >
                    {d.nome}{d.cid ? ` (${d.cid})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
          {entities && entities.medicamentos.length > 0 && (
            <div className={styles.entitiesGroup}>
              <span className={styles.entitiesLabel}>Medicamentos</span>
              <div className={styles.entitiesTags}>
                {entities.medicamentos.map((m, i) => (
                  <span
                    key={i}
                    className={styles.tagMed}
                    title={m.status === 'pending' ? 'Aguardando revisão' : 'Verificado'}
                  >
                    {m.nome}{m.classe ? ` · ${m.classe}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage] = useState(null);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showSessionTour, setShowSessionTour] = useState(false);

  useEffect(() => {
    if (user?.plan === 'free') {
      getUsage().then(setUsage).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user && user.coachmarks_welcome_seen === false) {
      setShowWelcomeTour(true);
    }
  }, [user]);

  async function refreshUsage() {
    if (user?.plan === 'free') {
      getUsage().then(setUsage).catch(() => {});
    }
  }

  async function handleSelectSession(id) {
    setActiveSessionId(id);
    setActiveSession(null);
    setMessages([]);
    setStreaming(false);
    setLoadingHistory(true);
    try {
      const data = await getSession(id);
      setMessages(data.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, feedback: m.feedback })));
      setActiveSession(data.session);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleNewSession(id) {
    await handleSelectSession(id);
    if (user && user.coachmarks_session_seen === false) {
      setShowSessionTour(true);
    }
    setSidebarOpen(false);
  }

  function handleSessionDeleted(deletedId) {
    if (deletedId === activeSessionId) {
      setActiveSessionId(null);
      setActiveSession(null);
      setMessages([]);
    }
  }

  async function handleDownloadPdf() {
    try {
      const blob = await downloadSessionPdf(activeSessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caso-${activeSession?.titulo || 'caso'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err.message);
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          handleSelectSession(id);
          setSidebarOpen(false);
        }}
        onNewSession={handleNewSession}
        onSessionDeleted={handleSessionDeleted}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {showWelcomeTour && (
        <Coachmark
          type="welcome"
          steps={[
            {
              target: 'sidebar',
              title: 'Painel lateral',
              text: 'Crie um novo caso clínico pelo botão "+ Novo caso" ou retome um anterior.',
            },
          ]}
          onDone={() => setShowWelcomeTour(false)}
        />
      )}

      {showSessionTour && (
        <Coachmark
          type="session"
          steps={[
            {
              target: 'case-input',
              title: 'Campo do caso clínico',
              text: 'Descreva o caso como em um prontuário — idade, queixa, sinais vitais, evolução.',
            },
            {
              target: 'results',
              title: 'Resultado da análise',
              text: 'Após cada resposta, avalie com 👍 ou 👎. Feedbacks negativos corretos e validados pelo time rendem +2 análises extras.',
            },
            {
              target: 'entities',
              title: 'Entidades extraídas',
              text: 'Clique para ver diagnósticos e medicamentos detectados automaticamente no caso.',
            },
          ]}
          onDone={() => setShowSessionTour(false)}
        />
      )}

      <main className={styles.main}>
        <header className={styles.mobileHeader}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <span />
            <span />
            <span />
          </button>
          <span className={styles.mobileBrand}>Conduta</span>
        </header>

        {usage && <UsageCounter used={usage.used} limit={usage.limit} />}

        {!activeSessionId ? (
          <div className={styles.empty}>
            <p>Selecione ou inicie um caso</p>
            <span>Use o painel lateral para criar um novo caso ou retomar um anterior</span>
          </div>
        ) : (
          <>
            <div className={styles.sessionHeader}>
              <span className={styles.sessionTitle}>{activeSession?.titulo || ''}</span>
              {activeSession?.summary && (
                <button className={styles.pdfBtn} onClick={handleDownloadPdf}>
                  ↓ Exportar PDF
                </button>
              )}
            </div>
            <AnalysisResult
              messages={messages}
              streaming={streaming}
              loading={loadingHistory}
              onFeedback={async (messageId, feedback, note) => {
                await submitFeedback(messageId, feedback, note);
                setMessages((prev) =>
                  prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
                );
              }}
            />
            <EntitiesPanel sessionId={activeSessionId} />
            <CaseInput
              sessionId={activeSessionId}
              usage={usage}
              onUsageUpdate={(updatedUsage) => setUsage(updatedUsage)}
              onAnalysisStart={(userContent) => {
                setMessages((prev) => [
                  ...prev,
                  { role: 'user', content: userContent },
                  { role: 'assistant', content: '', id: null },
                ]);
                setStreaming(true);
              }}
              onChunk={(chunk) => {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = { ...last, content: last.content + chunk };
                  return updated;
                });
              }}
              onAnalysisDone={() => {
                const capturedId = activeSessionId;
                setStreaming(false);
                refreshUsage();
                getSession(capturedId)
                  .then((data) => {
                    setActiveSessionId((current) => {
                      if (current !== capturedId) return current;
                      setActiveSession(data.session);
                      const msgs = data.messages;
                      if (msgs.length > 0) {
                        const last = msgs[msgs.length - 1];
                        setMessages((prev) => {
                          const updated = [...prev];
                          updated[updated.length - 1] = { ...updated[updated.length - 1], id: last.id };
                          return updated;
                        });
                      }
                      return current;
                    });
                  })
                  .catch(console.error);
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CaseInput from '../components/CaseInput';
import AnalysisResult from '../components/AnalysisResult';
import UsageCounter from '../components/UsageCounter';
import Coachmark from '../components/Coachmark';
import ProntuarioModal from '../components/ProntuarioModal';
import ClinicalToolsPanel from '../components/ClinicalToolsPanel';
import PlantaoQuickActions from '../components/PlantaoQuickActions';
import Sheet from '../components/Sheet';
import useMediaQuery from '../utils/useMediaQuery';
import { getSession, createSession, submitFeedback, getUsage, downloadSessionPdf, getSessionEntities, gerarProntuario } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.scss';

// Um só traçado para os três ícones da barra: nada de vocabulário misturado
function Icon({ path, circles }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path && <path d={path} />}
      {circles?.map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="1.4" fill="currentColor" stroke="none" />)}
    </svg>
  );
}

const ICON_MENU = 'M3 6h18M3 12h18M3 18h18';
const ICON_SEARCH = 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4.1-4.1';

function EntitiesContent({ entities, loading, error }) {
  const total = entities ? entities.diagnosticos.length + entities.medicamentos.length : 0;

  return (
    <div className={styles.entitiesBody}>
      {loading && <span className={styles.entitiesLoading}>Buscando achados...</span>}
      {error && <span className={styles.entitiesError}>Não foi possível carregar os achados. Tente novamente.</span>}
      {entities !== null && total === 0 && !loading && (
        <span className={styles.entitiesInfo}>Nenhum diagnóstico ou medicamento identificado neste caso.</span>
      )}
      {entities && entities.diagnosticos.length > 0 && (
        <div className={styles.entitiesGroup}>
          <span className={styles.entitiesLabel}>Diagnósticos</span>
          <div className={styles.entitiesTags}>
            {entities.diagnosticos.map((d, i) => (
              <span
                key={i}
                className={styles.tagDiag}
                style={{ animationDelay: `${i * 40}ms` }}
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
                style={{ animationDelay: `${(entities.diagnosticos.length + i) * 40}ms` }}
                title={m.status === 'pending' ? 'Aguardando revisão' : 'Verificado'}
              >
                {m.nome}{m.classe ? ` · ${m.classe}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EntitiesPanel({ sessionId, prefetchedEntities, variant = 'panel' }) {
  const inSheet = variant === 'sheet';
  const [open, setOpen] = useState(inSheet);
  const [entities, setEntities] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setOpen(inSheet);
    setEntities(null);
    setLoading(false);
    setError(null);
  }, [sessionId, inSheet]);

  useEffect(() => {
    if (prefetchedEntities !== null) {
      setEntities((prev) => prev ?? prefetchedEntities);
    }
  }, [prefetchedEntities]);

  async function load() {
    if (!sessionId) return;
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

  // no sheet os achados já aparecem abertos: quem abriu veio buscar exatamente isso
  useEffect(() => {
    if (inSheet && entities === null && !loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inSheet, sessionId]);

  async function handleToggle() {
    if (!open && entities === null) await load();
    setOpen((prev) => !prev);
  }

  if (inSheet) {
    return <EntitiesContent entities={entities} loading={loading} error={error} />;
  }

  const total = entities ? entities.diagnosticos.length + entities.medicamentos.length : 0;

  return (
    <div className={styles.entitiesPanel} data-coachmark="entities">
      <button
        className={styles.entitiesToggle}
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls="entities-body"
      >
        <span
          aria-hidden="true"
          className={`${styles.entitiesChevron}${open ? ` ${styles.entitiesChevronOpen}` : ''}`}
        >▾</span>
        Achados identificados{entities !== null ? ` (${total})` : ''}
      </button>
      <div
        id="entities-body"
        className={`${styles.entitiesBodyWrapper}${open ? ` ${styles.entitiesBodyWrapperOpen}` : ''}`}
      >
        <div className={styles.entitiesBodyInner}>
          <EntitiesContent entities={entities} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, token, saveAuth, refreshUser } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage] = useState(null);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showSessionTour, setShowSessionTour] = useState(false);
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [prefetchedEntities, setPrefetchedEntities] = useState(null);
  const [prontuarioOpen, setProntuarioOpen] = useState(false);
  const [prontuarioLoading, setProntuarioLoading] = useState(false);
  const [prontuarioTexto, setProntuarioTexto] = useState(null);
  const [prontuarioError, setProntuarioError] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sheet, setSheet] = useState(null); // null | 'quick' | 'actions'

  const hasAnalysis = messages.some((m) => m.role === 'assistant' && m.content);

  // ao voltar para o desktop nada fica preso num sheet que não existe mais
  useEffect(() => {
    if (!isMobile) setSheet(null);
  }, [isMobile]);

  useEffect(() => {
    if (user?.plan === 'free') {
      getUsage().then(setUsage).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const localSeen = localStorage.getItem('coachmark_welcome_seen');
    if (user && !user.coachmarks_welcome_seen && !localSeen) {
      setShowWelcomeTour(true);
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      refreshUser();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateNewCase();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleCreateNewCase() {
    try {
      const session = await createSession('Novo caso');
      handleNewSession(session.id);
    } catch (err) {
      console.error('Erro ao criar sessão:', err.message);
    }
  }

  async function refreshUsage() {
    if (user?.plan === 'free') {
      getUsage().then(setUsage).catch(() => {});
    }
  }

  async function handleSelectSession(id) {
    setSheet(null);
    setActiveSessionId(id);
    setActiveSession(null);
    setMessages([]);
    setStreaming(false);
    setLoadingHistory(true);
    setUserMsgCount(0);
    setPdfError(null);
    setPrefetchedEntities(null);
    setProntuarioOpen(false);
    setProntuarioTexto(null);
    setProntuarioError(null);
    try {
      const data = await getSession(id);
      setMessages(data.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, feedback: m.feedback })));
      setUserMsgCount(data.messages.filter((m) => m.role === 'user').length);
      setActiveSession(data.session);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  function handleNewSession(id) {
    setSheet(null);
    setActiveSessionId(id);
    setActiveSession({ titulo: 'Novo caso', summary: null });
    setMessages([]);
    setStreaming(false);
    setLoadingHistory(false);
    setUserMsgCount(0);
    setPrefetchedEntities(null);
    setProntuarioOpen(false);
    setProntuarioTexto(null);
    setProntuarioError(null);
    setSidebarOpen(false);
    const localSessionSeen = localStorage.getItem('coachmark_session_seen');
    if (user && !user.coachmarks_session_seen && !localSessionSeen) {
      setShowSessionTour(true);
    }
  }

  function handleSessionDeleted(deletedId) {
    if (deletedId === activeSessionId) {
      setActiveSessionId(null);
      setActiveSession(null);
      setMessages([]);
    }
  }

  async function handleProntuario() {
    setSheet(null);
    setProntuarioOpen(true);
    setProntuarioLoading(true);
    setProntuarioError(null);
    try {
      const { prontuario } = await gerarProntuario(activeSessionId);
      setProntuarioTexto(prontuario);
    } catch (err) {
      setProntuarioError(err.message || 'Erro ao gerar resumo.');
    } finally {
      setProntuarioLoading(false);
    }
  }

  async function handleDownloadPdf() {
    setSheet(null);
    setPdfLoading(true);
    setPdfError(null);
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
      setPdfError('Não foi possível exportar o PDF. Tente novamente.');
    } finally {
      setPdfLoading(false);
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
              target: 'new-case',
              title: 'Painel lateral',
              text: 'Crie um novo caso clínico pelo botão "+ Novo caso" ou retome um anterior.',
            },
          ]}
          onDone={() => {
            setShowWelcomeTour(false);
            localStorage.setItem('coachmark_welcome_seen', '1');
            if (user && token) saveAuth(token, { ...user, coachmarks_welcome_seen: true });
          }}
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
              text: 'Avalie cada resposta como útil ou incorreta. Feedbacks negativos revisados pela equipe podem render análises extras.',
            },
            isMobile
              ? {
                  target: 'case-actions',
                  title: 'Ações do caso',
                  text: 'Achados identificados, ferramentas clínicas, resumo para prontuário e exportação ficam todos aqui.',
                }
              : {
                  target: 'entities',
                  title: 'Achados identificados',
                  text: 'Clique para ver diagnósticos e medicamentos detectados automaticamente no caso.',
                },
          ]}
          onDone={() => {
            setShowSessionTour(false);
            localStorage.setItem('coachmark_session_seen', '1');
            if (user && token) saveAuth(token, { ...user, coachmarks_session_seen: true });
          }}
        />
      )}

      <main className={styles.main}>
        {/* Barra única do mobile: menu, identidade do caso e uma porta para tudo
            que é secundário. Nada mais compete com a leitura da resposta. */}
        <header className={styles.mobileHeader}>
          <button
            className={styles.iconBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Icon path={ICON_MENU} />
          </button>

          {activeSessionId && messages.length > 0 && activeSession?.titulo && activeSession.titulo !== 'Novo caso' ? (
            <span className={styles.mobileTitle}>{activeSession.titulo}</span>
          ) : (
            <span className={styles.mobileBrand}>Conduta</span>
          )}

          <button
            className={styles.iconBtn}
            onClick={() => setSheet('quick')}
            aria-label="Buscar protocolos e calculadoras"
          >
            <Icon path={ICON_SEARCH} />
          </button>

          {activeSessionId && (
            <button
              className={styles.iconBtn}
              onClick={() => setSheet('actions')}
              aria-label="Ações do caso"
              data-coachmark="case-actions"
            >
              <Icon circles={[[5, 12], [12, 12], [19, 12]]} />
            </button>
          )}
        </header>

        {!isMobile && <PlantaoQuickActions onNewCase={handleCreateNewCase} />}

        {!activeSessionId ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">⚕</div>
            <p>Pronto para seu próximo caso</p>
            <span>Descreva o caso como em um prontuário e receba análise clínica em segundos.</span>
            <button className={styles.emptyBtn} onClick={handleCreateNewCase}>
              + Novo caso
            </button>
            <span className={styles.emptyHint}>ou pressione <kbd className={styles.kbd}>Ctrl+N</kbd></span>
          </div>
        ) : (
          <>
            {!isMobile && (
              <>
                <div className={styles.sessionHeader}>
                  <span className={styles.sessionTitle}>{activeSession?.titulo || ''}</span>
                  {hasAnalysis && !streaming && (
                    <button
                      className={styles.pdfBtn}
                      onClick={handleProntuario}
                      aria-label="Gerar resumo para prontuário"
                      disabled={prontuarioLoading}
                    >
                      {prontuarioLoading ? 'Gerando...' : '⎘ Resumo p/ prontuário'}
                    </button>
                  )}
                  {activeSession?.summary && (
                    <>
                      <button
                        className={styles.pdfBtn}
                        onClick={handleDownloadPdf}
                        aria-label="Exportar caso como PDF"
                        disabled={pdfLoading}
                      >
                        {pdfLoading ? 'Exportando...' : '↓ Exportar PDF'}
                      </button>
                      {pdfError && (
                        <span className={styles.pdfError} role="alert">{pdfError}</span>
                      )}
                    </>
                  )}
                </div>
                <ClinicalToolsPanel sessionId={activeSessionId} hasAnalysis={hasAnalysis} />
              </>
            )}
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
            {!isMobile && (
              <EntitiesPanel sessionId={activeSessionId} prefetchedEntities={prefetchedEntities} />
            )}
            {isMobile && pdfError && (
              <div className={styles.mobileError} role="alert">{pdfError}</div>
            )}
            {userMsgCount >= 16 && (
              <div className={styles.bannerCritico} role="alert">
                <span>Sessão longa — considere iniciar uma nova sessão para manter a precisão das respostas.</span>
                <button
                  className={styles.bannerBtn}
                  onClick={() => {
                    setActiveSessionId(null);
                    setActiveSession(null);
                    setMessages([]);
                    setStreaming(false);
                    setUserMsgCount(0);
                  }}
                >
                  Nova sessão
                </button>
              </div>
            )}
            {userMsgCount >= 8 && userMsgCount < 16 && (
              <div className={styles.bannerAviso} role="status">
                Contexto truncado — apenas as últimas mensagens são enviadas ao modelo.
              </div>
            )}
            <CaseInput
              sessionId={activeSessionId}
              usage={usage}
              onUsageUpdate={(updatedUsage) => setUsage(updatedUsage)}
              onSessionMsgCount={(count) => setUserMsgCount(count)}
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
                getSessionEntities(capturedId)
                  .then((data) => {
                    setActiveSessionId((current) => {
                      if (current !== capturedId) return current;
                      setPrefetchedEntities(data);
                      return current;
                    });
                  })
                  .catch(() => {});
              }}
            />
          </>
        )}

        {prontuarioOpen && (
          <ProntuarioModal
            texto={prontuarioTexto}
            loading={prontuarioLoading}
            error={prontuarioError}
            onClose={() => setProntuarioOpen(false)}
            onRetry={handleProntuario}
          />
        )}

        {isMobile && sheet === 'quick' && (
          <Sheet title="Acesso rápido" onClose={() => setSheet(null)}>
            <PlantaoQuickActions
              variant="sheet"
              onNewCase={() => {
                setSheet(null);
                handleCreateNewCase();
              }}
            />
          </Sheet>
        )}

        {isMobile && sheet === 'actions' && activeSessionId && (
          <Sheet title="Ações do caso" onClose={() => setSheet(null)}>
            <Sheet.Section label="Exportar">
              <Sheet.Item
                label={prontuarioLoading ? 'Gerando resumo...' : 'Resumo p/ prontuário'}
                hint="Texto pronto para colar no sistema do hospital"
                onClick={handleProntuario}
                disabled={!hasAnalysis || streaming || prontuarioLoading}
              />
              <Sheet.Item
                label={pdfLoading ? 'Exportando...' : 'Exportar PDF'}
                hint={activeSession?.summary ? 'Caso completo com fontes' : 'Disponível após a primeira análise'}
                onClick={handleDownloadPdf}
                disabled={!activeSession?.summary || pdfLoading}
              />
            </Sheet.Section>

            {hasAnalysis && (
              <Sheet.Section label="Ferramentas clínicas">
                {/* o sheet segue montado: a ferramenta abre por cima dele e,
                    ao fechar, o médico volta para a lista de onde saiu */}
                <ClinicalToolsPanel
                  sessionId={activeSessionId}
                  hasAnalysis={hasAnalysis}
                  variant="sheet"
                />
              </Sheet.Section>
            )}

            <Sheet.Section label="Achados identificados">
              <EntitiesPanel
                sessionId={activeSessionId}
                prefetchedEntities={prefetchedEntities}
                variant="sheet"
              />
            </Sheet.Section>

            <Sheet.Section label="Sobre">
              <p className={styles.sheetDisclaimer}>
                As análises do Conduta são sugestões de apoio clínico. A decisão final é sempre
                responsabilidade do profissional.
              </p>
              <p className={styles.sheetLinks}>
                <a href="/termos" target="_blank" rel="noreferrer">Termos de Uso</a>
                {' · '}
                <a href="/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a>
              </p>
            </Sheet.Section>
          </Sheet>
        )}

        {/* No mobile o rodapé guarda só o contador de uso: o aviso legal continua
            sob cada resposta e por extenso no sheet de ações, e truncá-lo numa
            faixa de 10px seria pior do que não repeti-lo. */}
        {(!isMobile || usage) && (
          <footer className={styles.footer}>
            <div className={styles.footerRow}>
              {usage && <UsageCounter used={usage.used} limit={usage.limit} compact />}
              <span className={styles.footerDisclaimer}>
                <span aria-hidden="true">⚕</span>
                {' '}As análises do Conduta são sugestões de apoio clínico. A decisão final é sempre responsabilidade do profissional.
              </span>
              <span className={styles.footerLinks}>
                <a href="/termos" target="_blank" rel="noreferrer">Termos de Uso</a>
                {' · '}
                <a href="/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a>
              </span>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}

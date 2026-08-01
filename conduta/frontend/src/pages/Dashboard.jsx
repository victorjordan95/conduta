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

// Vive dentro do Sheet de ações. Carrega ao montar: quem abriu a seção veio
// buscar exatamente isto, não faz sentido pedir mais um clique.
function EntitiesPanel({ sessionId, prefetchedEntities }) {
  const [entities, setEntities] = useState(prefetchedEntities);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (entities !== null || !sessionId) return;
    let cancelado = false;
    setLoading(true);
    getSessionEntities(sessionId)
      .then((data) => { if (!cancelado) setEntities(data); })
      .catch(() => { if (!cancelado) setError('Erro ao carregar entidades.'); })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

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
  const [sheetAnchor, setSheetAnchor] = useState(null);

  const hasAnalysis = messages.some((m) => m.role === 'assistant' && m.content);

  // "Novo caso" é o título provisório do backend: só vira identidade da barra
  // depois que a análise nomeia o caso
  const caseTitle = activeSessionId && messages.length > 0
    && activeSession?.titulo && activeSession.titulo !== 'Novo caso'
    ? activeSession.titulo
    : null;

  function openSheet(which, anchorEl) {
    // o menu ancorado é um recurso de mouse: no mobile tudo sobe como sheet
    setSheetAnchor(!isMobile && anchorEl ? anchorEl.getBoundingClientRect() : null);
    setSheet(which);
  }

  // uma superfície reposiciona conforme o dispositivo em vez de existirem duas
  const quickPlacement = isMobile ? 'bottom' : 'center';
  const actionsPlacement = isMobile ? 'bottom' : 'anchor';

  // ao trocar de breakpoint a âncora medida deixa de valer
  useEffect(() => {
    setSheet(null);
    setSheetAnchor(null);
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
      const editing = tag === 'INPUT' || tag === 'TEXTAREA'
        || document.activeElement?.isContentEditable;
      if (editing) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNewCase();
      }
      // atalho da paleta: mesmo gesto que o botão de busca da barra
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setSheetAnchor(null);
        setSheet('quick');
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
            {
              target: 'case-actions',
              title: 'Ações do caso',
              text: 'Achados identificados, ferramentas clínicas, resumo para prontuário e exportação ficam todos aqui.',
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
        {/* Barra única: identidade do caso e duas portas — busca e ações. Tudo
            que é secundário mora atrás delas, nada compete com a leitura. */}
        <header className={styles.topBar}>
          <button
            className={`${styles.barBtn} ${styles.menuBtn}`}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Icon path={ICON_MENU} />
          </button>

          {caseTitle ? (
            <span className={styles.barTitle}>{caseTitle}</span>
          ) : (
            <span className={styles.barBrand}>Conduta</span>
          )}

          <button
            className={styles.barBtn}
            onClick={() => openSheet('quick')}
            aria-label="Buscar protocolos e calculadoras"
            title="Buscar protocolos e calculadoras (Ctrl+K)"
          >
            <Icon path={ICON_SEARCH} />
            <span className={styles.barBtnLabel}>Buscar</span>
          </button>

          {activeSessionId && (
            <button
              className={styles.barBtn}
              onClick={(e) => openSheet('actions', e.currentTarget)}
              aria-label="Ações do caso"
              aria-haspopup="dialog"
              data-coachmark="case-actions"
            >
              <Icon circles={[[5, 12], [12, 12], [19, 12]]} />
              <span className={styles.barBtnLabel}>Ações</span>
            </button>
          )}
        </header>

        {!activeSessionId ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">⚕</div>
            <p>Pronto para seu próximo caso</p>
            <span>Descreva o caso como em um prontuário e receba análise clínica em segundos.</span>
            <button className={styles.emptyBtn} onClick={handleCreateNewCase}>
              + Novo caso
            </button>
            {/* com o cartão de acesso rápido fora do topo, a paleta precisa
                aparecer em algum lugar: aqui, onde o médico está parado */}
            <span className={styles.emptyHint}>
              <kbd className={styles.kbd}>Ctrl+N</kbd> novo caso
              {' · '}
              <kbd className={styles.kbd}>Ctrl+K</kbd> protocolos e calculadoras
            </span>
          </div>
        ) : (
          <>
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
            {pdfError && (
              <div className={styles.barError} role="alert">{pdfError}</div>
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

        {sheet === 'quick' && (
          <Sheet title="Acesso rápido" placement={quickPlacement} onClose={() => setSheet(null)}>
            <PlantaoQuickActions
              variant="sheet"
              autoFocusSearch={!isMobile}
              onNewCase={() => {
                setSheet(null);
                handleCreateNewCase();
              }}
            />
          </Sheet>
        )}

        {sheet === 'actions' && activeSessionId && (
          <Sheet
            title="Ações do caso"
            placement={actionsPlacement}
            anchorRect={sheetAnchor}
            onClose={() => setSheet(null)}
          >
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
                <ClinicalToolsPanel sessionId={activeSessionId} hasAnalysis={hasAnalysis} />
              </Sheet.Section>
            )}

            <Sheet.Section label="Achados identificados">
              <EntitiesPanel sessionId={activeSessionId} prefetchedEntities={prefetchedEntities} />
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

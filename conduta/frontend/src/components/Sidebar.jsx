import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSessions, createSession, renameSession, deleteSession } from '../services/api';
import { createCheckoutSession, getBillingPortalUrl } from '../services/api';
import styles from './Sidebar.module.scss';

export default function Sidebar({ activeSessionId, onSelectSession, onNewSession, onSessionDeleted, isOpen, onClose }) {
  const { user, clearAuth } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingTitulo, setEditingTitulo] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [sidebarError, setSidebarError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (!sidebarError) return;
    const t = setTimeout(() => setSidebarError(null), 4000);
    return () => clearTimeout(t);
  }, [sidebarError]);

  async function handleUpgrade() {
    setBillingLoading(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setSidebarError('Não foi possível abrir o pagamento. Tente novamente.');
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleManageSubscription() {
    setBillingLoading(true);
    try {
      const { url } = await getBillingPortalUrl();
      window.location.href = url;
    } catch (err) {
      setSidebarError('Não foi possível abrir o portal. Tente novamente.');
    } finally {
      setBillingLoading(false);
    }
  }

  useEffect(() => {
    getSessions().then(setSessions).catch(console.error);
  }, [activeSessionId]);

  useEffect(() => {
    if (!menuOpenId) return;
    function handleClick() { setMenuOpenId(null); }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpenId]);

  async function handleNewCase() {
    try {
      const session = await createSession('Novo caso');
      setSessions((prev) => [session, ...prev]);
      onNewSession(session.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRename(id, titulo) {
    const t = titulo !== undefined ? titulo : editingTitulo.trim();
    setEditingId(null);
    if (!t) return;
    try {
      const updated = await renameSession(id, t);
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, titulo: updated.titulo } : s)));
    } catch (err) {
      setSidebarError('Não foi possível renomear o caso. Tente novamente.');
      console.error(err);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      onSessionDeleted?.(id);
    } catch (err) {
      setSidebarError('Não foi possível excluir o caso. Tente novamente.');
      console.error(err);
    }
  }

  const sessoesFiltradas = search.trim()
    ? sessions.filter((s) => s.titulo.toLowerCase().includes(search.trim().toLowerCase()))
    : sessions;

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} data-coachmark="sidebar">
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>Conduta</h1>
            <p>Apoio clínico</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar menu">
            &#x2715;
          </button>
        </div>
      </div>

      <button className={styles.newCase} onClick={handleNewCase} data-coachmark="new-case">
        + Novo caso
      </button>

      {user?.role === 'admin' && (
        <Link
          to="/protocolos"
          className={`${styles.protocolosLink} ${location.pathname.startsWith('/protocolos') ? styles.protocolosLinkActive : ''}`}
          onClick={onClose}
        >
          ⚡ Protocolos
        </Link>
      )}

      <input
        className={styles.searchInput}
        type="text"
        placeholder="Buscar caso..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className={styles.sectionLabel}>Casos anteriores</div>

      <div className={styles.list}>
        {sessoesFiltradas.map((s) => (
          <div
            key={s.id}
            className={`${styles.item} ${s.id === activeSessionId ? styles.active : ''}`}
            onClick={() => { if (editingId !== s.id) onSelectSession(s.id); }}
          >
            <div className={styles.itemInner}>
              {editingId === s.id ? (
                <input
                  className={styles.editInput}
                  value={editingTitulo}
                  autoFocus
                  onChange={(e) => setEditingTitulo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const titulo = editingTitulo.trim();
                      setEditingTitulo('');
                      handleRename(s.id, titulo);
                    }
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={() => handleRename(s.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className={styles.itemTitle} title={s.titulo}>{s.titulo}</span>
                  <button
                    className={`${styles.menuBtn} ${(s.id === activeSessionId || s.id === menuOpenId) ? styles.menuBtnVisible : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === s.id ? null : s.id);
                    }}
                    title="Opções"
                  >
                    ⋯
                  </button>
                  {menuOpenId === s.id && (
                    <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                      {deleteConfirmId === s.id ? (
                        <div className={styles.deleteConfirm}>
                          <span className={styles.deleteConfirmLabel}>Excluir este caso?</span>
                          <div className={styles.deleteConfirmBtns}>
                            <button onClick={() => { setDeleteConfirmId(null); setMenuOpenId(null); }}>Cancelar</button>
                            <button
                              className={styles.deleteConfirmYes}
                              onClick={() => { setDeleteConfirmId(null); setMenuOpenId(null); handleDelete(s.id); }}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              setEditingId(s.id);
                              setEditingTitulo(s.titulo);
                            }}
                          >
                            Renomear
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(s.id)}
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {sessoesFiltradas.length === 0 && search.trim() && (
          <p style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: 'rgba(176,196,204,0.5)' }}>
            Nenhum caso encontrado.
          </p>
        )}
      </div>

      <div className={styles.footer}>
        {sidebarError && (
          <div className={styles.sidebarError} role="alert">{sidebarError}</div>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin/knowledge" className={styles.adminLink}>
            Painel de administração
          </Link>
        )}
        {user?.role !== 'admin' && user?.plan === 'free' && (
          <button
            className={styles.upgradeBtn}
            onClick={handleUpgrade}
            disabled={billingLoading}
          >
            {billingLoading ? 'Aguarde...' : 'Assinar Pro'}
          </button>
        )}
        {user?.role !== 'admin' && user?.plan === 'pro' && (
          <button
            className={styles.manageBtn}
            onClick={handleManageSubscription}
            disabled={billingLoading}
          >
            {billingLoading ? '...' : 'Gerenciar assinatura'}
          </button>
        )}
        <div className={styles.footerUser}>
          <span className={styles.userName}>{user?.nome}</span>
          <button className={styles.logoutBtn} onClick={clearAuth}>
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}

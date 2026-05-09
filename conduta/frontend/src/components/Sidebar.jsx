import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSessions, createSession, renameSession, deleteSession } from '../services/api';
import styles from './Sidebar.module.scss';

export default function Sidebar({ activeSessionId, onSelectSession, onNewSession, onSessionDeleted, isOpen, onClose }) {
  const { user, clearAuth } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingTitulo, setEditingTitulo] = useState('');

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
      window.alert('Erro ao renomear sessão. Tente novamente.');
      console.error(err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este caso? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      onSessionDeleted?.(id);
    } catch (err) {
      window.alert('Erro ao excluir sessão. Tente novamente.');
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
                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          setEditingId(s.id);
                          setEditingTitulo(s.titulo);
                        }}
                      >
                        ✏️ Renomear
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          handleDelete(s.id);
                        }}
                      >
                        🗑️ Excluir
                      </button>
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
        <span className={styles.userName}>{user?.nome}</span>
        <button className={styles.logoutBtn} onClick={clearAuth}>
          Sair
        </button>
      </div>
    </aside>
  );
}

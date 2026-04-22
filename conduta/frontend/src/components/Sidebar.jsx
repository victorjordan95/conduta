import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSessions, createSession } from '../services/api';
import styles from './Sidebar.module.scss';

export default function Sidebar({ activeSessionId, onSelectSession, isOpen, onClose }) {
  const { user, clearAuth } = useAuth();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(console.error);
  }, []);

  useEffect(() => {
    getSessions().then(setSessions).catch(console.error);
  }, [activeSessionId]);

  async function handleNewCase() {
    try {
      const session = await createSession('Novo caso');
      setSessions((prev) => [session, ...prev]);
      onSelectSession(session.id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
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

      <button className={styles.newCase} onClick={handleNewCase}>
        + Novo caso
      </button>

      <div className={styles.sectionLabel}>Casos anteriores</div>

      <div className={styles.list}>
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`${styles.item} ${s.id === activeSessionId ? styles.active : ''}`}
            onClick={() => onSelectSession(s.id)}
            title={s.titulo}
          >
            {s.titulo}
          </div>
        ))}
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

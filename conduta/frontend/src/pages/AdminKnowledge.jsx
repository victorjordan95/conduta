import { useEffect, useRef, useState } from 'react';
import { getPendingKnowledge, approveKnowledge, rejectKnowledge, listDocuments, uploadDocument, getFeedbackStats, getAdminFeedbacks, deactivateAdminFeedback, getAdminUsers, updateUserPlan, updateUserStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './AdminKnowledge.module.scss';

function UsersPanel({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [rowMessages, setRowMessages] = useState({});
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchUsers('');
  }, []);

  function fetchUsers(q) {
    setLoading(true);
    getAdminUsers(q)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function handleSearchChange(e) {
    const q = e.target.value;
    setSearch(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(q), 300);
  }

  function setRowMessage(userId, type, text) {
    setRowMessages((prev) => ({ ...prev, [userId]: { type, text } }));
    setTimeout(() => {
      setRowMessages((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }, 3000);
  }

  async function handleTogglePlan(u) {
    const novoPlan = u.plan === 'free' ? 'pro' : 'free';
    setActionLoading((prev) => ({ ...prev, [u.id]: 'plan' }));
    try {
      const updated = await updateUserPlan(u.id, novoPlan);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, plan: updated.plan } : x)));
      setRowMessage(u.id, 'success', `Plano alterado para ${updated.plan}.`);
    } catch (err) {
      setRowMessage(u.id, 'error', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [u.id]: null }));
    }
  }

  async function handleToggleStatus(u) {
    if (!u.active) {
      setActionLoading((prev) => ({ ...prev, [u.id]: 'status' }));
      try {
        const updated = await updateUserStatus(u.id, true);
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active: updated.active } : x)));
        setRowMessage(u.id, 'success', 'Usuário reativado.');
      } catch (err) {
        setRowMessage(u.id, 'error', err.message);
      } finally {
        setActionLoading((prev) => ({ ...prev, [u.id]: null }));
      }
      return;
    }

    if (!confirm(`Desativar ${u.nome}? O acesso será bloqueado imediatamente.`)) return;
    setActionLoading((prev) => ({ ...prev, [u.id]: 'status' }));
    try {
      const updated = await updateUserStatus(u.id, false);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active: updated.active } : x)));
      setRowMessage(u.id, 'success', 'Usuário desativado.');
    } catch (err) {
      setRowMessage(u.id, 'error', err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [u.id]: null }));
    }
  }

  return (
    <section className={styles.usersPanel}>
      <h2 className={styles.sectionTitle}>Usuários ({users.length})</h2>

      <input
        className={styles.searchInput}
        type="text"
        placeholder="Buscar por nome ou email"
        value={search}
        onChange={handleSearchChange}
      />

      {loading ? (
        <p className={styles.info}>Carregando usuários...</p>
      ) : users.length === 0 ? (
        <p className={styles.info}>Nenhum usuário encontrado.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const busy = actionLoading[u.id];
              const msg = rowMessages[u.id];
              return (
                <tr key={u.id} className={!u.active ? styles.rowInactive : ''}>
                  <td className={styles.nome}>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={u.plan === 'pro' ? styles.badgeActive : styles.badgePlan}>
                      {u.plan}
                    </span>
                  </td>
                  <td>
                    <span className={u.active ? styles.badgeActive : styles.badgeInactive}>
                      {u.active ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td className={styles.date}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className={styles.actions}>
                    {msg && (
                      <span className={msg.type === 'error' ? styles.rowError : styles.rowSuccess}>
                        {msg.text}
                      </span>
                    )}
                    <button
                      className={styles.planBtn}
                      onClick={() => handleTogglePlan(u)}
                      disabled={isSelf || !!busy}
                      title={isSelf ? 'Não é possível alterar o próprio plano' : ''}
                    >
                      {busy === 'plan' ? '...' : u.plan === 'free' ? '→ pro' : '→ free'}
                    </button>
                    <button
                      className={u.active ? styles.rejectBtn : styles.approveBtn}
                      onClick={() => handleToggleStatus(u)}
                      disabled={isSelf || !!busy}
                      title={isSelf ? 'Não é possível alterar o próprio status' : ''}
                    >
                      {busy === 'status' ? '...' : u.active ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

function DocumentsPanel() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fonte, setFonte] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    setLoading(true);
    try {
      const data = await listDocuments();
      setDocs(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !fonte.trim()) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const result = await uploadDocument(file, fonte.trim());
      setUploadSuccess(`${result.chunks} chunks importados de "${result.fonte}".`);
      setFonte('');
      setFile(null);
      e.target.reset();
      loadDocs();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className={styles.docsPanel}>
      <h2 className={styles.sectionTitle}>Documentos Clínicos (RAG)</h2>

      <form className={styles.uploadForm} onSubmit={handleUpload}>
        <input
          className={styles.uploadInput}
          type="text"
          placeholder="Nome da fonte (ex: PCDT Asma 2023)"
          value={fonte}
          onChange={(e) => setFonte(e.target.value)}
          disabled={uploading}
        />
        <input
          className={styles.fileInput}
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0] || null)}
          disabled={uploading}
        />
        <button
          className={styles.uploadBtn}
          type="submit"
          disabled={uploading || !file || !fonte.trim()}
        >
          {uploading ? 'Importando...' : 'Importar PDF'}
        </button>
      </form>

      {uploadError && <p className={styles.error}>{uploadError}</p>}
      {uploadSuccess && <p className={styles.success}>{uploadSuccess}</p>}

      {loading ? (
        <p className={styles.info}>Carregando documentos...</p>
      ) : docs.length === 0 ? (
        <p className={styles.info}>Nenhum documento importado ainda.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fonte</th>
              <th>Chunks</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.fonte}>
                <td className={styles.nome}>{d.fonte}</td>
                <td>{d.chunks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function AdminKnowledge() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(new Set());
  const [stats, setStats] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCorrections, setLoadingCorrections] = useState(true);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    getFeedbackStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));

    getAdminFeedbacks()
      .then((data) => setCorrections(data.corrections))
      .catch(() => {})
      .finally(() => setLoadingCorrections(false));
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingKnowledge();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(elementId) {
    setProcessing((prev) => new Set(prev).add(elementId));
    try {
      await approveKnowledge(elementId);
      setItems((prev) => prev.filter((i) => i.elementId !== elementId));
    } catch (err) {
      alert('Erro ao aprovar: ' + err.message);
    } finally {
      setProcessing((prev) => { const s = new Set(prev); s.delete(elementId); return s; });
    }
  }

  async function handleDeactivate(nodeId) {
    try {
      await deactivateAdminFeedback(nodeId);
      setCorrections((prev) =>
        prev.map((c) => (c.nodeId === nodeId ? { ...c, status: 'inactive' } : c))
      );
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleReject(elementId) {
    if (!confirm('Rejeitar e remover este item?')) return;
    setProcessing((prev) => new Set(prev).add(elementId));
    try {
      await rejectKnowledge(elementId);
      setItems((prev) => prev.filter((i) => i.elementId !== elementId));
    } catch (err) {
      alert('Erro ao rejeitar: ' + err.message);
    } finally {
      setProcessing((prev) => { const s = new Set(prev); s.delete(elementId); return s; });
    }
  }

  return (
    <div className={styles.page}>
      <UsersPanel currentUserId={user?.id} />
      <header className={styles.header}>
        <h1>Base de Conhecimento</h1>
        <span className={styles.badge}>{items.length} pendentes</span>
        <button className={styles.refreshBtn} onClick={load} disabled={loading}>
          Atualizar
        </button>
      </header>

      {loading && <p className={styles.info}>Carregando...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && items.length === 0 && (
        <p className={styles.info}>Nenhum item pendente de revisão.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Nome</th>
              <th>CID</th>
              <th>Origem</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.elementId} className={processing.has(item.elementId) ? styles.dimmed : ''}>
                <td>
                  <span className={`${styles.tag} ${styles[item.tipo.toLowerCase()]}`}>
                    {item.tipo}
                  </span>
                </td>
                <td className={styles.nome}>{item.nome}</td>
                <td className={styles.cid}>{item.cid || '—'}</td>
                <td className={styles.session}>{item.sourceSessionId || '—'}</td>
                <td className={styles.date}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className={styles.actions}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleApprove(item.elementId)}
                    disabled={processing.has(item.elementId)}
                  >
                    Aprovar
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handleReject(item.elementId)}
                    disabled={processing.has(item.elementId)}
                  >
                    Rejeitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── ESTATÍSTICAS DE FEEDBACK ── */}
      <section className={styles.feedbackSection}>
        <h2 className={styles.sectionTitle}>Estatísticas de Feedback</h2>
        {loadingStats ? (
          <p className={styles.info}>Carregando...</p>
        ) : stats ? (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.summary.positive}</span>
              <span className={styles.statLabel}>👍 Positivos</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.summary.negative}</span>
              <span className={styles.statLabel}>👎 Negativos</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.summary.negativeWithNote}</span>
              <span className={styles.statLabel}>📝 Com nota</span>
            </div>
          </div>
        ) : (
          <p className={styles.info}>Sem dados.</p>
        )}
      </section>

      {/* ── CORREÇÕES REGISTRADAS ── */}
      <section className={styles.feedbackSection}>
        <h2 className={styles.sectionTitle}>Correções Registradas ({corrections.length})</h2>
        {loadingCorrections ? (
          <p className={styles.info}>Carregando...</p>
        ) : corrections.length === 0 ? (
          <p className={styles.info}>Nenhuma correção registrada.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nota</th>
                <th>Keywords</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {corrections.map((c) => (
                <tr key={c.nodeId} className={c.status === 'inactive' ? styles.rowInactive : ''}>
                  <td className={styles.correctionNota}>{c.nota?.slice(0, 120)}{c.nota?.length > 120 ? '…' : ''}</td>
                  <td className={styles.correctionKeywords}>{(c.keywords || []).slice(0, 5).join(', ')}</td>
                  <td>
                    <span className={c.status === 'active' ? styles.badgeActive : styles.badgeInactive}>
                      {c.status}
                    </span>
                  </td>
                  <td className={styles.date}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
                  <td>
                    {c.status === 'active' && (
                      <button className={styles.rejectBtn} onClick={() => handleDeactivate(c.nodeId)}>
                        Desativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <DocumentsPanel />
    </div>
  );
}

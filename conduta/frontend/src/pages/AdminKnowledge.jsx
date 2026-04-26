import { useEffect, useState } from 'react';
import { getPendingKnowledge, approveKnowledge, rejectKnowledge, listDocuments, uploadDocument } from '../services/api';
import styles from './AdminKnowledge.module.scss';

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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(new Set());

  useEffect(() => { load(); }, []);

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

      <DocumentsPanel />
    </div>
  );
}

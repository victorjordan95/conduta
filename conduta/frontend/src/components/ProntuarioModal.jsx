import { useState } from 'react';
import styles from './ProntuarioModal.module.scss';

export default function ProntuarioModal({ texto, loading, error, onClose, onRetry }) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível — usuário pode selecionar manualmente
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Resumo para prontuário"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Resumo para prontuário</h2>
          <button className={styles.close} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {loading && <p className={styles.status}>Gerando resumo da evolução...</p>}

        {error && (
          <div className={styles.errorBox}>
            <p className={styles.error} role="alert">{error}</p>
            <button className={styles.retry} onClick={onRetry}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && texto && (
          <>
            <pre className={styles.texto}>{texto}</pre>
            <div className={styles.actions}>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copiado ? 'Copiado ✓' : 'Copiar texto'}
              </button>
            </div>
            <p className={styles.aviso}>
              Revise o conteúdo antes de registrar no prontuário — a responsabilidade pelo registro é do profissional.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import styles from './ProntuarioModal.module.scss';

export default function ProntuarioModal({ texto, loading, error, onClose, onRetry }) {
  const [copiado, setCopiado] = useState(false);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    triggerRef.current = document.activeElement;
    closeRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus?.();
    };
  }, [onClose]);

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
          <button ref={closeRef} className={styles.close} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {loading && (
          <div className={styles.skeleton} role="status" aria-label="Gerando resumo da evolução">
            <div className={styles.skeletonLine} style={{ width: '42%' }} />
            <div className={styles.skeletonLine} style={{ width: '88%' }} />
            <div className={styles.skeletonLine} style={{ width: '74%' }} />
            <div className={styles.skeletonLine} style={{ width: '52%' }} />
            <div className={styles.skeletonLine} style={{ width: '81%' }} />
            <div className={styles.skeletonLine} style={{ width: '63%' }} />
          </div>
        )}

        {error && (
          <div className={styles.errorBox}>
            <p className={styles.error} role="alert">{error}</p>
            <button className={styles.retry} onClick={onRetry}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && texto && (
          <>
            <pre className={styles.texto} tabIndex={0}>{texto}</pre>
            <div className={styles.actions}>
              <button className={styles.copyBtn} onClick={handleCopy} aria-live="polite">
                {copiado ? 'Copiado ✓' : 'Copiar texto'}
              </button>
            </div>
            <p className={styles.aviso}>
              Revise o conteúdo antes de registrar no prontuário. A responsabilidade pelo registro é do profissional.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

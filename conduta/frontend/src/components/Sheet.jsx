import { useEffect, useRef } from 'react';
import styles from './Sheet.module.scss';

/**
 * Bottom sheet do mobile: uma única casa para tudo que é secundário,
 * com rótulos por extenso em vez de ícones espalhados pelo topo.
 */
export default function Sheet({ title, onClose, children }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.grabber} aria-hidden="true" />
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
            &#x2715;
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

Sheet.Section = function SheetSection({ label, children }) {
  return (
    <section className={styles.section}>
      {label && <h3 className={styles.sectionLabel}>{label}</h3>}
      {children}
    </section>
  );
};

Sheet.Item = function SheetItem({ label, hint, onClick, disabled }) {
  return (
    <button type="button" className={styles.item} onClick={onClick} disabled={disabled}>
      <span className={styles.itemLabel}>{label}</span>
      {hint && <span className={styles.itemHint}>{hint}</span>}
    </button>
  );
};

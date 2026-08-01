import { useEffect, useRef } from 'react';
import styles from './Sheet.module.scss';

/**
 * Uma casa só para tudo que é secundário, com rótulos por extenso em vez de
 * ícones espalhados pelo topo. O conteúdo é o mesmo nos três posicionamentos;
 * muda apenas onde a superfície aparece:
 *
 * - `bottom`  bottom sheet do mobile
 * - `center`  paleta de comando do desktop (Ctrl K)
 * - `anchor`  menu suspenso ancorado no botão que o abriu
 */
export default function Sheet({ title, onClose, placement = 'bottom', anchorRect, children }) {
  const closeRef = useRef(null);

  useEffect(() => {
    // só o bottom sheet leva o foco para o botão fechar: no menu ancorado ele
    // nem existe, e na paleta o conteúdo já foca o próprio campo de busca
    if (placement === 'bottom') closeRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, placement]);

  const anchorStyle = placement === 'anchor' && anchorRect
    ? { top: Math.round(anchorRect.bottom + 6), right: Math.round(window.innerWidth - anchorRect.right) }
    : undefined;

  return (
    <div className={`${styles.backdrop} ${styles[placement]}`} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.surface}
        style={anchorStyle}
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

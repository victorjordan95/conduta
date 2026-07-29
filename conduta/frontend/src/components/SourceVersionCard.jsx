import styles from './SourceVersionCard.module.scss';

const DEFAULT_NOTE = 'Material de apoio à decisão. Não substitui avaliação clínica ou protocolo institucional.';

export default function SourceVersionCard({
  referencia,
  atualizadoEm,
  referenciaUrl,
  notaSeguranca,
}) {
  return (
    <section className={styles.card} aria-label="Fonte e versão">
      <div className={styles.header}>
        <span className={styles.label}>Fonte e versão</span>
        {atualizadoEm && <span className={styles.version}>Última revisão editorial: {atualizadoEm}</span>}
      </div>

      {referencia && (
        <div className={styles.reference}>
          <span className={styles.referenceLabel}>Referência clínica</span>
          <span className={styles.referenceText}>{referencia}</span>
          {referenciaUrl && (
            <a
              className={styles.sourceLink}
              href={referenciaUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Abrir ${referencia}`}
            >
              Abrir fonte ↗
            </a>
          )}
        </div>
      )}

      <p className={styles.note}>{notaSeguranca || DEFAULT_NOTE}</p>
    </section>
  );
}

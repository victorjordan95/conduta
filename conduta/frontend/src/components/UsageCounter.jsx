import styles from './UsageCounter.module.scss';

export default function UsageCounter({ used, limit, compact }) {
  if (limit === null) return null;

  const pct = Math.min((used / limit) * 100, 100);
  const danger = used >= limit - 2;

  return (
    <div className={compact ? styles.containerCompact : styles.container}>
      <span className={styles.label}>
        {used} / {limit} análises este mês
      </span>
      <div className={styles.track}>
        <div
          className={`${styles.bar} ${danger ? styles.barDanger : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { calculadoras } from '../data/calculadoras';
import styles from './Calculadoras.module.scss';

function IconeChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export default function Calculadoras() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.backLink}>
            <IconeChevron />
            Conduta
          </Link>
          <span className={styles.headerDivisor} aria-hidden="true" />
          <div>
            <h1 className={styles.titulo}>Calculadoras clínicas</h1>
            <p className={styles.subtitulo}>Ferramentas rápidas para apoiar a revisão clínica</p>
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.intro}>
          <p>
            Resultados calculados por fórmulas explícitas, sem IA e sem envio dos dados.
            Confira sempre o contexto clínico antes de tomar uma decisão.
          </p>
        </section>

        <section className={styles.grid} aria-label="Calculadoras disponíveis">
          {calculadoras.map((calculator) => (
            <Link
              key={calculator.slug}
              to={`/calculadoras/${calculator.slug}`}
              className={styles.card}
              data-testid="calculadora-card"
            >
              <div className={styles.cardLabel}>Ferramenta clínica</div>
              <h2 className={styles.cardTitle}>{calculator.titulo}</h2>
              <p className={styles.cardDescription}>{calculator.descricao}</p>
              <span className={styles.cardAction}>Abrir calculadora <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </section>

        <p className={styles.disclaimer}>
          Material de apoio. Os resultados não substituem avaliação profissional,
          protocolo institucional ou julgamento clínico.
        </p>
      </main>
    </div>
  );
}

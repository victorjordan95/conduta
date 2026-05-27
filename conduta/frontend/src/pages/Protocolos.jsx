import { Link } from 'react-router-dom';
import { protocolos } from '../data/protocolos';
import styles from './Protocolos.module.scss';

const CORES_CATEGORIA = {
  'via-aerea': styles.catViaAerea,
  cardiovascular: styles.catCardiovascular,
  neurologico: styles.catNeurologico,
  metabolico: styles.catMetabolico,
  infeccioso: styles.catInfeccioso,
};

export default function Protocolos() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>← Conduta</Link>
        <div>
          <h1 className={styles.titulo}>Sequências Rápidas</h1>
          <p className={styles.subtitulo}>Protocolos clínicos de emergência</p>
        </div>
      </header>

      <main className={styles.grid}>
        {protocolos.map((p) => (
          <Link
            key={p.slug}
            to={`/protocolos/${p.slug}`}
            className={styles.card}
            data-testid="protocolo-card"
          >
            <span className={styles.icone}>{p.icone}</span>
            <h2 className={styles.cardTitulo}>{p.titulo}</h2>
            <div className={styles.tags}>
              <span className={`${styles.categoriaBadge} ${CORES_CATEGORIA[p.categoria] ?? ''}`}>
                {p.categoria}
              </span>
              {p.tags.slice(1).map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}

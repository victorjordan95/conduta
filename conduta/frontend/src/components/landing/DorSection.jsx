// frontend/src/components/landing/DorSection.jsx
import { Link } from 'react-router-dom';
import styles from './DorSection.module.scss';
import shared from './landing.module.scss';

const MOMENTOS = [
  {
    emoji: '😰',
    titulo: 'Preceptor ocupado, caso que não fecha',
    descricao: 'A pressão do tempo real sem rede de apoio por perto.',
  },
  {
    emoji: '🌀',
    titulo: '4 abas abertas, 3 diagnósticos na cabeça',
    descricao: 'Informação demais, síntese de menos. O Google não sabe o contexto do seu paciente.',
  },
  {
    emoji: '🤔',
    titulo: '"Será que estou fazendo a coisa certa?"',
    descricao: 'A dúvida que ninguém fala em voz alta, mas todo mundo sente nos primeiros anos.',
  },
];

export default function DorSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <p className={shared.sectionLabel}>Você já passou por isso</p>

        <div className={styles.momentos}>
          {MOMENTOS.map((m) => (
            <div key={m.titulo} className={styles.momento}>
              <span className={styles.emoji}>{m.emoji}</span>
              <div>
                <strong className={styles.momentoTitulo}>{m.titulo}</strong>
                <p className={styles.momentoDesc}>{m.descricao}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.resolucao}>
          <strong>O Conduta foi feito para esse momento.</strong>
          <p>Análise clínica contextualizada, em segundos, sem julgamento.</p>
          <Link to="/login" className={shared.ctaButton} style={{ marginTop: '16px', display: 'inline-block' }}>
            Experimentar agora — grátis
          </Link>
        </div>
      </div>
    </section>
  );
}

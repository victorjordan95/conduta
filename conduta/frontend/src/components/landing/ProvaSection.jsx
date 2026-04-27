// frontend/src/components/landing/ProvaSection.jsx
import styles from './ProvaSection.module.scss';
import shared from './landing.module.scss';

const QUOTE = {
  texto:
    'Exatamente o que eu precisava no internato — alguém pra confirmar que minha hipótese fazia sentido antes de apresentar pro preceptor.',
  autor: 'Médica residente · São Paulo',
};

const CREDENCIAIS = [
  { sigla: 'PCDTs', desc: 'Protocolos Clínicos e Diretrizes Terapêuticas MS' },
  { sigla: 'CFM',   desc: 'Condutas alinhadas às resoluções do conselho' },
  { sigla: 'SUS',   desc: 'Foco em atenção primária e pronto atendimento' },
  { sigla: 'BR',    desc: '100% em português, contexto brasileiro' },
];

export default function ProvaSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <p className={shared.sectionLabel}>Feito por quem entende</p>
        <h2 className={shared.sectionTitle}>Para quem está começando.</h2>

        <blockquote className={styles.quote}>
          <p>"{QUOTE.texto}"</p>
          <footer>— {QUOTE.autor}</footer>
        </blockquote>

        <div className={styles.credGrid}>
          {CREDENCIAIS.map((c) => (
            <div key={c.sigla} className={styles.cred}>
              <strong className={styles.credSigla}>{c.sigla}</strong>
              <span className={styles.credDesc}>{c.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

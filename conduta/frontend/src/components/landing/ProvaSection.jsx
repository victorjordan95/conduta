// frontend/src/components/landing/ProvaSection.jsx
import styles from './ProvaSection.module.scss';
import shared from './landing.module.scss';

const QUOTE = {
  texto:
    'Exatamente o que eu precisava no internato — alguém pra confirmar que minha hipótese fazia sentido antes de apresentar pro preceptor.',
  autor: 'Médica residente · São Paulo',
};

const CREDENCIAIS = [
  { sigla: 'PCDTs', desc: 'Protocolos Clínicos e Diretrizes Terapêuticas MS', href: 'https://www.gov.br/saude/pt-br/assuntos/protocolos-clinicos-e-diretrizes-terapeuticas-pcdt' },
  { sigla: 'CFM',   desc: 'Condutas alinhadas às resoluções do conselho',       href: 'https://portal.cfm.org.br/' },
  { sigla: 'SUS',   desc: 'Foco em atenção primária e pronto atendimento',      href: null },
  { sigla: 'BR',    desc: '100% em português, contexto brasileiro',             href: null },
];

export default function ProvaSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <h2 className={shared.sectionTitle}>Referências que sustentam cada análise.</h2>

        <blockquote className={styles.quote}>
          <p>"{QUOTE.texto}"</p>
          <footer>— {QUOTE.autor}</footer>
        </blockquote>

        <ul className={styles.credList}>
          {CREDENCIAIS.map((c) => (
            <li key={c.sigla} className={styles.credRow}>
              {c.href ? (
                <a href={c.href} target="_blank" rel="noreferrer" className={styles.credSigla}>
                  {c.sigla}
                </a>
              ) : (
                <span className={styles.credSigla}>{c.sigla}</span>
              )}
              <span className={styles.credDesc}>{c.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

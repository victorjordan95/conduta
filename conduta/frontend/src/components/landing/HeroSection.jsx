// frontend/src/components/landing/HeroSection.jsx
import { Link } from 'react-router-dom';
import styles from './HeroSection.module.scss';

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.textCol}>
          <div className={styles.badge}>Para médicos e residentes</div>

          <h1 className={styles.headline}>
            Aquela dúvida clínica<br />
            que você não quer ter<br />
            <span className={styles.accent}>agora tem resposta.</span>
          </h1>

          <p className={styles.sub}>
            Assistente clínico com IA que analisa o caso, sugere conduta e aponta
            red flags — em segundos.
          </p>

          <div className={styles.ctaGroup}>
            <Link to="/login" className={styles.ctaBtn}>Começar grátis</Link>
            <span className={styles.ctaMeta}>15 análises/mês · sem cartão</span>
          </div>
        </div>

        <div className={styles.previewCol}>
          <div className={styles.preview}>
            <div className={styles.previewHeader}>
              <span className={styles.previewDot} />
              <span className={styles.previewTitle}>ANÁLISE EM ANDAMENTO</span>
            </div>
            <div className={styles.previewInput}>
              → Criança, 4 anos, febre há 3 dias, sem foco aparente...
            </div>
            <div className={styles.previewOutput}>
              <div className={styles.outputLine}>
                <span className={styles.success}>✓ Hipótese principal:</span> IVAS viral
              </div>
              <div className={styles.outputLine}>
                <span className={styles.warning}>⚠ Red flag:</span> Febre &gt; 39°C por mais de 5 dias — investigar foco
              </div>
              <div className={styles.outputLine}>
                <span className={styles.muted}>→ Conduta:</span> Antitérmico + reavaliação em 48h
              </div>
              <div className={styles.outputLine}>
                <span className={styles.muted}>→ Encaminhamento:</span> SE febre persistir ou surgir petéquias
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

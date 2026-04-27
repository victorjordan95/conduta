// frontend/src/components/landing/CtaFinalSection.jsx
import { Link } from 'react-router-dom';
import styles from './CtaFinalSection.module.scss';

export default function CtaFinalSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.label}>Pronto para começar?</p>

        <h2 className={styles.headline}>
          A próxima dúvida clínica<br />
          <span className={styles.accent}>não precisa ser solitária.</span>
        </h2>

        <p className={styles.sub}>
          15 análises por mês, grátis, sem cartão.<br />
          Comece agora e sinta a diferença na primeira consulta.
        </p>

        <div className={styles.ctaGroup}>
          <Link to="/login" className={styles.ctaBtn}>Criar conta grátis</Link>
          <span className={styles.ou}>
            ou <Link to="/login" className={styles.verPlanos}>ver planos</Link>
          </span>
        </div>

        <div className={styles.microcopy}>
          <span>✓ Sem cartão de crédito</span>
          <span>✓ Cancele quando quiser</span>
          <span>✓ Acesso imediato</span>
        </div>
      </div>

      <footer className={styles.footer}>
        <span>Conduta · Feito para médicos brasileiros</span>
        <a href="mailto:contato@useconduta.com.br" className={styles.footerLink}>
          contato@useconduta.com.br
        </a>
      </footer>
    </section>
  );
}

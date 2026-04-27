// frontend/src/components/landing/PrecosSection.jsx
import { Link } from 'react-router-dom';
import styles from './PrecosSection.module.scss';
import shared from './landing.module.scss';

const PLANO_FREE = {
  nome: 'Gratuito',
  preco: 'R$0',
  periodo: 'para sempre',
  cta: 'Começar grátis',
  itens: [
    { texto: '15 análises por mês', ativo: true },
    { texto: 'Diagnóstico diferencial completo', ativo: true },
    { texto: 'Red flags automáticos', ativo: true },
    { texto: 'Conduta baseada em protocolos', ativo: true },
    { texto: 'Sem cartão de crédito', ativo: true },
    { texto: 'Histórico de casos', ativo: false },
    { texto: 'Análises ilimitadas', ativo: false },
  ],
};

const PLANO_PRO = {
  nome: 'Pro',
  preco: 'R$39,90',
  periodo: '/mês',
  cta: 'Assinar Pro',
  itens: [
    { texto: 'Análises ilimitadas', ativo: true, destaque: true },
    { texto: 'Diagnóstico diferencial completo', ativo: true },
    { texto: 'Red flags automáticos', ativo: true },
    { texto: 'Conduta baseada em protocolos', ativo: true },
    { texto: 'Histórico completo de casos', ativo: true, destaque: true },
    { texto: 'Suporte prioritário', ativo: true, destaque: true },
    { texto: 'Acesso a novos recursos primeiro', ativo: true },
  ],
};

function ItemPlano({ item }) {
  if (!item.ativo) {
    return (
      <li className={styles.itemInativo}>
        <span className={styles.dash}>—</span> {item.texto}
      </li>
    );
  }
  return (
    <li className={`${styles.item} ${item.destaque ? styles.itemDestaque : ''}`}>
      <span className={styles.check}>✓</span> {item.texto}
    </li>
  );
}

export default function PrecosSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <p className={shared.sectionLabel}>Planos</p>
        <h2 className={shared.sectionTitle}>
          Comece grátis.<br />Evolua quando precisar.
        </h2>

        <div className={styles.grid}>
          <div className={styles.plano}>
            <div className={styles.planoNome}>{PLANO_FREE.nome}</div>
            <div className={styles.planoPreco}>
              {PLANO_FREE.preco}
              <span className={styles.planoPeriodo}> {PLANO_FREE.periodo}</span>
            </div>
            <Link to="/login" className={`${styles.planoCta} ${styles.planoCtaDark}`}>
              {PLANO_FREE.cta}
            </Link>
            <ul className={styles.lista}>
              {PLANO_FREE.itens.map((i) => <ItemPlano key={i.texto} item={i} />)}
            </ul>
          </div>

          <div className={`${styles.plano} ${styles.planoDestaque}`}>
            <div className={styles.badge}>Mais popular</div>
            <div className={styles.planoNomePro}>{PLANO_PRO.nome}</div>
            <div className={styles.planoPrecoPro}>
              {PLANO_PRO.preco}
              <span className={styles.planoPeriodoPro}>{PLANO_PRO.periodo}</span>
            </div>
            <Link to="/login" className={`${styles.planoCta} ${styles.planoCtaPro}`}>
              {PLANO_PRO.cta}
            </Link>
            <ul className={styles.lista}>
              {PLANO_PRO.itens.map((i) => <ItemPlano key={i.texto} item={i} />)}
            </ul>
          </div>
        </div>

        <p className={styles.estudante}>
          Estudante de medicina?{' '}
          <a href="mailto:contato@useconduta.com.br" className={styles.estudanteLink}>
            Fale com a gente — temos condições especiais.
          </a>
        </p>
      </div>
    </section>
  );
}

// frontend/src/pages/ProtocoloDetalhe.jsx
import { useParams, Link, Navigate } from 'react-router-dom';
import { getProtocolo } from '../data/protocolos';
import { CATEGORIAS, anoDiretriz } from '../components/CategoriaProtocolo';
import styles from './ProtocoloDetalhe.module.scss';

function IconeChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconeAlerta() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function Passo({ passo, numero }) {
  if (passo.tipo === 'alerta') {
    return (
      <div className={styles.alerta} role="note">
        <span className={styles.alertaIcone}><IconeAlerta /></span>
        <span>{passo.texto}</span>
      </div>
    );
  }

  if (passo.tipo === 'droga') {
    return (
      <div className={styles.passoLinha}>
        <span className={styles.numero}>{numero}</span>
        <div className={styles.drugaBadge}>
          <div className={styles.drugaCabecalho}>
            <span className={styles.drugaNome}>{passo.nome}</span>
            <span className={styles.drugaDose}>{passo.dose}</span>
          </div>
          {passo.obs && <span className={styles.drugaObs}>{passo.obs}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.passoLinha}>
      <span className={styles.numero}>{numero}</span>
      <span className={styles.passoTexto}>{passo.texto}</span>
    </div>
  );
}

export default function ProtocoloDetalhe() {
  const { slug } = useParams();
  const protocolo = getProtocolo(slug);

  if (!protocolo) return <Navigate to="/protocolos" replace />;

  const cat = CATEGORIAS[protocolo.categoria];
  const Icone = cat?.Icone;
  const ano = anoDiretriz(protocolo.referencia);

  // Pre-compute step numbers across all phases (alertas don't get a number)
  let counter = 0;
  const fasesComNumeros = protocolo.fases.map((fase) => ({
    ...fase,
    passos: fase.passos.map((passo) => {
      if (passo.tipo === 'alerta') return { ...passo, numero: null };
      counter += 1;
      return { ...passo, numero: counter };
    }),
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/protocolos" className={styles.backLink}>
            <IconeChevron />
            Protocolos
          </Link>
          <div className={styles.headerContent}>
          {Icone && (
            <span className={`${styles.icone} ${styles[`cat_${protocolo.categoria.replace('-', '')}`] ?? ''}`}>
              <Icone tamanho={22} />
            </span>
          )}
          <div className={styles.headerTexto}>
            <h1 className={styles.titulo}>{protocolo.titulo}</h1>
            <div className={styles.headerMeta}>
              <span className={styles.headerCategoria}>{cat?.label ?? protocolo.categoria}</span>
              <span className={styles.headerFases}>{protocolo.fases.length} fases</span>
              {ano && <span className={styles.headerAno}>Diretriz {ano}</span>}
            </div>
          </div>
          </div>
        </div>
      </header>

      <main className={styles.conteudo}>
        {fasesComNumeros.map((fase, fi) => (
          <section key={fi} className={styles.fase}>
            <h2 className={styles.faseNome}>
              <span className={styles.faseIndice}>{fi + 1}</span>
              {fase.nome}
            </h2>
            <div className={styles.passos}>
              {fase.passos.map((passo, pi) => (
                <Passo key={pi} passo={passo} numero={passo.numero} />
              ))}
            </div>
          </section>
        ))}

        <footer className={styles.referencia}>
          <span className={styles.referenciaLabel}>Referência</span>
          <span>{protocolo.referencia}</span>
        </footer>

        <p className={styles.disclaimer}>
          Material de apoio à decisão clínica. Não substitui o julgamento do profissional
          nem protocolos institucionais locais. Confira doses antes de prescrever.
        </p>
      </main>
    </div>
  );
}

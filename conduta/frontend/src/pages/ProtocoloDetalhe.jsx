// frontend/src/pages/ProtocoloDetalhe.jsx
import { useParams, Link, Navigate } from 'react-router-dom';
import { getProtocolo } from '../data/protocolos';
import styles from './ProtocoloDetalhe.module.scss';

function Passo({ passo, numero }) {
  if (passo.tipo === 'alerta') {
    return (
      <div className={styles.alerta}>
        <span className={styles.alertaIcone}>⚠️</span>
        <span>{passo.texto}</span>
      </div>
    );
  }

  if (passo.tipo === 'droga') {
    return (
      <div className={styles.passoLinha}>
        <span className={styles.numero}>{numero}.</span>
        <div className={styles.drugaBadge}>
          <span className={styles.drugaNome}>{passo.nome}</span>
          <span className={styles.drugaDose}>{passo.dose}</span>
          {passo.obs && <span className={styles.drugaObs}>{passo.obs}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.passoLinha}>
      <span className={styles.numero}>{numero}.</span>
      <span className={styles.passoTexto}>{passo.texto}</span>
    </div>
  );
}

export default function ProtocoloDetalhe() {
  const { slug } = useParams();
  const protocolo = getProtocolo(slug);

  if (!protocolo) return <Navigate to="/protocolos" replace />;

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
        <Link to="/protocolos" className={styles.backLink}>← Protocolos</Link>
        <div className={styles.headerContent}>
          <span className={styles.icone}>{protocolo.icone}</span>
          <h1 className={styles.titulo}>{protocolo.titulo}</h1>
        </div>
      </header>

      <main className={styles.conteudo}>
        {fasesComNumeros.map((fase, fi) => (
          <section key={fi} className={styles.fase}>
            <h2 className={styles.faseNome}>{fase.nome}</h2>
            <div className={styles.passos}>
              {fase.passos.map((passo, pi) => (
                <Passo key={pi} passo={passo} numero={passo.numero} />
              ))}
            </div>
          </section>
        ))}

        <footer className={styles.referencia}>
          <span>📚 Referência: {protocolo.referencia}</span>
        </footer>
      </main>
    </div>
  );
}

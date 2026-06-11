import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { protocolos } from '../data/protocolos';
import { CATEGORIAS, anoDiretriz } from '../components/CategoriaProtocolo';
import styles from './Protocolos.module.scss';

const CORES_CATEGORIA = {
  'via-aerea': styles.catViaAerea,
  cardiovascular: styles.catCardiovascular,
  neurologico: styles.catNeurologico,
  metabolico: styles.catMetabolico,
  infeccioso: styles.catInfeccioso,
};

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function IconeChevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconeLupa() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function Protocolos() {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState(null);
  const buscaRef = useRef(null);

  // Atalho "/" foca a busca — médico sob pressão não navega com mouse
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '/' && document.activeElement !== buscaRef.current) {
        e.preventDefault();
        buscaRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    return protocolos.filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (!termo) return true;
      const alvo = normalizar(`${p.titulo} ${p.tags.join(' ')} ${CATEGORIAS[p.categoria]?.label ?? ''}`);
      return alvo.includes(termo);
    });
  }, [busca, categoria]);

  const categoriasPresentes = useMemo(
    () => [...new Set(protocolos.map((p) => p.categoria))],
    []
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.backLink}>
            <IconeChevron />
            Conduta
          </Link>
          <span className={styles.headerDivisor} aria-hidden="true" />
          <div className={styles.headerTexto}>
            <h1 className={styles.titulo}>Sequências Rápidas</h1>
            <p className={styles.subtitulo}>Protocolos clínicos de emergência</p>
          </div>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.buscaWrapper}>
          <span className={styles.buscaIcone}><IconeLupa /></span>
          <input
            ref={buscaRef}
            type="search"
            className={styles.busca}
            placeholder="Buscar protocolo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar protocolo"
          />
          <kbd className={styles.buscaAtalho} aria-hidden="true">/</kbd>
        </div>

        <div className={styles.filtros} role="group" aria-label="Filtrar por categoria">
          <button
            type="button"
            className={categoria === null ? styles.filtroAtivo : styles.filtro}
            aria-pressed={categoria === null}
            onClick={() => setCategoria(null)}
          >
            Todos
          </button>
          {categoriasPresentes.map((cat) => (
            <button
              key={cat}
              type="button"
              className={categoria === cat ? styles.filtroAtivo : styles.filtro}
              aria-pressed={categoria === cat}
              onClick={() => setCategoria(categoria === cat ? null : cat)}
            >
              {CATEGORIAS[cat]?.label ?? cat}
            </button>
          ))}
        </div>
      </div>

      <main className={styles.grid}>
        {filtrados.map((p) => {
          const cat = CATEGORIAS[p.categoria];
          const ano = anoDiretriz(p.referencia);
          const Icone = cat?.Icone;
          return (
            <Link
              key={p.slug}
              to={`/protocolos/${p.slug}`}
              className={styles.card}
              data-testid="protocolo-card"
            >
              <div className={styles.cardTopo}>
                {Icone && (
                  <span className={`${styles.icone} ${CORES_CATEGORIA[p.categoria] ?? ''}`}>
                    <Icone tamanho={18} />
                  </span>
                )}
                <span className={`${styles.categoriaBadge} ${CORES_CATEGORIA[p.categoria] ?? ''}`}>
                  {cat?.label ?? p.categoria}
                </span>
              </div>
              <h2 className={styles.cardTitulo}>{p.titulo}</h2>
              <div className={styles.cardRodape}>
                <span className={styles.cardFases}>{p.fases.length} fases</span>
                {ano && <span className={styles.cardAno}>Diretriz {ano}</span>}
              </div>
            </Link>
          );
        })}

        {filtrados.length === 0 && (
          <div className={styles.vazio} role="status">
            <p>Nenhum protocolo encontrado{busca ? ` para "${busca}"` : ''}.</p>
            <button
              type="button"
              className={styles.vazioLimpar}
              onClick={() => { setBusca(''); setCategoria(null); }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

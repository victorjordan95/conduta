import { useMemo, useState } from 'react';
import { buildClinicalSearchIndex, searchClinicalTools } from '../utils/clinicalSearch';
import styles from './PlantaoQuickActions.module.scss';

const SEARCH_INDEX = buildClinicalSearchIndex();
const INITIAL_RESULTS = 4;

/**
 * Conteúdo do acesso rápido. Não se posiciona sozinho: o Dashboard o abre
 * dentro de um Sheet — bottom sheet no mobile, paleta de comando no desktop.
 */
export default function PlantaoQuickActions({ onNewCase, autoFocusSearch }) {
  const [query, setQuery] = useState('');
  const results = useMemo(
    () => searchClinicalTools(SEARCH_INDEX, query).slice(0, query.trim() ? 8 : INITIAL_RESULTS),
    [query],
  );

  return (
    <div className={styles.body}>
      <div className={styles.actions}>
        <button type="button" className={`${styles.action} ${styles.primaryAction}`} onClick={onNewCase}>
          <span aria-hidden="true">+</span>
          Novo caso
        </button>
        <a className={styles.action} href="/protocolos" aria-label="Protocolos">
          <span aria-hidden="true">↗</span>
          Protocolos
        </a>
        <a className={styles.action} href="/calculadoras" aria-label="Calculadoras">
          <span aria-hidden="true">∑</span>
          Calculadoras
        </a>
      </div>

      <div className={styles.search} role="search">
        <label className={styles.srOnly} htmlFor="plantao-search">Buscar ferramenta</label>
        <div className={styles.searchControl}>
          <span className={styles.searchIcon} aria-hidden="true">⌕</span>
          <input
            id="plantao-search"
            className={styles.searchInput}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Protocolo ou calculadora..."
            aria-label="Buscar ferramenta"
            // no mobile abrir o teclado esconderia justamente os atalhos acima
            autoFocus={autoFocusSearch}
          />
        </div>
      </div>

      {results.length > 0 ? (
        <div className={styles.results} aria-label={query ? 'Resultados da busca' : 'Ferramentas mais usadas'}>
          {results.map((item) => (
            <a key={item.id} href={item.href} className={styles.result}>
              <span className={styles.resultType}>{item.categoriaLabel}</span>
              <span className={styles.resultTitle}>{item.titulo}</span>
            </a>
          ))}
        </div>
      ) : (
        <div className={styles.empty} role="status">
          Nenhum protocolo ou calculadora encontrado.
        </div>
      )}
    </div>
  );
}

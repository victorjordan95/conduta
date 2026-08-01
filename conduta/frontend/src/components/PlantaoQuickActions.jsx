import { useEffect, useMemo, useRef, useState } from 'react';
import { buildClinicalSearchIndex, searchClinicalTools } from '../utils/clinicalSearch';
import styles from './PlantaoQuickActions.module.scss';

const SEARCH_INDEX = buildClinicalSearchIndex();
const INITIAL_RESULTS = 4;

function QuickActionsBody({ onNewCase, searchRef, hideSearchLabel }) {
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
        <label
          className={hideSearchLabel ? styles.srOnly : styles.searchLabel}
          htmlFor="plantao-search"
        >
          Buscar ferramenta
        </label>
        <div className={styles.searchControl}>
          <span className={styles.searchIcon} aria-hidden="true">⌕</span>
          <input
            ref={searchRef}
            id="plantao-search"
            className={styles.searchInput}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Protocolo ou calculadora..."
            aria-label="Buscar ferramenta"
          />
          <kbd>/</kbd>
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

export default function PlantaoQuickActions({ onNewCase, variant = 'panel' }) {
  const [open, setOpen] = useState(true);
  const searchRef = useRef(null);
  const inSheet = variant === 'sheet';

  useEffect(() => {
    // no sheet o painel já está aberto e focado; o atalho pertence ao desktop
    if (inSheet) return undefined;

    function handleKeyDown(event) {
      const activeElement = document.activeElement;
      const isEditable = activeElement?.matches('input, textarea, select, [contenteditable="true"]');

      if (isEditable) return;

      if (event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        setOpen(true);
        searchRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inSheet]);

  // sem autoFocus: abrir o teclado por cima dos atalhos esconde justamente
  // o que a maioria veio buscar
  if (inSheet) {
    return <QuickActionsBody onNewCase={onNewCase} searchRef={searchRef} hideSearchLabel />;
  }

  return (
    <details
      className={styles.panel}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>Modo plantão</span>
          <h2 className={styles.title}>Acesso rápido</h2>
        </div>
        <span className={styles.hint}>/ ou Ctrl K</span>
      </summary>

      <QuickActionsBody onNewCase={onNewCase} searchRef={searchRef} />
    </details>
  );
}

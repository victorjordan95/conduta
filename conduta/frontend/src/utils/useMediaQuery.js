import { useEffect, useState } from 'react';

// ponytail: um listener por query, suficiente para os poucos usos do dashboard.
// jsdom não implementa matchMedia — sem ele o hook devolve false (layout desktop).
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query)?.matches ?? false);

  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return undefined;

    const onChange = (event) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

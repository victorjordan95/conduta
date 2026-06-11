// frontend/src/components/CategoriaProtocolo.jsx
// Taxonomia visual das categorias de protocolo: label legível + ícone SVG (stroke, família Feather).

function svgProps(tamanho) {
  return {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
}

function IconeViaAerea({ tamanho = 20 }) {
  return (
    <svg {...svgProps(tamanho)}>
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
  );
}

function IconeCardiovascular({ tamanho = 20 }) {
  return (
    <svg {...svgProps(tamanho)}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconeNeurologico({ tamanho = 20 }) {
  return (
    <svg {...svgProps(tamanho)}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconeMetabolico({ tamanho = 20 }) {
  return (
    <svg {...svgProps(tamanho)}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function IconeInfeccioso({ tamanho = 20 }) {
  return (
    <svg {...svgProps(tamanho)}>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

export const CATEGORIAS = {
  'via-aerea': { label: 'Via aérea', Icone: IconeViaAerea },
  cardiovascular: { label: 'Cardiovascular', Icone: IconeCardiovascular },
  neurologico: { label: 'Neurológico', Icone: IconeNeurologico },
  metabolico: { label: 'Metabólico', Icone: IconeMetabolico },
  infeccioso: { label: 'Infeccioso', Icone: IconeInfeccioso },
};

// Ano mais recente citado na referência do protocolo — sinal de atualidade no card.
export function anoDiretriz(referencia) {
  const anos = referencia.match(/\b20\d{2}\b/g);
  if (!anos) return null;
  return Math.max(...anos.map(Number));
}

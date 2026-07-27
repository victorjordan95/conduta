function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function validarEntradas({ pesoKg, alturaCm }) {
  const entradas = { pesoKg, alturaCm };

  Object.entries(entradas).forEach(([nome, valor]) => {
    if (!Number.isFinite(valor) || valor <= 0) {
      throw new Error(`Informe um valor válido para ${nome}.`);
    }
  });
}

export function calcularImc({ pesoKg, alturaCm }) {
  validarEntradas({ pesoKg, alturaCm });

  const valor = pesoKg / ((alturaCm / 100) ** 2);
  let classificacao = 'Obesidade';

  if (valor < 18.5) classificacao = 'Baixo peso';
  else if (valor < 25) classificacao = 'Eutrofia';
  else if (valor < 30) classificacao = 'Sobrepeso';

  return { valor: arredondar(valor), classificacao };
}

export function calcularSuperficieCorporal({ pesoKg, alturaCm }) {
  validarEntradas({ pesoKg, alturaCm });

  return {
    valor: arredondar(Math.sqrt((pesoKg * alturaCm) / 3600)),
  };
}

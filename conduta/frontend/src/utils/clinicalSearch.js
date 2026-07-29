import { CATEGORIAS } from '../components/CategoriaProtocolo';
import { calculadoras } from '../data/calculadoras';
import { protocolos } from '../data/protocolos';

export function normalizarClinicalSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function buildClinicalSearchIndex(
  protocolosData = protocolos,
  calculadorasData = calculadoras,
  categorias = CATEGORIAS,
) {
  return [
    ...protocolosData.map((item) => ({
      id: `protocolo-${item.slug}`,
      tipo: 'protocolo',
      titulo: item.titulo,
      descricao: `Protocolo de ${(item.tags ?? []).join(', ')}`,
      categoria: item.categoria,
      categoriaLabel: categorias[item.categoria]?.label ?? item.categoria,
      href: `/protocolos/${item.slug}`,
    })),
    ...calculadorasData.map((item) => ({
      id: `calculadora-${item.slug}`,
      tipo: 'calculadora',
      titulo: item.titulo,
      descricao: item.descricao,
      categoria: 'calculadora',
      categoriaLabel: 'Calculadora clínica',
      href: `/calculadoras/${item.slug}`,
    })),
  ];
}

export function searchClinicalTools(index, query) {
  const term = normalizarClinicalSearch(query).trim();
  if (!term) return index;

  return index.filter((item) => normalizarClinicalSearch(
    `${item.titulo} ${item.descricao} ${item.categoriaLabel}`,
  ).includes(term));
}

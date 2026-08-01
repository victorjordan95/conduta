import { calcularImc, calcularSuperficieCorporal } from '../utils/calculadoras';

const CAMPOS_ANTROPOMETRIA = [
  { name: 'pesoKg', label: 'Peso', unidade: 'kg', min: '0.1', step: '0.1' },
  { name: 'alturaCm', label: 'Altura', unidade: 'cm', min: '1', step: '0.1' },
];

export const calculadoras = [
  {
    slug: 'imc',
    titulo: 'Índice de Massa Corporal (IMC)',
    descricao: 'Relação entre peso e altura para classificação antropométrica em adultos.',
    campos: CAMPOS_ANTROPOMETRIA,
    formula: 'peso (kg) ÷ altura² (m)',
    referencia: 'Organização Mundial da Saúde — Obesity and overweight',
    referenciaUrl: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
    atualizadoEm: 'Julho de 2026',
    notaSeguranca: 'Confira as unidades, a fórmula e o contexto clínico antes de usar o resultado.',
    limitacao: 'Classificação destinada a adultos; não substitui avaliação clínica e não deve ser aplicada isoladamente a gestantes, atletas ou crianças.',
    unidadeResultado: 'kg/m²',
    calculate: calcularImc,
  },
  {
    slug: 'superficie-corporal',
    titulo: 'Superfície corporal',
    descricao: 'Estimativa da superfície corporal pela fórmula de Mosteller.',
    campos: CAMPOS_ANTROPOMETRIA,
    formula: '√((peso (kg) × altura (cm)) ÷ 3600)',
    referencia: 'Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987.',
    referenciaUrl: 'https://pubmed.ncbi.nlm.nih.gov/3657875/',
    atualizadoEm: 'Julho de 2026',
    notaSeguranca: 'Confira as unidades, a fórmula e o contexto clínico antes de usar o resultado.',
    limitacao: 'É uma estimativa antropométrica e não deve ser usada sozinha para definir doses ou condutas.',
    unidadeResultado: 'm²',
    calculate: calcularSuperficieCorporal,
  },
];

export function getCalculadora(slug) {
  return calculadoras.find((calculadora) => calculadora.slug === slug) ?? null;
}

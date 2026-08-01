import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getCalculadora } from '../data/calculadoras';
import SourceVersionCard from '../components/SourceVersionCard';
import styles from './CalculadoraDetalhe.module.scss';

function normalizarNumero(valor) {
  return Number(String(valor).trim().replace(',', '.'));
}

function formatarNumero(valor) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function IconeChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export default function CalculadoraDetalhe() {
  const { slug } = useParams();
  const calculadora = getCalculadora(slug);
  const [valores, setValores] = useState({});
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  if (!calculadora) return <Navigate to="/calculadoras" replace />;

  function handleChange(event) {
    const { name, value } = event.target;
    setValores((current) => ({ ...current, [name]: value }));
    setErro('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    setResultado(null);

    const entradas = Object.fromEntries(
      calculadora.campos.map((campo) => [campo.name, normalizarNumero(valores[campo.name])])
    );

    try {
      setResultado(calculadora.calculate(entradas));
    } catch {
      setErro('Preencha todos os campos com valores positivos válidos.');
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/calculadoras" className={styles.backLink}>
            <IconeChevron />
            Calculadoras
          </Link>
          <span className={styles.headerDivisor} aria-hidden="true" />
          <div>
            <div className={styles.eyebrow}>Ferramenta clínica</div>
            <h1 className={styles.titulo}>{calculadora.titulo}</h1>
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <p className={styles.descricao}>{calculadora.descricao}</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fields}>
            {calculadora.campos.map((campo) => (
              <label key={campo.name} className={styles.field} htmlFor={campo.name}>
                <span className={styles.fieldLabel}>{campo.label}</span>
                <span className={styles.inputWrapper}>
                  <input
                    id={campo.name}
                    name={campo.name}
                    type="text"
                    inputMode="decimal"
                    min={campo.min}
                    step={campo.step}
                    value={valores[campo.name] ?? ''}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <span className={styles.unit}>{campo.unidade}</span>
                </span>
              </label>
            ))}
          </div>

          <button type="submit" className={styles.calculateButton}>Calcular</button>
          {erro && <p className={styles.error} role="alert">{erro}</p>}
        </form>

        {resultado && (
          <section className={styles.result} role="status" aria-live="polite">
            <div className={styles.resultLabel}>Resultado</div>
            <div className={styles.resultValue}>
              <strong>{formatarNumero(resultado.valor)}</strong>
              <span>{calculadora.unidadeResultado}</span>
            </div>
            {resultado.classificacao && (
              <p className={styles.classificacao}>{resultado.classificacao}</p>
            )}
          </section>
        )}

        <section className={styles.notes}>
          <div>
            <h2>Fórmula</h2>
            <p>{calculadora.formula}</p>
          </div>
          <div>
            <h2>Limitações</h2>
            <p>{calculadora.limitacao}</p>
          </div>
        </section>

        <SourceVersionCard
          referencia={calculadora.referencia}
          atualizadoEm={calculadora.atualizadoEm}
          referenciaUrl={calculadora.referenciaUrl}
          notaSeguranca={calculadora.notaSeguranca}
        />

        <p className={styles.disclaimer}>
          Material de apoio à decisão clínica. Confira os dados e o contexto antes de usar o resultado.
        </p>
      </main>
    </div>
  );
}

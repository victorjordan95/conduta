import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gerarDeclaracaoObito } from '../services/api';
import styles from './DeclaracaoObitoModal.module.scss';

const LETRAS = ['a', 'b', 'c', 'd'];

// [campo, rótulo, opções?] — opções = select; sem opções = input texto
const BLOCOS = [
  ['I — Identificação', [
    ['tipo_obito', 'Tipo de óbito', { nao_fetal: 'Não fetal', fetal: 'Fetal' }],
    ['data_obito', 'Data do óbito'],
    ['hora_obito', 'Hora'],
    ['nome', 'Nome do falecido'],
    ['sexo', 'Sexo', { masculino: 'Masculino', feminino: 'Feminino', ignorado: 'Ignorado' }],
    ['idade', 'Idade'],
    ['data_nascimento', 'Data de nascimento'],
    ['raca_cor', 'Raça/cor'],
  ]],
  ['III — Ocorrência', [
    ['local_ocorrencia', 'Local', {
      hospital: 'Hospital', outro_estabelecimento: 'Outro estab. de saúde', domicilio: 'Domicílio',
      via_publica: 'Via pública', outros: 'Outros',
    }],
    ['estabelecimento', 'Estabelecimento'],
  ]],
  ['V — Condições do óbito', [
    ['gestacao_puerperio', 'Gestação/puerpério (mulher 10–49 anos)'],
    ['assistencia_medica', 'Recebeu assistência médica?', { sim: 'Sim', nao: 'Não', ignorado: 'Ignorado' }],
    ['necropsia', 'Diagnóstico confirmado por necrópsia?', { sim: 'Sim', nao: 'Não', ignorado: 'Ignorado' }],
  ]],
];

const BLOCOS_FINAIS = [
  ['VI — Médico', [
    ['medico_nome', 'Nome do médico'],
    ['medico_crm', 'CRM'],
    ['atestante', 'Óbito atestado por', {
      assistente: 'Médico assistente', substituto: 'Substituto', iml: 'IML', svo: 'SVO', outro: 'Outro',
    }],
  ]],
  ['VII — Causas externas (somente se suspeita)', [
    ['causa_externa_tipo', 'Tipo provável', {
      acidente: 'Acidente', suicidio: 'Suicídio', homicidio: 'Homicídio', outros: 'Outros', ignorado: 'Ignorado',
    }],
    ['causa_externa_descricao', 'Descrição sumária'],
  ]],
];

function paraTexto(d) {
  const linha = (l, rot) => `${rot}: ${l.causa || '—'}${l.intervalo ? ` | intervalo: ${l.intervalo}` : ''}${l.cid ? ` | CID ${l.cid}` : ''}`;
  const campos = (blocos) => blocos
    .map(([titulo, fs]) => `${titulo.toUpperCase()}\n${fs.map(([k, rot, opts]) => `${rot}: ${(opts?.[d[k]] ?? d[k]) || '—'}`).join('\n')}`)
    .join('\n\n');
  return [
    'RASCUNHO — DECLARAÇÃO DE ÓBITO (não substitui o formulário oficial)',
    campos(BLOCOS),
    `V — CAUSAS DO ÓBITO\nPARTE I\n${d.parte1.map((l, i) => linha(l, LETRAS[i])).join('\n')}\nPARTE II\n${d.parte2.map((l, i) => linha(l, `${i + 1}`)).join('\n')}`,
    campos(BLOCOS_FINAIS),
  ].join('\n\n');
}

export default function DeclaracaoObitoModal({ sessionId, onClose }) {
  const [dados, setDados] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const closeRef = useRef(null);

  const gerar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { declaracao } = await gerarDeclaracaoObito(sessionId);
      const { alertas: a, ...campos } = declaracao;
      setAlertas(a || []);
      setDados(campos);
    } catch (err) {
      setError(err.message || 'Erro ao gerar rascunho.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { gerar(); }, [gerar]);

  useEffect(() => {
    const trigger = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      trigger?.focus?.();
    };
  }, [onClose]);

  const set = (k, v) => setDados((d) => ({ ...d, [k]: v }));
  const setLinha = (parte, i, k, v) => setDados((d) => ({
    ...d,
    [parte]: d[parte].map((l, j) => (j === i ? { ...l, [k]: v } : l)),
  }));

  async function copiar() {
    try {
      await navigator.clipboard.writeText(paraTexto(dados));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível — usuário pode imprimir
    }
  }

  function renderCampos(blocos) {
    return blocos.map(([titulo, fs]) => (
      <fieldset key={titulo} className={styles.bloco}>
        <legend>{titulo}</legend>
        <div className={styles.grid}>
          {fs.map(([k, rot, opts]) => (
            <label key={k}>
              {rot}
              {opts ? (
                <select value={dados[k]} onChange={(e) => set(k, e.target.value)}>
                  <option value="">—</option>
                  {Object.entries(opts).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              ) : (
                <input value={dados[k]} onChange={(e) => set(k, e.target.value)} />
              )}
            </label>
          ))}
        </div>
      </fieldset>
    ));
  }

  function renderLinhas(parte, rotulos) {
    return dados[parte].map((l, i) => (
      <div key={i} className={styles.causa}>
        <span className={styles.letra}>{rotulos[i]}</span>
        <input aria-label={`Causa ${rotulos[i]}`} placeholder="Causa" value={l.causa} onChange={(e) => setLinha(parte, i, 'causa', e.target.value)} />
        <input aria-label={`Intervalo ${rotulos[i]}`} placeholder="Intervalo" value={l.intervalo} onChange={(e) => setLinha(parte, i, 'intervalo', e.target.value)} />
        <input aria-label={`CID ${rotulos[i]}`} placeholder="CID-10" value={l.cid} onChange={(e) => setLinha(parte, i, 'cid', e.target.value)} />
      </div>
    ));
  }

  // portal: imprimir esconde #root e mostra só o modal.
  // Sem fechar no clique fora — perderia as edições do formulário.
  return createPortal(
    <div className={styles.overlay} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="do-title">
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Rascunho — não substitui a DO oficial</span>
            <h2 id="do-title" className={styles.title}>Declaração de Óbito</h2>
          </div>
          <button ref={closeRef} className={`${styles.close} ${styles.noPrint}`} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {loading && <p className={styles.status} role="status">Montando rascunho a partir da sessão…</p>}

        {error && (
          <div className={styles.errorBox}>
            <p className={styles.error} role="alert">{error}</p>
            <button className={styles.btn} onClick={gerar}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && dados && (
          <div className={styles.body}>
            {alertas.length > 0 && (
              <ul className={styles.alertas} aria-label="Alertas de preenchimento">
                {alertas.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            )}

            {renderCampos(BLOCOS)}

            <fieldset className={styles.bloco}>
              <legend>V — Causas do óbito</legend>
              <p className={styles.dica}>
                Parte I: linha (a) = causa terminal; a última linha preenchida = causa básica. Uma causa por linha,
                cada uma consequência da de baixo. Evite modos de morrer (ex.: parada cardiorrespiratória).
              </p>
              <h3 className={styles.parte}>Parte I</h3>
              {renderLinhas('parte1', LETRAS)}
              <h3 className={styles.parte}>Parte II — outras condições significativas</h3>
              {renderLinhas('parte2', ['1', '2'])}
            </fieldset>

            {renderCampos(BLOCOS_FINAIS)}

            <p className={styles.aviso}>
              Transcreva para o formulário oficial numerado da DO (ou sistema do município). Blocos II, IV, VIII e IX
              devem ser preenchidos diretamente no formulário. O preenchimento e a assinatura são responsabilidade do
              médico (Res. CFM 1.779/2005). CIDs são sugestões — confira. Este rascunho não é salvo.
            </p>

            <div className={`${styles.actions} ${styles.noPrint}`}>
              <button className={styles.btnSecondary} onClick={copiar} aria-live="polite">
                {copiado ? 'Copiado ✓' : 'Copiar texto'}
              </button>
              <button className={styles.btn} onClick={() => window.print()}>Imprimir rascunho</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

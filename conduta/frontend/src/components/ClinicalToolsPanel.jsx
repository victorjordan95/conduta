import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateClinicalTool } from '../services/api';
import styles from './ClinicalToolsPanel.module.scss';

const TOOLS = [
  { id: 'clarifying_questions', label: 'Perguntas que podem mudar a análise' },
  { id: 'evolution_comparison', label: 'Comparar evolução' },
  { id: 'handoff', label: 'Passagem de caso' },
  { id: 'medication_review', label: 'Revisão medicamentosa' },
];

const EMPTY_DETAILS = {
  medications: '',
  allergies: '',
  pregnancy: '',
  renalHepatic: '',
  otherFactors: '',
};

export default function ClinicalToolsPanel({ sessionId, hasAnalysis }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!hasAnalysis) return null;

  function openTool(tool) {
    setSelectedTool(tool);
    setDetails(EMPTY_DETAILS);
    setResult('');
    setError('');
  }

  function closeTool() {
    if (!loading) setSelectedTool(null);
  }

  function updateDetail(field, value) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const data = await generateClinicalTool(sessionId, selectedTool, details);
      setResult(data.result || 'Não foi possível gerar um resultado.');
    } catch (err) {
      setError(err.message || 'Não foi possível gerar a ferramenta.');
    } finally {
      setLoading(false);
    }
  }

  const selectedLabel = TOOLS.find((tool) => tool.id === selectedTool)?.label || '';

  return (
    <section className={styles.panel} aria-label="Ferramentas de revisão clínica">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Apoio à revisão</span>
          <h2>Ferramentas clínicas</h2>
        </div>
        <span className={styles.headingHint}>Resultado temporário e revisável</span>
      </div>
      <div className={styles.actions}>
        {TOOLS.map((tool) => (
          <button key={tool.id} type="button" className={styles.toolButton} onClick={() => openTool(tool.id)}>
            {tool.label}
          </button>
        ))}
      </div>

      {selectedTool && (
        <div className={styles.backdrop} role="presentation" onMouseDown={closeTool}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clinical-tool-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.eyebrow}>Ferramenta de revisão</span>
                <h2 id="clinical-tool-title">{selectedLabel}</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={closeTool} aria-label="Fechar">
                ×
              </button>
            </div>

            {!result && selectedTool === 'medication_review' && (
              <div className={styles.form}>
                <label>
                  Medicamentos em uso
                  <textarea value={details.medications} onChange={(event) => updateDetail('medications', event.target.value)} />
                </label>
                <label>
                  Alergias
                  <textarea value={details.allergies} onChange={(event) => updateDetail('allergies', event.target.value)} />
                </label>
                <label>
                  Gestação ou lactação
                  <input value={details.pregnancy} onChange={(event) => updateDetail('pregnancy', event.target.value)} />
                </label>
                <label>
                  Função renal/hepática
                  <input value={details.renalHepatic} onChange={(event) => updateDetail('renalHepatic', event.target.value)} />
                </label>
                <label>
                  Outros fatores relevantes
                  <textarea value={details.otherFactors} onChange={(event) => updateDetail('otherFactors', event.target.value)} />
                </label>
              </div>
            )}

            {!result && selectedTool !== 'medication_review' && (
              <p className={styles.description}>A ferramenta usará as mensagens desta sessão como contexto.</p>
            )}

            {error && <p className={styles.error} role="alert">{error}</p>}
            {result && (
              <div className={styles.result}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            )}

            <div className={styles.footer}>
              <span>Confira contexto, exame, fontes e protocolo local antes de decidir.</span>
              {!result && (
                <button type="button" className={styles.generateButton} onClick={handleGenerate} disabled={loading}>
                  {loading ? 'Gerando...' : selectedTool === 'medication_review' ? 'Gerar revisão' : 'Gerar ferramenta'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

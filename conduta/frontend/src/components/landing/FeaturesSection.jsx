// frontend/src/components/landing/FeaturesSection.jsx
import styles from './FeaturesSection.module.scss';
import shared from './landing.module.scss';

const FEATURES = [
  {
    emoji: '🗣️',
    titulo: 'Fale como você pensa',
    descricao: 'Descreva o caso em português, do jeito que você relataria a um colega. Sem formulários, sem CID, sem estrutura forçada.',
    destaque: false,
  },
  {
    emoji: '📋',
    titulo: 'Baseado em protocolos nacionais',
    descricao: 'As sugestões de conduta seguem diretrizes do MS, PCDTs e sociedades médicas brasileiras — não IA genérica de internet.',
    destaque: false,
  },
  {
    emoji: '🚨',
    titulo: 'Red flags nunca passam despercebidos',
    descricao: 'O sistema identifica automaticamente sinais de alarme e critérios de encaminhamento — mesmo que você não tenha perguntado.',
    destaque: true,
  },
  {
    emoji: '🔁',
    titulo: 'Continue o raciocínio depois',
    descricao: 'Voltou o paciente em 48h? Pergunte de novo. O Conduta lembra do caso e ajusta a análise com base na evolução.',
    destaque: false,
  },
];

export default function FeaturesSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <p className={shared.sectionLabel}>Por que o Conduta funciona</p>
        <h2 className={shared.sectionTitle}>
          Não é o Google.<br />Não é o ChatGPT.<br />É clínico.
        </h2>

        <div className={styles.grid}>
          {FEATURES.map((f) => (
            <div
              key={f.titulo}
              className={`${styles.card} ${f.destaque ? styles.destaque : ''}`}
            >
              <span className={styles.emoji}>{f.emoji}</span>
              <strong className={styles.cardTitulo}>{f.titulo}</strong>
              <p className={styles.cardDesc}>{f.descricao}</p>
            </div>
          ))}
        </div>

        <div className={styles.privacidade}>
          <span className={styles.privIcon}>🔒</span>
          <div>
            <strong>Seus dados são seus</strong>
            <p>
              Nenhuma informação de paciente é armazenada com identificação. Você
              analisa casos — o Conduta não arquiva prontuários.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// frontend/src/components/landing/FaqSection.jsx
import { useState } from 'react';
import styles from './FaqSection.module.scss';
import shared from './landing.module.scss';

const PERGUNTAS = [
  {
    q: 'O Conduta substitui o médico ou o preceptor?',
    a: 'Não. O Conduta é uma ferramenta de apoio à decisão clínica — como um segundo par de olhos. A responsabilidade e o julgamento final são sempre do médico. Use como confirmação, não como substituição.',
  },
  {
    q: 'Os dados do meu paciente ficam salvos em algum lugar?',
    a: 'Não armazenamos dados identificáveis de pacientes. As análises são processadas e descartadas — você mantém o controle. Não insira nome, CPF ou dados que identifiquem o paciente.',
  },
  {
    q: 'Funciona para estudante de medicina também?',
    a: 'Sim — e é especialmente útil no internato e na residência. Se você é estudante e quer acesso, entre em contato pelo chat: temos condições especiais para quem está em formação.',
  },
  {
    q: 'As condutas são baseadas em quê?',
    a: 'Em protocolos clínicos e diretrizes terapêuticas brasileiras (PCDTs do Ministério da Saúde), guidelines de sociedades médicas nacionais e literatura clínica. O foco é atenção primária e pronto atendimento no contexto do SUS.',
  },
  {
    q: 'O plano grátis tem limite de tempo?',
    a: 'Não. As 15 análises são por mês, renovam todo mês, para sempre. Você não perde o acesso — só faz upgrade se quiser usar mais.',
  },
];

function FaqItem({ pergunta }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className={`${styles.item} ${aberto ? styles.aberto : ''}`}>
      <button
        className={styles.pergunta}
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
      >
        {pergunta.q}
        <span className={styles.icon}>{aberto ? '−' : '+'}</span>
      </button>
      {aberto && <p className={styles.resposta}>{pergunta.a}</p>}
    </div>
  );
}

export default function FaqSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <p className={shared.sectionLabel}>Dúvidas frequentes</p>
        <h2 className={shared.sectionTitle}>Antes de começar</h2>

        <div className={styles.lista}>
          {PERGUNTAS.map((p) => (
            <FaqItem key={p.q} pergunta={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import styles from './LegalPage.module.scss';

export default function TermosUso() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <p className={styles.brand}><Link to="/">← Conduta</Link></p>
        <h1 className={styles.title}>Termos de Uso</h1>
        <p className={styles.updated}>Última atualização: 11 de maio de 2026</p>

        <div className={styles.section}>
          <h2>1. Natureza do serviço</h2>
          <p>
            O Conduta é uma plataforma de apoio ao raciocínio clínico mediada por inteligência
            artificial. As análises geradas pelo sistema são sugestões baseadas em modelos de
            linguagem e em uma base de conhecimento clínico estruturada. O Conduta <strong>não
            realiza diagnóstico médico</strong>, não emite prescrições e não substitui a avaliação
            ou a conduta de um profissional de saúde habilitado.
          </p>
        </div>

        <div className={styles.section}>
          <h2>2. Público autorizado</h2>
          <p>O uso do Conduta é permitido exclusivamente a:</p>
          <ul>
            <li>Médicos com registro ativo no Conselho Regional de Medicina (CRM);</li>
            <li>
              Estudantes regularmente matriculados em curso de medicina, exclusivamente sob
              supervisão direta de profissional habilitado.
            </li>
          </ul>
          <p>O cadastro por pessoa fora desses perfis é expressamente vedado.</p>
        </div>

        <div className={styles.section}>
          <h2>3. Responsabilidade do usuário</h2>
          <p>
            Toda e qualquer decisão clínica — diagnóstica, terapêutica ou prescritiva — é de
            responsabilidade exclusiva do profissional que a tomar. O usuário reconhece que:
          </p>
          <ul>
            <li>O sistema pode conter erros, imprecisões ou informações desatualizadas;</li>
            <li>Todo output deve ser verificado criticamente antes de qualquer aplicação clínica;</li>
            <li>
              O uso da plataforma não elimina a obrigação de observar as normas do CFM e as boas
              práticas da medicina baseada em evidências.
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>4. Limitação de responsabilidade</h2>
          <p>
            Na máxima extensão permitida pela lei, o prestador do serviço não responde por danos
            diretos, indiretos, emergentes, incidentais, consequenciais ou punitivos decorrentes do
            uso ou da impossibilidade de uso da plataforma, incluindo, sem limitação, danos causados
            a pacientes ou a terceiros em razão de decisões clínicas baseadas nos outputs do sistema.
          </p>
        </div>

        <div className={styles.section}>
          <h2>5. Indenização</h2>
          <p>
            O usuário concorda em defender, indenizar e manter o prestador do serviço isento de
            quaisquer demandas, ações judiciais, responsabilidades, danos, perdas, custos e despesas
            (incluindo honorários advocatícios razoáveis) decorrentes de: (a) violação destes Termos;
            (b) uso indevido da plataforma; (c) atos ou omissões do usuário no exercício de suas
            atividades clínicas.
          </p>
        </div>

        <div className={styles.section}>
          <h2>6. Vedações</h2>
          <p>É expressamente vedado:</p>
          <ul>
            <li>Usar o Conduta para elaboração de laudos periciais, documentos médico-legais ou qualquer documento oficial;</li>
            <li>Automatizar decisões clínicas sem supervisão humana;</li>
            <li>Compartilhar credenciais de acesso;</li>
            <li>Inserir dados que permitam identificar pacientes (nome, CPF, data de nascimento, número de prontuário etc.);</li>
            <li>Usar a plataforma para finalidade diversa do apoio ao raciocínio clínico educacional.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>7. Alterações e rescisão</h2>
          <p>
            O prestador pode alterar estes Termos a qualquer momento, com notificação por e-mail ao
            usuário com antecedência mínima de 15 (quinze) dias. O uso continuado da plataforma após
            a vigência das alterações constitui aceite. O prestador pode suspender ou encerrar contas
            que violem estes Termos, sem aviso prévio, reservando-se o direito de excluir dados
            associados.
          </p>
        </div>

        <div className={styles.section}>
          <h2>8. Lei aplicável e foro</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir
            quaisquer controvérsias decorrentes deste instrumento, fica eleito o foro da Comarca de
            Mogi das Cruzes, Estado de São Paulo, com renúncia expressa a qualquer outro, por mais
            privilegiado que seja.
          </p>
        </div>

        <div className={styles.footer}>
          <Link to="/privacidade">Política de Privacidade</Link>
          {' · '}
          <a href="mailto:app.conduta@gmail.com">app.conduta@gmail.com</a>
        </div>
      </div>
    </div>
  );
}

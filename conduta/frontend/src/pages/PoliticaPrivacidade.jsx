import { Link } from 'react-router-dom';
import styles from './LegalPage.module.scss';

export default function PoliticaPrivacidade() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <p className={styles.brand}><Link to="/">← Conduta</Link></p>
        <h1 className={styles.title}>Política de Privacidade</h1>
        <p className={styles.updated}>Última atualização: 11 de maio de 2026</p>

        <div className={styles.section}>
          <h2>1. Dados coletados</h2>
          <p>Coletamos os seguintes dados pessoais:</p>
          <ul>
            <li>Nome completo e endereço de e-mail;</li>
            <li>Senha (armazenada em formato hash — nunca em texto claro);</li>
            <li>Textos dos casos clínicos inseridos na plataforma;</li>
            <li>Data e hora do cadastro e do aceite dos Termos de Uso;</li>
            <li>Endereço IP de acesso.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>2. Aviso importante — dados de pacientes</h2>
          <div className={styles.warning}>
            <p>
              <strong>Não insira, nos casos clínicos, informações que permitam identificar
              individualmente um paciente</strong> — tais como nome, CPF, RG, data de nascimento
              completa, número de prontuário ou qualquer outro dado pessoal sensível. O sigilo de
              informações de pacientes é dever do profissional de saúde, nos termos do Código de
              Ética Médica e da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). A
              responsabilidade pela inserção de tais dados é integralmente do usuário.
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <h2>3. Base legal</h2>
          <p>
            O tratamento de dados pessoais realizado nesta plataforma tem como base legal o
            consentimento do titular (art. 7º, inciso I, da LGPD), manifestado no momento do
            cadastro mediante marcação do campo de aceite, com registro de data e hora.
          </p>
        </div>

        <div className={styles.section}>
          <h2>4. Finalidade</h2>
          <p>Seus dados são utilizados para:</p>
          <ul>
            <li>Prestação do serviço de apoio ao raciocínio clínico;</li>
            <li>Manutenção e segurança da conta;</li>
            <li>Comunicações sobre o serviço (atualizações, avisos de alteração dos Termos);</li>
            <li>Melhoria da plataforma a partir de análise agregada e anonimizada de padrões de uso.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>5. Compartilhamento de dados</h2>
          <p>
            Os textos inseridos nos casos clínicos são processados pela API do{' '}
            <strong>OpenRouter</strong> (openrouter.ai), serviço de terceiro responsável pelo
            roteamento de requisições a modelos de linguagem. O OpenRouter processa esses dados de
            acordo com sua própria política de privacidade. Não realizamos venda, aluguel ou
            compartilhamento de dados pessoais para fins comerciais.
          </p>
        </div>

        <div className={styles.section}>
          <h2>6. Retenção</h2>
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa. Após o encerramento da conta,
            os dados são retidos por 12 (doze) meses e então eliminados, salvo quando a manutenção
            for necessária para cumprimento de obrigação legal ou regulatória.
          </p>
        </div>

        <div className={styles.section}>
          <h2>7. Seus direitos (LGPD)</h2>
          <p>Nos termos da LGPD, você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento de seus dados;</li>
            <li>Acessar seus dados pessoais;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
          <p>
            Para exercer esses direitos, entre em contato pelo e-mail indicado na seção 8. As
            solicitações serão respondidas em até 15 (quinze) dias úteis.
          </p>
        </div>

        <div className={styles.section}>
          <h2>8. Controlador</h2>
          <p>
            O tratamento de dados desta plataforma é realizado por:<br />
            <strong>Victor Jordan</strong> — CPF ***.278.258-**<br />
            E-mail: <a href="mailto:app.conduta@gmail.com">app.conduta@gmail.com</a>
          </p>
        </div>

        <div className={styles.footer}>
          <Link to="/termos">Termos de Uso</Link>
          {' · '}
          <a href="mailto:app.conduta@gmail.com">app.conduta@gmail.com</a>
        </div>
      </div>
    </div>
  );
}

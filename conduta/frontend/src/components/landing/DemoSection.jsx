// frontend/src/components/landing/DemoSection.jsx
import { useState, useEffect } from 'react';
import styles from './DemoSection.module.scss';
import shared from './landing.module.scss';

const FASE = { INICIAL: 0, USUARIO: 1, ANALISANDO: 2, RESPOSTA: 3 };

export default function DemoSection() {
  const [fase, setFase] = useState(FASE.INICIAL);

  useEffect(() => {
    const t1 = setTimeout(() => setFase(FASE.USUARIO), 600);
    const t2 = setTimeout(() => setFase(FASE.ANALISANDO), 1800);
    const t3 = setTimeout(() => setFase(FASE.RESPOSTA), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <div className={styles.header}>
          <p className={shared.sectionLabel}>Veja como funciona</p>
          <h2 className={shared.sectionTitle}>Descreva o caso.<br />Receba a análise.</h2>
          <p className={shared.sectionSubtitle}>
            Em linguagem natural, do jeito que você relataria para um colega.
          </p>
        </div>

        <div className={styles.chatWrap}>
          <div className={styles.chatBar}>
            <span className={styles.chatDot} />
            <span className={styles.chatBarTitle}>Conduta — Nova análise</span>
          </div>

          <div className={styles.chatBody}>
            {fase >= FASE.USUARIO && (
              <div className={`${styles.msgUser} ${styles.fadeIn}`}>
                Paciente feminina, 28 anos, G2P1, 34 semanas, refere cefaleia
                intensa há 2h, PA 160x110, edema +++ MMII, proteinúria 2+. Sem
                convulsões até o momento.
              </div>
            )}

            {fase === FASE.ANALISANDO && (
              <div className={`${styles.msgTyping} ${styles.fadeIn}`}>
                Analisando caso clínico...
              </div>
            )}

            {fase >= FASE.RESPOSTA && (
              <div className={`${styles.msgBot} ${styles.fadeIn}`}>
                <div className={styles.botLine}>
                  <span className={styles.success}>✓ HIPÓTESE PRINCIPAL</span>
                  <span className={styles.botValue}>Pré-eclâmpsia grave (iminência de eclâmpsia)</span>
                </div>
                <div className={styles.botLine}>
                  <span className={styles.warnLabel}>⚠ RED FLAGS ATIVOS</span>
                  <span className={styles.botValue}>
                    PA ≥ 160×110 + proteinúria + cefaleia = critérios de gravidade.
                    Risco de convulsão iminente.
                  </span>
                </div>
                <div className={styles.botLine}>
                  <span className={styles.mutedLabel}>→ CONDUTA IMEDIATA</span>
                  <span className={styles.botValue}>
                    1. Sulfato de magnésio (4g EV em 20 min)<br />
                    2. Anti-hipertensivo IV (Hidralazina ou Nifedipino)<br />
                    3. Acionar GO de plantão <strong>agora</strong><br />
                    4. Preparar para parto de urgência
                  </span>
                </div>
                <div className={styles.urgencia}>
                  🚨 NÃO aguardar evolução. Encaminhamento imediato.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

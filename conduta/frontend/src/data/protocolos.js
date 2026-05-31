// frontend/src/data/protocolos.js

export const protocolos = [
  {
    slug: 'sri',
    titulo: 'Sequência Rápida de Intubação',
    icone: '🫁',
    categoria: 'via-aerea',
    tags: ['via aérea', 'emergência'],
    fases: [
      {
        nome: 'Preparação (0–5 min)',
        passos: [
          { tipo: 'acao', texto: 'Verificar equipamento: laringoscópio (lâmina funcionando), cânula 7,0–8,0 adulto, guia maleável, seringa 10 mL' },
          { tipo: 'acao', texto: 'Confirmar aspiração disponível e funcionando' },
          { tipo: 'acao', texto: 'Conectar capnografia, oxímetro e monitor cardíaco' },
          { tipo: 'acao', texto: 'Garantir acesso venoso pérvio' },
          { tipo: 'acao', texto: 'Pré-oxigenar com O₂ 100% por 3–5 min — alvo SpO₂ > 94%' },
          { tipo: 'acao', texto: 'Posicionar em sniffing position: coxim suboccipital de 7–10 cm, orelha alinhada com o esterno' },
          { tipo: 'droga', nome: 'Atropina', dose: '0,5 mg IV', obs: 'se FC < 60 bpm ou paciente pediátrico' },
        ],
      },
      {
        nome: 'Pré-medicação (3–5 min antes)',
        passos: [
          { tipo: 'droga', nome: 'Fentanil', dose: '1–3 mcg/kg IV lento (2 min)', obs: 'omitir se choque ou hipotensão' },
          { tipo: 'droga', nome: 'Lidocaína', dose: '1,5 mg/kg IV', obs: 'opcional — indicado em TCE ou broncoespasmo' },
        ],
      },
      {
        nome: 'Indução e Paralisia (tempo zero)',
        passos: [
          { tipo: 'acao', texto: 'Escolher agente indutor conforme hemodinâmica:' },
          { tipo: 'droga', nome: 'Etomidato', dose: '0,3 mg/kg IV', obs: 'hemodinamicamente estável — 1ª escolha' },
          { tipo: 'droga', nome: 'Cetamina', dose: '1–2 mg/kg IV', obs: 'choque, broncoespasmo ou sem acesso a etomidato' },
          { tipo: 'droga', nome: 'Propofol', dose: '1,5–2 mg/kg IV', obs: 'apenas se estável e sem risco de hipotensão' },
          { tipo: 'acao', texto: 'Imediatamente após o indutor, aplicar bloqueador neuromuscular:' },
          { tipo: 'droga', nome: 'Succinilcolina', dose: '1,5 mg/kg IV', obs: '1ª escolha — ação em 45–60s' },
          { tipo: 'droga', nome: 'Rocurônio', dose: '1,2 mg/kg IV', obs: 'se contraindicação à succinilcolina — ação em 60–90s' },
          { tipo: 'alerta', texto: 'NÃO usar succinilcolina em: hipercalemia, rabdomiólise, queimaduras extensas (> 24h), lesão medular crônica, miopatias ou histórico de hipertermia maligna' },
        ],
      },
      {
        nome: 'Intubação (30–60s após paralisia)',
        passos: [
          { tipo: 'acao', texto: 'Pressão cricóide (Sellick): uso rotineiro NÃO recomendado — RCT com 3.472 pacientes não demonstrou redução de aspiração e aumentou dificuldade de laringoscopia (Birenbaum et al.). Omitir na prática padrão; liberar imediatamente se dificultar visualização (DAS 2022; BJA Education 2022)' },
          { tipo: 'acao', texto: 'Realizar laringoscopia direta ou videolaringoscopia' },
          { tipo: 'acao', texto: 'Passar cânula com guia, retirar o guia após passagem pelas cordas vocais' },
          { tipo: 'acao', texto: 'Inflar cuff com 5–10 mL de ar' },
          { tipo: 'acao', texto: 'Confirmar posição: capnografia (curva quadrada) + ausculta bilateral + ausência de borbulhamento gástrico' },
          { tipo: 'acao', texto: 'Fixar cânula com esparadrapo ou cadarço — profundidade: 21–23 cm na comissura labial em adultos' },
          { tipo: 'alerta', texto: 'Limite de 2 tentativas de laringoscopia. Na falha → ventilação BVM + considerar dispositivo supraglótico (máscara laríngea) e acionar ajuda' },
        ],
      },
      {
        nome: 'Pós-intubação',
        passos: [
          { tipo: 'acao', texto: 'Ajustar ventilação mecânica: volume corrente 6–8 mL/kg peso ideal, FR 12–16, PEEP 5 cmH₂O' },
          { tipo: 'droga', nome: 'Midazolam', dose: '0,05–0,1 mg/kg IV', obs: 'sedação de manutenção' },
          { tipo: 'droga', nome: 'Fentanil', dose: '1–2 mcg/kg IV', obs: 'analgesia de manutenção' },
          { tipo: 'acao', texto: 'RX de tórax para confirmar posição da cânula' },
          { tipo: 'acao', texto: 'Gasometria arterial em 30 min' },
        ],
      },
    ],
    referencia: 'Miller\'s Anesthesia 9ª ed. / UpToDate: Rapid sequence intubation in adults (2024) / DAS RSI Guidelines (BJA Education 2022)',
  },

  {
    slug: 'pcr',
    titulo: 'Parada Cardiorrespiratória (ACLS)',
    icone: '❤️',
    categoria: 'cardiovascular',
    tags: ['cardiovascular', 'emergência'],
    fases: [
      {
        nome: 'Reconhecimento (0–10s)',
        passos: [
          { tipo: 'acao', texto: 'Verificar responsividade: chamar pelo nome e aplicar estímulo esternal' },
          { tipo: 'acao', texto: 'Checar pulso (carótida) e respiração simultaneamente por < 10s' },
          { tipo: 'acao', texto: 'Acionar ajuda + solicitar desfibrilador' },
          { tipo: 'alerta', texto: 'Gasping (respiração agônica) NÃO é respiração efetiva — tratar como PCR e iniciar RCP imediatamente' },
        ],
      },
      {
        nome: 'RCP de Alta Qualidade',
        passos: [
          { tipo: 'acao', texto: 'Compressões torácicas: frequência 100–120/min, profundidade 5–6 cm, recolhimento torácico completo entre compressões' },
          { tipo: 'acao', texto: 'Minimizar interrupções: pausas < 10s para análise de ritmo ou desfibrilação' },
          { tipo: 'acao', texto: 'Relação compressão:ventilação = 30:2 sem via aérea avançada; contínua (10 vent/min) com via aérea avançada' },
          { tipo: 'acao', texto: 'Trocar o compressor a cada 2 min para evitar fadiga' },
          { tipo: 'acao', texto: 'Garantir acesso venoso ou intraósseo (IO)' },
        ],
      },
      {
        nome: 'Ritmos Chocáveis: FV / TV sem pulso',
        passos: [
          { tipo: 'acao', texto: 'Desfibrilar: 200 J bifásico (ou carga máxima do equipamento disponível)' },
          { tipo: 'acao', texto: 'Reiniciar RCP imediatamente após o choque — não pausar para checar ritmo' },
          { tipo: 'acao', texto: 'Checar ritmo após 2 min de RCP; se chocável → desfibrilar novamente' },
          { tipo: 'droga', nome: 'Epinefrina', dose: '1 mg IV/IO a cada 3–5 min', obs: 'iniciar após o 2º choque sem retorno de circulação' },
          { tipo: 'droga', nome: 'Amiodarona', dose: '300 mg IV/IO (1ª dose); 150 mg (2ª dose)', obs: 'após o 3º choque sem retorno; alternativa equivalente: Lidocaína 1–1,5 mg/kg (ALPS trial)' },
          { tipo: 'acao', texto: 'FV refratária (≥ 3 choques sem RCE): considerar desfibrilação sequencial dupla (DSED) ou mudança de vetor (anterior-posterior) — ambos superiores à desfibrilação padrão em FV refratária (DOSE VF, NEJM 2022; ILCOR CoSTR 2023)' },
        ],
      },
      {
        nome: 'Ritmos Não Chocáveis: AESP / Assistolia',
        passos: [
          { tipo: 'droga', nome: 'Epinefrina', dose: '1 mg IV/IO a cada 3–5 min', obs: 'iniciar o mais rápido possível' },
          { tipo: 'acao', texto: 'RCP contínua; checar ritmo a cada 2 min' },
          { tipo: 'acao', texto: 'Identificar e tratar causas reversíveis — 5H e 5T:' },
          { tipo: 'acao', texto: '5H: Hipovolemia, Hipóxia, H⁺ (acidose), Hipo/Hipercalemia, Hipotermia' },
          { tipo: 'acao', texto: '5T: Tensão (pneumotórax), Tamponamento cardíaco, Tóxicos, Trombose pulmonar (TEP), Trombose coronariana (IAM)' },
        ],
      },
      {
        nome: 'Retorno da Circulação Espontânea (RCE)',
        passos: [
          { tipo: 'acao', texto: 'O₂ alvo: SpO₂ 94–98% — evitar hiperóxia (↑ lesão cerebral)' },
          { tipo: 'acao', texto: 'PA sistólica alvo: ≥ 90 mmHg; PAM ≥ 65 mmHg' },
          { tipo: 'droga', nome: 'Norepinefrina', dose: '0,1–0,5 mcg/kg/min IV', obs: 'se hipotensão pós-RCE' },
          { tipo: 'acao', texto: 'Controle de temperatura: manter 32–37,5°C — alvo mínimo é prevenir febre (temperatura > 37,5°C) por ≥ 36h. Hipotermia ativa (32–36°C) não é mandatória — individualizar; normotermia estrita é aceitável (TTM2, NEJM 2021; AHA 2025 Part 11)' },
          { tipo: 'acao', texto: 'ECG 12 derivações imediatamente — descartar IAMCSST (angioplastia emergencial se identificado)' },
          { tipo: 'acao', texto: 'Internação em UTI' },
        ],
      },
    ],
    referencia: 'AHA Guidelines para RCP e ECC 2025 — Part 9: ACLS (Circulation. DOI: 10.1161/CIR.0000000000001376) / Part 11: Post-Cardiac Arrest Care (DOI: 10.1161/CIR.0000000000001375)',
  },

  {
    slug: 'anafilaxia',
    titulo: 'Anafilaxia',
    icone: '⚠️',
    categoria: 'infeccioso',
    tags: ['alergia', 'emergência'],
    fases: [
      {
        nome: 'Reconhecimento',
        passos: [
          { tipo: 'acao', texto: 'Critério 1 (mais comum): início agudo envolvendo pele/mucosa + comprometimento respiratório OU hipotensão' },
          { tipo: 'acao', texto: 'Critério 2: ≥ 2 dos seguintes após exposição a alérgeno provável: pele/mucosa, respiratório, PA, GI persistente' },
          { tipo: 'acao', texto: 'Critério 3: hipotensão após exposição a alérgeno conhecido' },
          { tipo: 'acao', texto: 'Remover agente desencadeante se possível (ex: suspender infusão IV, remover ferrão)' },
        ],
      },
      {
        nome: 'Tratamento Imediato (1ª linha)',
        passos: [
          { tipo: 'droga', nome: 'Epinefrina', dose: '0,3–0,5 mg IM (face anterolateral da coxa)', obs: 'pode repetir a cada 5–15 min; usar 0,01 mg/kg em crianças (máx 0,5 mg)' },
          { tipo: 'alerta', texto: 'Epinefrina é o ÚNICO tratamento de 1ª linha — nunca atrasar por anti-histamínico ou corticoide' },
          { tipo: 'acao', texto: 'Posição: decúbito dorsal com MMII elevados (exceto se dispneia ou vômito → sentar)' },
          { tipo: 'acao', texto: 'O₂ suplementar: 8–10 L/min máscara não-reinalante' },
          { tipo: 'acao', texto: 'Acesso venoso; SF 0,9%: 1–2 L em bolus se hipotensão (20 mL/kg em crianças)' },
          { tipo: 'droga', nome: 'Epinefrina IV', dose: '0,1–0,5 mcg/kg/min', obs: 'apenas se choque refratário a epinefrina IM repetida + volume' },
        ],
      },
      {
        nome: 'Tratamento de Suporte (2ª linha)',
        passos: [
          { tipo: 'droga', nome: 'Difenidramina', dose: '25–50 mg IV/IM', obs: 'anti-histamínico H1 — alivia urticária e prurido' },
          { tipo: 'droga', nome: 'Famotidina', dose: '20 mg IV em 15–30 min', obs: 'anti-histamínico H2 — substitui a ranitidina (retirada do mercado mundial em 2020 por contaminação com NDMA). Benefício limitado e não recomendado de rotina (WAO 2023); pode aliviar urticária quando associada a anti-H1' },
          { tipo: 'droga', nome: 'Metilprednisolona', dose: '125 mg IV', obs: 'previne reação bifásica — efeito em 4–6h' },
          { tipo: 'droga', nome: 'Salbutamol inalatório', dose: '2,5–5 mg nebulizado', obs: 'se broncoespasmo persistente após epinefrina' },
        ],
      },
      {
        nome: 'Alta e Prevenção',
        passos: [
          { tipo: 'acao', texto: 'Observação mínima de 4–6h (risco de reação bifásica em até 72h; internar casos graves)' },
          { tipo: 'acao', texto: 'Prescrever epinefrina autoinjetável (EpiPen) ao alta com orientação de uso' },
          { tipo: 'acao', texto: 'Encaminhar para alergologista para investigação e imunoterapia' },
          { tipo: 'acao', texto: 'Registrar o agente desencadeante no prontuário e orientar a evitar' },
        ],
      },
    ],
    referencia: 'WAO Guidelines on Anaphylaxis 2023 / SBAI Consenso 2021',
  },

  {
    slug: 'avc-agudo',
    titulo: 'AVC Agudo',
    icone: '🧠',
    categoria: 'neurologico',
    tags: ['neurologia', 'emergência'],
    fases: [
      {
        nome: 'Reconhecimento — Escala FAST',
        passos: [
          { tipo: 'acao', texto: 'F — Face: pedir para sorrir → assimetria facial?' },
          { tipo: 'acao', texto: 'A — Arms: pedir para elevar os braços → queda unilateral?' },
          { tipo: 'acao', texto: 'S — Speech: pedir para repetir frase simples → fala arrastada ou confusa?' },
          { tipo: 'acao', texto: 'T — Time: registrar EXATAMENTE a hora do início dos sintomas ou a última vez que foi visto bem' },
          { tipo: 'alerta', texto: 'A hora exata do início dos sintomas define a janela terapêutica. Se o paciente acordou com déficit, considerar horário em que foi visto bem pela última vez' },
        ],
      },
      {
        nome: 'Avaliação Inicial (0–25 min)',
        passos: [
          { tipo: 'acao', texto: 'TC de crânio SEM contraste imediatamente — excluir hemorragia antes de qualquer anticoagulante' },
          { tipo: 'acao', texto: 'Glicemia capilar: hipoglicemia (< 60 mg/dL) mimetiza AVC — corrigir antes de qualquer conduta' },
          { tipo: 'acao', texto: 'PA, FC, SpO₂, temperatura' },
          { tipo: 'acao', texto: 'Exames: coagulograma (INR, TTPA), função renal, hemograma, plaquetas, tipo sanguíneo' },
          { tipo: 'acao', texto: 'Acesso venoso (evitar acesso subclávia — risco de sangramento se trombolítico)' },
          { tipo: 'acao', texto: 'O₂ suplementar apenas se SpO₂ < 94%' },
          { tipo: 'acao', texto: 'Escala NIHSS para avaliar gravidade e acompanhar evolução' },
        ],
      },
      {
        nome: 'AVC Isquêmico — Trombólise IV (25–60 min)',
        passos: [
          { tipo: 'acao', texto: 'Janela: ≤ 4,5 horas do início dos sintomas' },
          { tipo: 'acao', texto: 'Verificar contraindicações ANTES de administrar:' },
          { tipo: 'acao', texto: 'Contraindicações absolutas: cirurgia maior ou trauma grave < 3 meses, AVC hemorrágico prévio, sangramento ativo, PA > 185/110 não controlada, INR > 1,7, plaquetas < 100.000' },
          { tipo: 'droga', nome: 'Alteplase (rt-PA)', dose: '0,9 mg/kg IV (máx 90 mg): 10% em bolus 1 min + 90% em infusão 60 min', obs: 'iniciar dentro de 60 min da chegada (meta "porta-agulha" < 60 min)' },
          { tipo: 'droga', nome: 'Tenecteplase (TNK)', dose: '0,25 mg/kg IV bolus único (máx 25 mg)', obs: 'alternativa equivalente à Alteplase — administração mais simples (bolus único vs infusão 60 min). Classe I, NE-A (AHA/ASA 2026). No Brasil: uso off-label em AVC; disponível para IAM' },
          { tipo: 'acao', texto: 'Controle de PA antes e durante o tPA: manter < 185/110 mmHg' },
          { tipo: 'droga', nome: 'Labetalol', dose: '10–20 mg IV', obs: 'se PA > 185/110 antes do tPA' },
        ],
      },
      {
        nome: 'Monitorização Pós-tPA',
        passos: [
          { tipo: 'acao', texto: 'PA: a cada 15 min por 2h → a cada 30 min por 6h → a cada 1h por 16h' },
          { tipo: 'acao', texto: 'Alvo de PA após tPA: < 180/105 mmHg' },
          { tipo: 'acao', texto: 'Nada via oral até avaliação de deglutição por fonoaudiólogo' },
          { tipo: 'acao', texto: 'Internar em Unidade de AVC (stroke unit) ou UTI' },
          { tipo: 'alerta', texto: 'Se surgir cefaleia intensa, vômito ou piora neurológica pós-tPA → suspeitar sangramento intracraniano: parar infusão, TC urgente' },
        ],
      },
      {
        nome: 'AVC Hemorrágico',
        passos: [
          { tipo: 'acao', texto: 'PA sistólica alvo: < 140 mmHg (iniciar imediatamente)' },
          { tipo: 'droga', nome: 'Labetalol', dose: '10–20 mg IV bolus, repetir a cada 10 min (máx 300 mg)', obs: '1ª escolha' },
          { tipo: 'droga', nome: 'Nicardipina', dose: '5 mg/h IV (aumentar 2,5 mg/h a cada 5–15 min, máx 15 mg/h)', obs: 'alternativa ao labetalol' },
          { tipo: 'acao', texto: 'Reverter anticoagulação se em uso: Vit K 10 mg IV + CCP 4 fatores (ou FFP se CCP indisponível) para warfarina; Andexanet alfa para apixabana/rivaroxabana; Idarucizumabe 5 g IV (Praxbind) para dabigatrana; Sulfato de protamina para heparina' },
          { tipo: 'acao', texto: 'Avaliação neurocirúrgica urgente' },
        ],
      },
    ],
    referencia: '2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke — AHA/ASA (Stroke. 2026. DOI: 10.1161/STR.0000000000000513)',
  },

  {
    slug: 'sepse',
    titulo: 'Sepse',
    icone: '🦠',
    categoria: 'infeccioso',
    tags: ['infecção', 'emergência'],
    fases: [
      {
        nome: 'Reconhecimento — qSOFA',
        passos: [
          { tipo: 'acao', texto: 'qSOFA ≥ 2 pontos → suspeita de sepse: FR ≥ 22/min (1 pt), alteração mental / Glasgow < 15 (1 pt), PAS ≤ 100 mmHg (1 pt)' },
          { tipo: 'acao', texto: 'Choque séptico: sepse + necessidade de vasopressor + lactato > 2 mmol/L após reposição adequada' },
          { tipo: 'acao', texto: 'SOFA score para confirmar disfunção orgânica (aumento ≥ 2 pontos em relação ao basal)' },
        ],
      },
      {
        nome: 'Bundle 1 hora (iniciar imediatamente)',
        passos: [
          { tipo: 'acao', texto: 'Colher 2 pares de hemoculturas (aeróbia + anaeróbia) de sítios diferentes ANTES dos antibióticos — não atrasar antibiótico > 45 min pela coleta' },
          { tipo: 'acao', texto: 'Dosar lactato arterial (se > 2 mmol/L → hipoperfusão; > 4 mmol/L → choque séptico)' },
          { tipo: 'droga', nome: 'Antibióticos empíricos IV', dose: 'iniciar em até 1h do reconhecimento', obs: 'guiar pelo foco suspeito:' },
          { tipo: 'acao', texto: 'Foco comunitário/respiratório: Ceftriaxona 2 g IV + Azitromicina 500 mg IV' },
          { tipo: 'acao', texto: 'Foco abdominal: Piperacilina-Tazobactam 4,5 g IV a cada 6h' },
          { tipo: 'acao', texto: 'Foco urinário sem fator de risco: Ceftriaxona 1–2 g IV' },
          { tipo: 'acao', texto: 'Suspeita de bacteremia/neutropênico: Meropenem 1 g IV a cada 8h + Vancomicina 25–30 mg/kg (dose de ataque)' },
          { tipo: 'acao', texto: 'Reposição volêmica: Ringer Lactato (preferencial) ou SF 0,9% — 30 mL/kg IV em até 3h se PA baixa ou lactato ≥ 4 mmol/L. Após a carga inicial: reavaliar responsividade a fluidos (elevação passiva dos membros, variação de pressão de pulso) antes de continuar infusão' },
        ],
      },
      {
        nome: 'Avaliação de Resposta (após reposição)',
        passos: [
          { tipo: 'acao', texto: 'Reavaliar hemodinâmica: PA, diurese (alvo > 0,5 mL/kg/h), lactato de controle' },
          { tipo: 'acao', texto: 'Sinais de sobrecarga hídrica (crepitações, PVC alta, SpO₂ caindo) → suspender volume e considerar vasopressor' },
          { tipo: 'droga', nome: 'Norepinefrina', dose: '0,1–0,3 mcg/kg/min IV (titular para PAM ≥ 65)', obs: 'vasopressor de 1ª escolha no choque séptico' },
          { tipo: 'droga', nome: 'Vasopressina', dose: '0,03–0,04 UI/min IV fixo', obs: 'adicionar se norepinefrina ≥ 0,25 mcg/kg/min' },
          { tipo: 'droga', nome: 'Hidrocortisona', dose: '200 mg/dia IV (50 mg a cada 6h ou infusão contínua)', obs: 'choque refratário: PAM < 65 com vasopressor há > 1h' },
        ],
      },
      {
        nome: 'Controle do Foco e Deescalonamento',
        passos: [
          { tipo: 'acao', texto: 'Identificar e controlar foco: drenagem de abscesso, remoção de cateter infectado, cirurgia se indicada — fazer em até 6–12h' },
          { tipo: 'acao', texto: 'Reavaliar antibiótico em 48–72h: resultados de cultura → deescalonamento para antibiótico de menor espectro' },
          { tipo: 'acao', texto: 'Duração do antibiótico: mínimo 5–7 dias; guiar por marcadores clínicos e PCR/procalcitonina' },
          { tipo: 'acao', texto: 'Controle glicêmico: manter glicemia < 180 mg/dL com insulina IV se necessário' },
        ],
      },
    ],
    referencia: 'Surviving Sepsis Campaign International Guidelines 2021',
  },

  {
    slug: 'eme',
    titulo: 'Estado de Mal Epiléptico',
    icone: '⚡',
    categoria: 'neurologico',
    tags: ['neurologia', 'emergência'],
    fases: [
      {
        nome: 'Fase 1 — Crise ≥ 5 min (0–5 min)',
        passos: [
          { tipo: 'acao', texto: 'Proteger via aérea: posição lateral de segurança, remover objetos próximos, não colocar nada na boca' },
          { tipo: 'acao', texto: 'O₂ suplementar 4–6 L/min via cânula nasal ou máscara' },
          { tipo: 'acao', texto: 'Glicemia capilar imediata — se < 60 mg/dL: Glicose 50% 50 mL IV (+ Tiamina 100 mg IV se suspeita de alcoolismo)' },
          { tipo: 'acao', texto: 'Acesso venoso (se não disponível → Midazolam IM)' },
          { tipo: 'droga', nome: 'Diazepam', dose: '10 mg IV lento (2–5 min)', obs: 'se acesso venoso; pode repetir 1x após 5 min' },
          { tipo: 'droga', nome: 'Midazolam', dose: '10 mg IM (coxa)', obs: 'SEM acesso venoso — mesma eficácia que lorazepam IV' },
          { tipo: 'droga', nome: 'Lorazepam', dose: '4 mg IV (2 mg/min)', obs: 'se disponível — 1ª escolha IV nos países onde é disponível' },
        ],
      },
      {
        nome: 'Fase 2 — Persistência após 5 min (5–20 min)',
        passos: [
          { tipo: 'acao', texto: 'Iniciar antiepiléptico de segunda linha imediatamente se crise continua após benzodiazepínico' },
          { tipo: 'droga', nome: 'Valproato de Sódio', dose: '40 mg/kg IV em 10 min (máx 3.000 mg)', obs: '1ª escolha na fase 2 — menos hipotensão' },
          { tipo: 'droga', nome: 'Levetiracetam', dose: '60 mg/kg IV em 15 min (máx 4.500 mg)', obs: 'alternativa ao valproato — boa tolerabilidade' },
          { tipo: 'droga', nome: 'Fenitoína', dose: '20 mg/kg IV (máx 50 mg/min)', obs: 'perfil de segurança INFERIOR ao Valproato e Levetiracetam (hipotensão, arritmias, síndrome de hipersensibilidade, necrose por extravasamento) — usar apenas se ambos indisponíveis (ESETT trial, NEJM 2019; ILAE 2022). Monitorar ECG e PA. Evitar em crianças.' },
          { tipo: 'droga', nome: 'Fosfenitoína', dose: '20 mg EFT/kg IV ou IM', obs: 'pró-fármaco da fenitoína — infusão mais rápida, menos cardiotóxico' },
          { tipo: 'alerta', texto: 'Valproato CONTRAINDICADO em doenças mitocondriais, gestação (1º trimestre) e hepatopatia grave' },
        ],
      },
      {
        nome: 'Fase 3 — EME Refratário ≥ 30 min',
        passos: [
          { tipo: 'acao', texto: 'Intubação orotraqueal (SRI) + ventilação mecânica' },
          { tipo: 'acao', texto: 'Internação em UTI com EEG contínuo' },
          { tipo: 'droga', nome: 'Midazolam', dose: '0,2 mg/kg IV bolus + infusão 0,05–2 mg/kg/h', obs: '1ª escolha para anestesia geral' },
          { tipo: 'droga', nome: 'Propofol', dose: '2 mg/kg IV bolus + infusão 1–10 mg/kg/h', obs: 'alternativa; atenção à síndrome do propofol com doses altas > 48h' },
          { tipo: 'droga', nome: 'Fenobarbital', dose: '20 mg/kg IV (máx 100 mg/min)', obs: 'alternativa se sem acesso a midazolam/propofol' },
        ],
      },
      {
        nome: 'Investigação Etiológica',
        passos: [
          { tipo: 'acao', texto: 'TC de crânio (excluir lesão estrutural, hemorragia, tumor)' },
          { tipo: 'acao', texto: 'Punção lombar se TC normal e suspeita de encefalite/meningite (febre, rigidez de nuca, pleocitose)' },
          { tipo: 'acao', texto: 'Eletrólitos: sódio, cálcio, magnésio (hipo/hipernatremia e hipocalcemia causam convulsões)' },
          { tipo: 'acao', texto: 'Painel toxicológico em urina (cocaína, anfetaminas, isoniazida, teofilina)' },
          { tipo: 'acao', texto: 'Considerar: painel de encefalite autoimune (Anti-NMDA, LGI1, CASPR2) se EME de etiologia obscura' },
        ],
      },
    ],
    referencia: 'Epilepsy Foundation EME Guidelines 2016 / ILAE 2022 / ESETT Trial NEJM 2019 / Protocolo HCFMUSP',
  },

  {
    slug: 'cad',
    titulo: 'Cetoacidose Diabética',
    icone: '💉',
    categoria: 'metabolico',
    tags: ['metabolismo', 'diabetes'],
    fases: [
      {
        nome: 'Diagnóstico',
        passos: [
          { tipo: 'acao', texto: 'Critérios diagnósticos: Glicemia > 250 mg/dL + pH arterial < 7,3 + Bicarbonato < 18 mEq/L + Cetonas positivas (urina ou sangue)' },
          { tipo: 'acao', texto: 'Calcular anion gap = Na - (Cl + HCO₃) → normal: 8–12; na CAD tipicamente > 16' },
          { tipo: 'acao', texto: 'Calcular déficit hídrico (média 3–5 L em adultos, até 10 L em casos graves)' },
          { tipo: 'acao', texto: 'Exames: gasometria, eletrólitos, função renal, hemograma, cetonúria, ECG (hipercalemia)' },
          { tipo: 'alerta', texto: 'O potássio sérico PARECE normal ou alto na apresentação (acidose redistribui K⁺ para extracelular), mas o potássio corporal TOTAL está depletado — repor assim que diurese retomar e K < 5,5' },
        ],
      },
      {
        nome: 'Reposição Hídrica',
        passos: [
          { tipo: 'droga', nome: 'Ringer Lactato ou SF 0,9%', dose: '1 L IV na 1ª hora', obs: 'Ringer Lactato preferível — menor risco de acidose hiperclorêmica (meta-análise de 11 RCTs, Frontiers Endocrinol. 2024; ADA 2024). SF 0,9% aceitável. Exceto ICC grave ou insuficiência renal terminal' },
          { tipo: 'acao', texto: 'Próximas 4h: SF 0,9% 500 mL/h (ajustar conforme PA, diurese e sódio corrigido)' },
          { tipo: 'acao', texto: 'Quando glicemia < 250 mg/dL: trocar para SG 5% + SF 0,45% (manter glicemia 150–250 mg/dL até resolução da acidose)' },
          { tipo: 'acao', texto: 'Colocar sonda vesical se paciente obnubilado — medir diurese hora a hora' },
        ],
      },
      {
        nome: 'Reposição de Potássio',
        passos: [
          { tipo: 'alerta', texto: 'NÃO iniciar insulina se K < 3,5 mEq/L (risco de hipocalemia grave e arritmia fatal)' },
          { tipo: 'droga', nome: 'KCl', dose: '40 mEq/h IV', obs: 'se K < 3,5 mEq/L — repor antes de insulina; checar K a cada 2h' },
          { tipo: 'droga', nome: 'KCl', dose: '20–30 mEq/h IV', obs: 'se K 3,5–5,5 mEq/L — repor junto com a insulina' },
          { tipo: 'acao', texto: 'Se K > 5,5 mEq/L: não repor; checar a cada 2h' },
        ],
      },
      {
        nome: 'Insulinoterapia',
        passos: [
          { tipo: 'acao', texto: 'Iniciar apenas após confirmar K > 3,5 mEq/L' },
          { tipo: 'droga', nome: 'Insulina Regular', dose: '0,1 UI/kg/h IV em bomba de infusão contínua', obs: 'diluir 100 UI em 100 mL SF 0,9% = 1 UI/mL' },
          { tipo: 'acao', texto: 'Meta: queda de glicemia 50–75 mg/dL/h; se > 100 mg/dL/h → reduzir dose de insulina' },
          { tipo: 'acao', texto: 'Alternativa sem bomba de infusão: Insulina Regular 0,2 UI/kg SC a cada 2h (NPH até resolução da CAD)' },
          { tipo: 'acao', texto: 'Não suspender insulina IV até resolução da acidose (pH > 7,3 e HCO₃ > 18) — trocar para insulina SC 2h antes de suspender a bomba' },
        ],
      },
      {
        nome: 'Monitorização e Critérios de Resolução',
        passos: [
          { tipo: 'acao', texto: 'Glicemia capilar: a cada 1h' },
          { tipo: 'acao', texto: 'Eletrólitos (K⁺, Na⁺): a cada 2h nas primeiras 6h, depois a cada 4h' },
          { tipo: 'acao', texto: 'Gasometria arterial: a cada 4h' },
          { tipo: 'acao', texto: 'Critérios de resolução (TODOS os 3): pH > 7,3 + Bicarbonato > 18 mEq/L + Anion gap normalizado (< 12)' },
          { tipo: 'alerta', texto: 'NÃO usar bicarbonato de sódio na CAD (exceto pH < 7,0 com instabilidade hemodinâmica) — aumenta risco de hipocalemia e acidose paradoxal no SNC' },
        ],
      },
    ],
    referencia: 'ADA Standards of Care 2024 / Kitabchi et al. Diabetes Care 2009 / Fluidos na CAD: meta-análise Frontiers Endocrinol. 2024 (11 RCTs, 753 pacientes)',
  },

  {
    slug: 'sca',
    titulo: 'Síndrome Coronariana Aguda',
    icone: '🫀',
    categoria: 'cardiovascular',
    tags: ['cardiovascular', 'emergência'],
    fases: [
      {
        nome: 'Reconhecimento e ECG',
        passos: [
          { tipo: 'acao', texto: 'ECG 12 derivações em < 10 min do contato — repetir em 15–30 min se normal e suspeita persistir' },
          { tipo: 'acao', texto: 'IAMCSST: supradesnivelamento ≥ 1 mm em ≥ 2 derivações contíguas; ou novo BRE; ou padrão de De Winter' },
          { tipo: 'acao', texto: 'IAMSSST: ECG normal/alterado (infradesnivelamento ST, inversão T) + troponina elevada' },
          { tipo: 'acao', texto: 'Angina instável: ECG alterado + troponina normal (2 amostras — 0h e 3h)' },
          { tipo: 'alerta', texto: 'IAMCSST de parede posterior: ECG pode ser "normal" nas 12 derivações → solicitar V7-V9 se suspeita (infradesnivelamento em V1-V3 pode ser sua imagem-espelho)' },
        ],
      },
      {
        nome: 'Tratamento Inicial (todos os SCA)',
        passos: [
          { tipo: 'droga', nome: 'AAS', dose: '300 mg VO — mastigar (dose de ataque)', obs: 'manter 100 mg/dia após' },
          { tipo: 'droga', nome: 'Ticagrelor', dose: '180 mg VO (dose de ataque) + 90 mg 2x/dia', obs: '1ª escolha para dupla antiagregação' },
          { tipo: 'droga', nome: 'Clopidogrel', dose: '300–600 mg VO (dose de ataque)', obs: 'se Ticagrelor indisponível ou contraindicado' },
          { tipo: 'droga', nome: 'Heparina não fracionada', dose: '60 UI/kg IV bolus (máx 4.000 UI) + 12 UI/kg/h (máx 1.000 UI/h)', obs: 'iniciar em todos os SCA confirmados' },
          { tipo: 'acao', texto: 'O₂ suplementar apenas se SpO₂ < 90% — hiperóxia é prejudicial na SCA' },
          { tipo: 'droga', nome: 'Morfina', dose: '2–4 mg IV + 2 mg a cada 5–15 min', obs: 'uso DESENCORAJADO (ESC 2023 Classe IIb) — retarda absorção de Ticagrelor e Clopidogrel em até 2h, reduzindo inibição plaquetária no momento do cateterismo. Usar apenas se dor intratável após nitratos' },
          { tipo: 'droga', nome: 'Nitrato', dose: 'Isossorbida 5 mg SL a cada 5 min (3 doses)', obs: 'se PA > 90/60 — CONTRAINDICADO se uso de inibidor de PDE5 < 24–48h' },
        ],
      },
      {
        nome: 'IAMCSST — Estratégia de Reperfusão',
        passos: [
          { tipo: 'acao', texto: 'Angioplastia primária (ICP): alvo "porta-balão" < 90 min — PREFERENCIAL se disponível' },
          { tipo: 'acao', texto: 'Trombólise: indicada se ICP não disponível em < 120 min' },
          { tipo: 'droga', nome: 'Tenecteplase (TNK)', dose: '< 60 kg: 30 mg IV bolus / 60–70 kg: 35 mg / 70–80 kg: 40 mg / > 80 kg: 45–50 mg', obs: 'administrar em 5–10s' },
          { tipo: 'alerta', texto: 'Contraindicações absolutas à trombólise: AVC hemorrágico prévio, AVC isquêmico < 3 meses, neoplasia intracraniana, lesão vascular cerebral, cirurgia/trauma < 3 semanas, sangramento GI < 1 mês, PA > 180/110 não controlada' },
          { tipo: 'acao', texto: 'Após trombólise bem-sucedida: transferência para hemodinâmica em 3–24h para angiografia' },
        ],
      },
      {
        nome: 'Monitorização',
        passos: [
          { tipo: 'acao', texto: 'Monitor cardíaco contínuo nas primeiras 24h (risco máximo de FV nas primeiras horas)' },
          { tipo: 'acao', texto: 'Troponina seriada: 0h, 3h e 6h (protocolo 0/3h preferencial)' },
          { tipo: 'droga', nome: 'Betabloqueador', dose: 'Metoprolol 25–50 mg VO 2x/dia', obs: 'iniciar nas primeiras 24h se sem contraindicação (BAV, broncoespasmo, FC < 60, choque)' },
          { tipo: 'droga', nome: 'IECA', dose: 'Ramipril 2,5–5 mg VO/dia', obs: 'iniciar nas primeiras 24h se FEVE reduzida ou parede anterior comprometida' },
          { tipo: 'droga', nome: 'Estatina de alta intensidade', dose: 'Atorvastatina 80 mg VO/dia', obs: 'iniciar antes da alta — reduz eventos isquêmicos recorrentes' },
          { tipo: 'droga', nome: 'Colchicina', dose: '0,5 mg VO 1x/dia por ≥ 6 meses', obs: 'considerar para redução do risco inflamatório residual — Classe IIb, NE-A (ESC 2023; COLCOT trial: ↓ 23% em MACE)' },
        ],
      },
    ],
    referencia: 'ESC Guidelines on Acute Coronary Syndromes 2023',
  },

  {
    slug: 'eap',
    titulo: 'Edema Agudo de Pulmão',
    icone: '🫧',
    categoria: 'cardiovascular',
    tags: ['cardiovascular', 'respiratório'],
    fases: [
      {
        nome: 'Reconhecimento',
        passos: [
          { tipo: 'acao', texto: 'Quadro clínico: dispneia súbita e intensa + ortopneia + estertores crepitantes bilaterais em bases + SpO₂ baixa' },
          { tipo: 'acao', texto: 'RX tórax: infiltrado bilateral "em asa de borboleta", cefalização da vascularização, derrame pleural, cardiomegalia' },
          { tipo: 'acao', texto: 'Diferencial importante: asma grave, DPOC exacerbado, TEP, pneumonia bilateral, SDRA' },
          { tipo: 'acao', texto: 'Identificar fator precipitante: SCA, FA nova, crise hipertensiva, sobrecarga volêmica, infecção' },
        ],
      },
      {
        nome: 'Medidas Imediatas',
        passos: [
          { tipo: 'acao', texto: 'Posição sentada com membros inferiores pendentes (↓ retorno venoso)' },
          { tipo: 'acao', texto: 'O₂ com máscara de Venturi FiO₂ 40–60% — alvo SpO₂ > 94%' },
          { tipo: 'acao', texto: 'VNI (CPAP 5–10 cmH₂O ou BiPAP 10/5 cmH₂O): indicada se SpO₂ < 90% ou FR > 25 com O₂ convencional' },
          { tipo: 'acao', texto: 'Acesso venoso, monitorização contínua (PA, FC, SpO₂, ECG)' },
          { tipo: 'acao', texto: 'Gasometria arterial para avaliar grau de hipoxemia e ventilação' },
        ],
      },
      {
        nome: 'Tratamento Farmacológico',
        passos: [
          { tipo: 'droga', nome: 'Furosemida', dose: '40–80 mg IV em bolus', obs: 'se em uso prévio de furosemida oral, dobrar a dose; repetir em 1h se sem resposta; meta: 1–2 mL/kg/h de diurese' },
          { tipo: 'droga', nome: 'Isossorbida SL', dose: '5 mg SL a cada 5 min (3 doses)', obs: 'se PA sistólica ≥ 90 mmHg' },
          { tipo: 'droga', nome: 'Nitroglicerina IV', dose: '10–20 mcg/min (titular até 200 mcg/min)', obs: 'se sem melhora com SL; suspender se PA < 90 mmHg' },
          { tipo: 'alerta', texto: 'NÃO usar nitrato se uso de inibidor de PDE5 (sildenafila, tadalafila) nas últimas 24–48h — risco de hipotensão grave irreversível' },
          { tipo: 'droga', nome: 'Morfina', dose: '2–4 mg IV', obs: 'evidência de benefício limitada — estudos observacionais associam morfina no EAP a maior uso de VM, maior tempo de UTI e maior mortalidade (Eur J Heart Fail 2020). Usar com extrema cautela, apenas se agitação intratável após VNI + diurético + nitrato' },
        ],
      },
      {
        nome: 'Falha de Resposta',
        passos: [
          { tipo: 'acao', texto: 'Se PA < 90 mmHg (EAP + choque cardiogênico):' },
          { tipo: 'droga', nome: 'Dobutamina', dose: '2–10 mcg/kg/min IV em bomba', obs: 'inotrópico — NÃO usar nitrato se hipotenso' },
          { tipo: 'droga', nome: 'Norepinefrina', dose: '0,1–0,5 mcg/kg/min IV', obs: 'se hipotensão grave (PAS < 70 mmHg)' },
          { tipo: 'acao', texto: 'Indicação de IOT se: FR > 35, SpO₂ < 88% com VNI máxima, alteração de consciência, fadiga muscular' },
          { tipo: 'acao', texto: 'Investigar SCA como causa: ECG + troponina seriada → coronariografia de urgência se IAMCSST' },
        ],
      },
    ],
    referencia: 'ESC Heart Failure Guidelines 2021',
  },

  {
    slug: 'crise-hipertensiva',
    titulo: 'Crise Hipertensiva',
    icone: '📈',
    categoria: 'cardiovascular',
    tags: ['cardiovascular', 'hipertensão'],
    fases: [
      {
        nome: 'Classificação (passo mais importante)',
        passos: [
          { tipo: 'acao', texto: 'Urgência hipertensiva: PA muito elevada (PAS > 180 ou PAD > 120) SEM evidência de lesão aguda de órgão-alvo' },
          { tipo: 'acao', texto: 'Emergência hipertensiva: PA muito elevada COM lesão aguda de órgão-alvo (AVC, IAM, EAP, dissecção de aorta, encefalopatia)' },
          { tipo: 'alerta', texto: 'Na URGÊNCIA: não reduzir PA abruptamente — queda rápida pode precipitar AVC isquêmico, IAM ou lesão renal. Meta: reduzir 20–25% em 24–48h com medicação VO' },
          { tipo: 'acao', texto: 'Investigar lesão de órgão-alvo: ECG, troponina, ureia/creatinina, fundo de olho, exame neurológico' },
        ],
      },
      {
        nome: 'Urgência Hipertensiva — Tratamento VO',
        passos: [
          { tipo: 'acao', texto: 'Repouso em ambiente calmo; reavaliar PA em 30–60 min antes de medicar (ansiedade eleva PA transitoriamente)' },
          { tipo: 'droga', nome: 'Captopril', dose: '25–50 mg VO', obs: '1ª escolha; reavaliar PA em 30 min; pode repetir se sem resposta adequada' },
          { tipo: 'droga', nome: 'Anlodipino', dose: '5–10 mg VO', obs: 'se IECA contraindicado (alergia, hipercalemia, estenose de artéria renal bilateral)' },
          { tipo: 'droga', nome: 'Clonidina', dose: '0,1–0,2 mg VO', obs: 'alternativa; atenção à síndrome de rebote na retirada abrupta' },
          { tipo: 'alerta', texto: 'NÃO usar Nifedipina sublingual — queda abrupta e imprevisível de PA com risco de IAM e AVC' },
        ],
      },
      {
        nome: 'Emergência Hipertensiva — Drogas IV',
        passos: [
          { tipo: 'acao', texto: 'Meta: reduzir PAM em 20–25% na 1ª hora (não normalizar imediatamente)' },
          { tipo: 'acao', texto: 'UTI/semi-intensiva com monitorização invasiva da PA quando disponível' },
          { tipo: 'droga', nome: 'Nitroprussiato de Sódio', dose: '0,3–0,5 mcg/kg/min IV (titular até 2 mcg/kg/min)', obs: 'uso ≤ 72h — risco de toxicidade por tiocianato (especialmente DRC); evitar em gestante e hipertensão intracraniana' },
          { tipo: 'droga', nome: 'Labetalol', dose: '20 mg IV bolus lento (2 min); repetir 40–80 mg a cada 10 min (máx 300 mg)', obs: 'preferencial em dissecção de aorta (atenolol/esmolol como alternativa). ATENÇÃO: formulação IV não disponível no Brasil — em gestante com eclâmpsia usar Hidralazina IV (ver abaixo)' },
          { tipo: 'droga', nome: 'Nicardipina', dose: '5 mg/h IV (aumentar 2,5 mg/h a cada 5–15 min; máx 15 mg/h)', obs: 'preferencial em AVC e encefalopatia hipertensiva' },
          { tipo: 'droga', nome: 'Hidralazina', dose: '5–10 mg IV bolus lento (repetir a cada 20 min; máx 30 mg)', obs: 'padrão brasileiro para gestante com eclâmpsia/pré-eclâmpsia grave (labetalol IV indisponível no Brasil). Resposta imprevisível — monitorar PA a cada 5 min' },
          { tipo: 'droga', nome: 'Furosemida', dose: '40–80 mg IV', obs: 'se EAP associado — não usar como anti-hipertensivo isolado sem sobrecarga de volume' },
        ],
      },
      {
        nome: 'Monitorização e Alta',
        passos: [
          { tipo: 'acao', texto: 'PA a cada 15 min até estabilização, depois a cada 1h' },
          { tipo: 'acao', texto: 'Repetir ECG, troponina, função renal e exame neurológico após redução da PA' },
          { tipo: 'acao', texto: 'Investigar causas secundárias de hipertensão: feocromocitoma, síndrome de Cushing, estenose de artéria renal, apneia do sono' },
          { tipo: 'acao', texto: 'Na alta: reforçar adesão à medicação anti-hipertensiva e retorno ambulatorial em 48–72h' },
        ],
      },
    ],
    referencia: 'ESC/ESH Hypertension Guidelines 2023 / SBC Diretrizes de Hipertensão 2020',
  },
];

export function getProtocolo(slug) {
  return protocolos.find((p) => p.slug === slug) ?? null;
}

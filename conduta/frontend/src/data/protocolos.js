// frontend/src/data/protocolos.js

const protocolosBase = [
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
          { tipo: 'droga', nome: 'Atropina', dose: 'conforme protocolo institucional', obs: 'não usar de rotina na SRI; considerar apenas em bradicardia clinicamente significativa ou indicação pediátrica específica' },
        ],
      },
      {
        nome: 'Pré-medicação (3–5 min antes)',
        passos: [
          { tipo: 'droga', nome: 'Fentanil', dose: '1–3 mcg/kg IV lento (2 min)', obs: 'adjuvante seletivo; omitir em choque/hipotensão e não atrasar a SRI por pré-medicação' },
          { tipo: 'droga', nome: 'Lidocaína', dose: '1,5 mg/kg IV', obs: 'não usar de rotina; considerar somente por indicação específica e protocolo local' },
        ],
      },
      {
        nome: 'Indução e Paralisia (tempo zero)',
        passos: [
          { tipo: 'acao', texto: 'Escolher agente indutor conforme hemodinâmica:' },
          { tipo: 'droga', nome: 'Etomidato', dose: '0,3 mg/kg IV', obs: 'considerar conforme hemodinâmica e contexto; não há agente indutor universal de 1ª escolha' },
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
    referencia: 'SCCM Guidelines for Rapid Sequence Intubation in the Critically Ill Adult Patient (2023) / DAS Guidelines for Unanticipated Difficult Tracheal Intubation in Adults (2025)',
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
          { tipo: 'acao', texto: 'Garantir acesso vascular: via IV preferida sobre intraóssea (IO) para administração de drogas (AHA 2025); usar IO se acesso IV não obtido rapidamente' },
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
          { tipo: 'acao', texto: 'FV refratária (≥ 3 choques sem RCE): considerar desfibrilação sequencial dupla (DSED) ou mudança de vetor (anterior-posterior). Sinal promissor no DOSE VF (NEJM 2022), mas a AHA 2025 classifica como "não estabelecido" — considerar caso a caso, sem afirmar superioridade comprovada' },
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
          { tipo: 'acao', texto: 'Após RCE: manter FiO₂ 100% até SpO₂/PaO₂ confiável; depois titular para SpO₂ 90–98% e evitar hipoxemia/hiperóxia' },
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
          { tipo: 'acao', texto: 'Administrar O₂ se hipoxemia ou desconforto respiratório e titular conforme resposta clínica e SpO₂' },
          { tipo: 'acao', texto: 'Acesso venoso; SF 0,9%: 1–2 L em bolus se hipotensão (20 mL/kg em crianças)' },
          { tipo: 'droga', nome: 'Epinefrina IV', dose: '0,1–0,5 mcg/kg/min', obs: 'apenas se choque refratário a epinefrina IM repetida + volume' },
        ],
      },
      {
        nome: 'Tratamento de Suporte (2ª linha)',
        passos: [
          { tipo: 'droga', nome: 'Difenidramina', dose: '25–50 mg IV/IM', obs: 'anti-histamínico H1 — alivia urticária e prurido' },
          { tipo: 'droga', nome: 'Famotidina', dose: 'conforme protocolo institucional', obs: 'benefício limitado; não usar de rotina e nunca atrasar epinefrina (WAO 2020 / EAACI 2021)' },
          { tipo: 'droga', nome: 'Corticoide sistêmico', dose: 'conforme protocolo institucional', obs: 'não previne de forma confiável reação bifásica; considerar apenas como adjuvante em cenários selecionados, nunca em substituição à epinefrina' },
          { tipo: 'droga', nome: 'Salbutamol inalatório', dose: '2,5–5 mg nebulizado', obs: 'se broncoespasmo persistente após epinefrina' },
        ],
      },
      {
        nome: 'Alta e Prevenção',
        passos: [
          { tipo: 'acao', texto: 'Definir observação de forma individualizada; prolongar/internar se reação grave, hipotensão, necessidade de doses repetidas ou fatores de risco para recorrência' },
          { tipo: 'acao', texto: 'Na alta, fornecer plano de ação, orientação para nova exposição e epinefrina autoinjetável somente se disponível/registrada e indicada conforme protocolo local' },
          { tipo: 'acao', texto: 'Encaminhar para alergologista para investigação e imunoterapia' },
          { tipo: 'acao', texto: 'Registrar o agente desencadeante no prontuário e orientar a evitar' },
        ],
      },
    ],
    referencia: 'WAO Anaphylaxis Guidance 2020 / EAACI Anaphylaxis Guideline 2021 / confirmar disponibilidade e registro no Brasil antes de citar apresentação comercial',
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
          { tipo: 'acao', texto: 'Se suspeita de oclusão de grande vaso, realizar angioTC (± perfusão conforme disponibilidade) sem atrasar trombólise quando indicada e acionar fluxo de trombectomia' },
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
          { tipo: 'alerta', texto: 'A lista abaixo não é exaustiva: usar checklist completo de elegibilidade/contraindicações da diretriz AHA/ASA 2026 e do protocolo local, incluindo horário, anticoagulantes, sangramento e risco de hemorragia' },
          { tipo: 'droga', nome: 'Alteplase (rt-PA)', dose: '0,9 mg/kg IV (máx 90 mg): 10% em bolus 1 min + 90% em infusão 60 min', obs: 'iniciar dentro de 60 min da chegada (meta "porta-agulha" < 60 min)' },
          { tipo: 'droga', nome: 'Tenecteplase (TNK)', dose: '0,25 mg/kg IV bolus único (máx 25 mg)', obs: 'alternativa em pacientes elegíveis conforme diretriz e protocolo do centro; não tratar como automaticamente equivalente nem atrasar transferência/avaliação para trombectomia. Confirmar disponibilidade, registro e protocolo brasileiro' },
          { tipo: 'acao', texto: 'Controle de PA antes e durante o tPA: manter < 185/110 mmHg' },
          { tipo: 'droga', nome: 'Labetalol', dose: '10–20 mg IV', obs: 'se PA > 185/110 antes do tPA. ATENÇÃO: formulação IV não disponível no Brasil — usar Nicardipina IV ou Esmolol IV; Nitroprussiato como alternativa' },
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
          { tipo: 'droga', nome: 'Nicardipina', dose: '5 mg/h IV (aumentar 2,5 mg/h a cada 5–15 min, máx 15 mg/h)', obs: '1ª escolha no Brasil (labetalol IV indisponível)' },
          { tipo: 'droga', nome: 'Labetalol', dose: '10–20 mg IV bolus, repetir a cada 10 min (máx 300 mg)', obs: '1ª escolha onde disponível — formulação IV NÃO disponível no Brasil' },
          { tipo: 'acao', texto: 'Reverter anticoagulação se em uso: Vit K 10 mg IV + CCP 4 fatores (ou FFP se CCP indisponível) para warfarina; Andexanet alfa para apixabana/rivaroxabana; Idarucizumabe 5 g IV (Praxbind) para dabigatrana; Sulfato de protamina para heparina' },
          { tipo: 'acao', texto: 'Avaliação neurocirúrgica urgente' },
        ],
      },
    ],
    referencia: 'AHA/ASA Guideline for Early Management of Acute Ischemic Stroke (2026, DOI: 10.1161/STR.0000000000000513) / PCDT AVC Isquêmico Agudo — Ministério da Saúde (versão vigente) / protocolo regional de trombectomia',
  },

  {
    slug: 'sepse',
    titulo: 'Sepse',
    icone: '🦠',
    categoria: 'infeccioso',
    tags: ['infecção', 'emergência'],
    fases: [
      {
        nome: 'Reconhecimento e Triagem',
        passos: [
          { tipo: 'acao', texto: 'Usar ferramenta de triagem padronizada (NEWS2 ou SIRS) para rastreio — a Surviving Sepsis Campaign desaconselha qSOFA como ferramenta ISOLADA de triagem' },
          { tipo: 'acao', texto: 'qSOFA ≥ 2 pontos (auxílio à beira-leito, não rastreio único): FR ≥ 22/min (1 pt), alteração mental / Glasgow < 15 (1 pt), PAS ≤ 100 mmHg (1 pt)' },
          { tipo: 'acao', texto: 'Choque séptico: sepse + necessidade de vasopressor + lactato > 2 mmol/L após reposição adequada' },
          { tipo: 'acao', texto: 'SOFA score para confirmar disfunção orgânica (aumento ≥ 2 pontos em relação ao basal)' },
        ],
      },
      {
        nome: 'Reconhecimento e tratamento inicial',
        passos: [
          { tipo: 'acao', texto: 'Colher hemoculturas de sítios diferentes o mais rápido possível e idealmente antes do antimicrobiano — não atrasar o tratamento por coleta' },
          { tipo: 'acao', texto: 'Dosar lactato e acompanhar tendência; lactato isolado não define sepse nem choque séptico' },
          { tipo: 'droga', nome: 'Antibiótico empírico IV', dose: 'imediato se choque séptico ou sepse provável/definida; se possível sepse sem choque, após avaliação rápida e em até 3h', obs: 'selecionar pelo foco, gravidade, epidemiologia local, risco de resistência, alergias, função renal/hepática, interações e antibiograma; não usar esquema universal neste protocolo' },
          { tipo: 'acao', texto: 'Coletar culturas o mais rápido possível e idealmente antes do antimicrobiano, sem atrasar tratamento' },
          { tipo: 'acao', texto: 'Reposição volêmica com cristaloide balanceado preferencialmente; considerar 30 mL/kg em choque/hipoperfusão, mas individualizar e reavaliar responsividade, congestão, função cardíaca e renal após cada bolus' },
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
          { tipo: 'acao', texto: 'Identificar e controlar foco: drenagem de abscesso, remoção de cateter infectado ou cirurgia quando indicada — idealmente em até 6h quando houver necessidade de controle de foco' },
          { tipo: 'acao', texto: 'Reavaliar antibiótico em 48–72h: resultados de cultura → deescalonamento para antibiótico de menor espectro' },
          { tipo: 'acao', texto: 'Duração do antibiótico: individualizar pelo foco, controle da fonte, evolução clínica e microbiologia; evitar duração fixa e descalonar quando possível' },
          { tipo: 'acao', texto: 'Controle glicêmico: manter glicemia < 180 mg/dL com insulina IV se necessário' },
        ],
      },
    ],
    referencia: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock in Adults (2026) / protocolos antimicrobianos locais e PCDT vigentes',
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
          { tipo: 'droga', nome: 'Valproato de Sódio', dose: '40 mg/kg IV em 10 min (máx 3.000 mg)', obs: 'uma das opções de segunda linha; escolher conforme contraindicações, interações, função hepática, gestação e disponibilidade' },
          { tipo: 'droga', nome: 'Levetiracetam', dose: '60 mg/kg IV em 15 min (máx 4.500 mg)', obs: 'uma das opções de segunda linha; o ESETT não demonstrou superioridade clínica entre levetiracetam, valproato e fosfenitoína' },
          { tipo: 'droga', nome: 'Fenitoína', dose: '20 mg/kg IV (máx 50 mg/min)', obs: 'opção de segunda linha quando apropriada; risco de hipotensão/arritmia e necessidade de monitorização ECG/PA. Em pediatria, seguir dose e protocolo específicos — não é contraindicação absoluta' },
          { tipo: 'droga', nome: 'Fosfenitoína', dose: '20 mg PE/kg IV ou IM', obs: 'pró-fármaco da fenitoína; usar unidade PE (equivalentes de fenitoína) e monitorar ECG/PA' },
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
    referencia: 'WHO mhGAP recommendation for established status epilepticus / ESETT Trial (NEJM 2019) / ILAE status epilepticus guidance / protocolo institucional com doses pediátricas e adultas separadas',
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
          { tipo: 'acao', texto: 'Critérios diagnósticos (ADA/EASD 2024): hiperglicemia (glicemia ≥ 200 mg/dL ou diabetes conhecido) + β-hidroxibutirato ≥ 3,0 mmol/L (ou cetonúria ≥ 2+) + pH arterial < 7,3 e/ou bicarbonato < 18 mEq/L' },
          { tipo: 'alerta', texto: 'Cetoacidose euglicêmica: pacientes em uso de inibidor de SGLT2 (dapagliflozina, empagliflozina, canagliflozina) podem cursar com glicemia < 250 mg/dL — NÃO afastar CAD pela glicemia normal/baixa' },
          { tipo: 'acao', texto: 'Anion gap = Na - (Cl + HCO₃) auxilia na monitorização (normal 8–12; na CAD tipicamente > 16), mas deixou de ser critério diagnóstico ou de resolução (ADA/EASD 2024)' },
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
          { tipo: 'acao', texto: 'Não suspender insulina IV até resolução da cetose/acidose e estabilidade clínica — trocar para insulina SC com sobreposição de 1–2h antes de suspender a bomba' },
        ],
      },
      {
        nome: 'Monitorização e Critérios de Resolução',
        passos: [
          { tipo: 'acao', texto: 'Glicemia capilar: a cada 1h' },
          { tipo: 'acao', texto: 'Eletrólitos (K⁺, Na⁺): a cada 2h nas primeiras 6h, depois a cada 4h' },
          { tipo: 'acao', texto: 'Gasometria arterial: a cada 4h' },
          { tipo: 'acao', texto: 'Critérios de resolução (consenso 2024): β-hidroxibutirato < 0,6 mmol/L e pH venoso ≥ 7,3 OU bicarbonato ≥ 18 mEq/L; anion gap não é critério de resolução. Confirmar estabilidade clínica e planejar transição para insulina SC' },
          { tipo: 'alerta', texto: 'NÃO usar bicarbonato de sódio na CAD (exceto pH < 7,0 com instabilidade hemodinâmica) — aumenta risco de hipocalemia e acidose paradoxal no SNC' },
        ],
      },
    ],
    referencia: 'Consenso ADA/EASD de Crises Hiperglicêmicas 2024 (Diabetes Care) / ADA Standards of Care 2026 / Fluidos na CAD: meta-análise Frontiers Endocrinol. 2024 (11 RCTs, 753 pacientes)',
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
          { tipo: 'droga', nome: 'Ticagrelor', dose: '180 mg VO (dose de ataque) + 90 mg 2x/dia', obs: 'P2Y12 preferido em muitos cenários de SCA, mas não iniciar automaticamente: considerar STEMI/NSTE-ACS, estratégia invasiva/ICP, risco hemorrágico, anticoagulação e contraindicações' },
          { tipo: 'droga', nome: 'Clopidogrel', dose: '300–600 mg VO (dose de ataque)', obs: 'opção quando ticagrelor/prasugrel não forem apropriados ou quando houver indicação específica; seguir estratégia de reperfusão/ICP' },
          { tipo: 'droga', nome: 'Heparina não fracionada', dose: 'conforme estratégia de reperfusão e protocolo de anticoagulação', obs: 'não iniciar em todos os SCA de forma automática; ajustar ao cenário (ICP, trombólise ou NSTE-ACS), função renal, peso, sangramento e anticoagulante escolhido' },
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
          { tipo: 'acao', texto: 'Troponina de alta sensibilidade em algoritmo validado pelo ensaio local (frequentemente 0/1h ou 0/2h; usar 0/3h se esse for o protocolo validado)' },
          { tipo: 'droga', nome: 'Betabloqueador', dose: 'Metoprolol 25–50 mg VO 2x/dia', obs: 'iniciar nas primeiras 24h se sem contraindicação (BAV, broncoespasmo, FC < 60, choque)' },
          { tipo: 'droga', nome: 'IECA', dose: 'Ramipril 2,5–5 mg VO/dia', obs: 'iniciar nas primeiras 24h se FEVE reduzida ou parede anterior comprometida' },
          { tipo: 'droga', nome: 'Estatina de alta intensidade', dose: 'Atorvastatina 80 mg VO/dia', obs: 'iniciar antes da alta — reduz eventos isquêmicos recorrentes' },
          { tipo: 'droga', nome: 'Colchicina', dose: '0,5 mg VO 1x/dia por ≥ 6 meses', obs: 'Classe IIb — benefício incerto: COLCOT e LoDoCo2 positivos, mas CLEAR-SYNERGY/OASIS-9 (2024, n=7.062) foi neutro. Decisão individualizada' },
        ],
      },
    ],
    referencia: '2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes (Circulation 2025) / ESC Guidelines on Acute Coronary Syndromes 2023',
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
          { tipo: 'acao', texto: 'O₂ se SpO₂ < 90% ou PaO₂ < 60 mmHg; titular para 94–98% (ou 88–92% se risco de retenção de CO₂)' },
          { tipo: 'acao', texto: 'VNI (CPAP/BiPAP) se desconforto respiratório persistente, hipoxemia apesar de O₂, FR elevada ou acidose hipercápnica; monitorar resposta e contraindicações' },
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
          { tipo: 'droga', nome: 'Morfina', dose: 'não usar de rotina', obs: 'evitar no EAP por ausência de benefício comprovado e associação observacional com piores desfechos; considerar apenas indicação excepcional e monitorizada' },
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
    referencia: 'ESC Heart Failure Guidelines 2021 + 2023 Focused Update',
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
          { tipo: 'acao', texto: 'PA muito elevada sem lesão aguda de órgão-alvo: confirmar medida, investigar causas reversíveis e ajustar tratamento crônico sem queda abrupta; evitar usar “urgência hipertensiva” como sinônimo de emergência' },
          { tipo: 'acao', texto: 'Emergência hipertensiva: PA muito elevada COM lesão aguda de órgão-alvo (AVC, IAM, EAP, dissecção de aorta, encefalopatia)' },
          { tipo: 'alerta', texto: 'Sem lesão aguda de órgão-alvo: não reduzir PA abruptamente; não há meta universal de queda em 24–48h. Corrigir causas precipitantes, ajustar tratamento crônico e garantir seguimento' },
          { tipo: 'acao', texto: 'Investigar lesão de órgão-alvo: ECG, troponina, ureia/creatinina, fundo de olho, exame neurológico' },
        ],
      },
      {
        nome: 'Urgência Hipertensiva — Tratamento VO',
        passos: [
          { tipo: 'acao', texto: 'Repouso em ambiente calmo; reavaliar PA em 30–60 min antes de medicar (ansiedade eleva PA transitoriamente)' },
          { tipo: 'droga', nome: 'Ajuste de anti-hipertensivo VO', dose: 'conforme tratamento habitual e avaliação clínica', obs: 'não há uma droga universal de resgate; individualizar por comorbidades, causas precipitantes, adesão e seguimento' },
          { tipo: 'droga', nome: 'Clonidina', dose: 'não usar de rotina', obs: 'evitar por sedação, hipotensão imprevisível e risco de rebote; reservar a situações selecionadas conforme protocolo local' },
          { tipo: 'alerta', texto: 'NÃO usar Nifedipina sublingual — queda abrupta e imprevisível de PA com risco de IAM e AVC' },
        ],
      },
      {
        nome: 'Emergência Hipertensiva — Drogas IV',
        passos: [
          { tipo: 'acao', texto: 'Meta de redução depende do órgão-alvo; em geral, reduzir PAM em até 20–25% na primeira hora sem normalizar imediatamente, exceto metas específicas (p.ex., dissecção de aorta, AVC ou gestação)' },
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
    referencia: 'Diretriz Brasileira de Hipertensão Arterial 2025 (SBC/SBN/SBH) / ESC Hypertension Guidelines 2024 / AHA Scientific Statement 2024',
  },
];

export const protocolos = protocolosBase.map((protocolo) => ({
  ...protocolo,
  atualizadoEm: 'Julho de 2026',
  notaSeguranca: 'Confira doses e o protocolo institucional antes de usar.',
}));

export function getProtocolo(slug) {
  return protocolos.find((p) => p.slug === slug) ?? null;
}

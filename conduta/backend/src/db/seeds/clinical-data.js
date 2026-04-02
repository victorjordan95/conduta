/**
 * Base de conhecimento clínico — USF e Pronto Atendimento básico
 * Fonte: RENAME 2022, Cadernos de Atenção Básica (MS), SBP, CID-10
 *
 * Estrutura:
 *   diagnosticos  → nós Diagnostico
 *   medicamentos  → nós Medicamento
 *   relacoes      → arestas entre diagnósticos e medicamentos
 */

const diagnosticos = [
  // ── CRÔNICAS ──────────────────────────────────────────────
  {
    cid: 'I10',
    nome: 'Hipertensão Arterial Sistêmica',
    sinonimos: ['HAS', 'hipertensão', 'pressão alta'],
    redFlags: [
      'PA ≥ 180/120 mmHg com sintomas (emergência hipertensiva)',
      'Déficit neurológico focal ou alteração de consciência',
      'Dor torácica ou dispneia súbita',
      'Fundoscopia com hemorragia ou edema de papila',
      'Oligúria ou elevação aguda de creatinina',
    ],
    excluir: ['HAS secundária (estenose de artéria renal, feocromocitoma, hiperaldosteronismo primário)'],
  },
  {
    cid: 'E11',
    nome: 'Diabetes Mellitus tipo 2',
    sinonimos: ['DM2', 'diabetes tipo 2', 'diabetes mellitus'],
    redFlags: [
      'Glicemia > 300 mg/dL com sintomas',
      'Sinais de cetoacidose: hálito cetônico, vômitos, dor abdominal',
      'Hipoglicemia grave (< 50 mg/dL) ou com alteração de consciência',
      'Poliúria + polidipsia de início abrupto em adulto jovem (suspeitar DM1/LADA)',
    ],
    excluir: ['DM tipo 1', 'LADA', 'Diabetes secundário (corticoide, pancreatite)'],
  },
  {
    cid: 'E03.9',
    nome: 'Hipotireoidismo',
    sinonimos: ['tireoidite de Hashimoto', 'hipotireoidismo primário'],
    redFlags: [
      'Mixedema: edema endurecido, hipotermia, bradicardia grave',
      'Alteração de consciência (coma mixedematoso)',
      'Derrame pericárdico ou pleural volumoso',
    ],
    excluir: ['Hipotireoidismo central (TSH baixo)', 'Depressão primária'],
  },
  {
    cid: 'E78.5',
    nome: 'Dislipidemia',
    sinonimos: ['hipercolesterolemia', 'hipertrigliceridemia', 'dislipidemia mista'],
    redFlags: [
      'Triglicerídeos > 500 mg/dL (risco de pancreatite)',
      'Xantomas tendíneos ou xantelasmas precoces (suspeitar dislipidemia familiar)',
    ],
    excluir: ['Hipotireoidismo (causa secundária)', 'Síndrome nefrótica', 'Diabetes descompensado'],
  },
  {
    cid: 'J45',
    nome: 'Asma',
    sinonimos: ['asma brônquica', 'broncoespasmo'],
    redFlags: [
      'SpO2 < 92% ou cianose',
      'Uso intenso de musculatura acessória, tiragem universal',
      'Incapacidade de completar frases',
      'Ausência de sibilos (silêncio auscultatório = crise grave)',
      'Rebaixamento de consciência',
    ],
    excluir: ['DPOC', 'ICC com broncoespasmo', 'Corpo estranho em criança'],
  },
  {
    cid: 'J44',
    nome: 'DPOC',
    sinonimos: ['doença pulmonar obstrutiva crônica', 'enfisema', 'bronquite crônica'],
    redFlags: [
      'SpO2 < 88% em paciente não hipercápnico habitual',
      'Alteração de consciência',
      'Uso intenso de musculatura acessória',
      'PA instável ou FC > 130 bpm',
    ],
    excluir: ['ICC descompensada', 'TEP', 'Pneumonia', 'Pneumotórax'],
  },
  {
    cid: 'F32',
    nome: 'Depressão',
    sinonimos: ['episódio depressivo', 'transtorno depressivo maior', 'depressão maior'],
    redFlags: [
      'Ideação suicida ativa com plano ou intenção',
      'Sintomas psicóticos (alucinações, delírios)',
      'Incapacidade de autocuidado básico',
    ],
    excluir: ['Hipotireoidismo', 'Anemia grave', 'Uso de substâncias', 'Depressão bipolar'],
  },
  {
    cid: 'F41.1',
    nome: 'Transtorno de Ansiedade Generalizada',
    sinonimos: ['ansiedade', 'TAG', 'ansiedade generalizada'],
    redFlags: [
      'Ideação suicida',
      'Sintomas autonômicos intensos (suspeitar causa orgânica: hipertireoidismo, feocromocitoma)',
    ],
    excluir: ['Hipertireoidismo', 'Arritmia cardíaca', 'Síndrome do pânico com causa orgânica'],
  },
  {
    cid: 'E66',
    nome: 'Obesidade',
    sinonimos: ['obesidade grau 1', 'obesidade grau 2', 'obesidade grau 3', 'sobrepeso'],
    redFlags: [
      'IMC > 40 com comorbidades graves',
      'SAOS grave com hipersonolência diurna intensa',
    ],
    excluir: ['Hipotireoidismo', 'Síndrome de Cushing', 'Uso de medicamentos obesogênicos'],
  },

  // ── AGUDAS — ADULTO ───────────────────────────────────────
  {
    cid: 'N39.0',
    nome: 'Infecção do Trato Urinário Baixo',
    sinonimos: ['ITU', 'cistite', 'infecção urinária'],
    redFlags: [
      'Febre > 38°C ou calafrio (suspeitar pielonefrite)',
      'Dor em loja renal',
      'Gravidez (ITU em gestante = sempre tratar e investigar)',
      'Sintomas em homem (suspeitar prostatite)',
      'Hematúria macroscópica (excluir neoplasia)',
    ],
    excluir: ['Pielonefrite', 'Prostatite', 'Vaginite (pode mimetizar disúria)', 'Neoplasia de bexiga'],
  },
  {
    cid: 'J02.9',
    nome: 'Faringoamigdalite Aguda',
    sinonimos: ['faringite', 'amigdalite', 'dor de garganta'],
    redFlags: [
      'Trismo (dificuldade de abrir a boca — suspeitar abscesso periamigdaliano)',
      'Voz abafada ou estridor',
      'Disfagia intensa com sialorreia',
      'Rigidez de nuca associada (suspeitar meningite)',
    ],
    excluir: ['Abscesso periamigdaliano', 'Epiglotite', 'Mononucleose infecciosa'],
  },
  {
    cid: 'J06.9',
    nome: 'Infecção Respiratória Aguda Alta',
    sinonimos: ['IRA alta', 'resfriado comum', 'síndrome gripal', 'gripe', 'rinofaringite'],
    redFlags: [
      'Febre > 39°C por mais de 5 dias sem melhora',
      'Dispneia ou SpO2 < 95%',
      'Sinais de gravidade em criança: taquipneia, tiragem, cianose, recusa alimentar',
      'Alteração de consciência',
    ],
    excluir: ['Pneumonia', 'Sinusite bacteriana', 'Influenza com complicações'],
  },
  {
    cid: 'J01.9',
    nome: 'Sinusite Aguda',
    sinonimos: ['rinossinusite', 'sinusite bacteriana'],
    redFlags: [
      'Edema periorbitário ou proptose (complicação orbitária)',
      'Rigidez de nuca ou cefaleia intensa (complicação intracraniana)',
      'Febre alta persistente > 3–4 dias sem melhora com ATB',
    ],
    excluir: ['Sinusite fúngica invasiva (imunossuprimido)', 'Rinite alérgica', 'Corpo estranho nasal (criança)'],
  },
  {
    cid: 'H66.9',
    nome: 'Otite Média Aguda',
    sinonimos: ['OMA', 'otite aguda', 'infecção de ouvido'],
    redFlags: [
      'Mastoidite: edema e dor retroauricular, pavilhão deslocado para frente',
      'Paralisia facial ipsilateral',
      'Vertigem intensa ou nistagmo',
    ],
    excluir: ['Otite externa', 'Mastoidite', 'Colesteatoma'],
  },
  {
    cid: 'A09',
    nome: 'Diarreia Aguda',
    sinonimos: ['gastroenterite aguda', 'GEA', 'diarreia infecciosa', 'diarreia'],
    redFlags: [
      'Sinais de desidratação grave: olhos fundos, turgor diminuído, sem lágrimas',
      'Sangue nas fezes com febre alta (suspeitar Shigella, Salmonella)',
      'Diarreia > 7 dias (pensar em parasitose ou causa inflamatória)',
      'Idoso ou imunossuprimido com piora rápida',
    ],
    excluir: ['Apendicite (diarreia + dor FID)', 'DII (doença inflamatória intestinal)', 'Colite pseudomembranosa'],
  },
  {
    cid: 'R51',
    nome: 'Cefaleia',
    sinonimos: ['dor de cabeça', 'enxaqueca', 'migrânea', 'cefaleia tensional'],
    redFlags: [
      'Cefaleia em trovoada (início súbito em segundos — excluir HSA)',
      'Cefaleia progressiva em semanas com déficit neurológico',
      'Febre + rigidez de nuca (meningite)',
      'Cefaleia após trauma craniano',
      'Papiledema ao fundo de olho',
      'Cefaleia nova em paciente > 50 anos (arterite temporal)',
    ],
    excluir: ['HSA (hemorragia subaracnóidea)', 'Meningite', 'Trombose venosa cerebral', 'Neoplasia SNC', 'HAS grave'],
  },
  {
    cid: 'M54.5',
    nome: 'Lombalgia',
    sinonimos: ['dor lombar', 'dor nas costas', 'lombalgia mecânica', 'lombociatalgia'],
    redFlags: [
      'Síndrome da cauda equina: retenção urinária, incontinência fecal, anestesia em sela',
      'Perda de força progressiva em MMII',
      'Febre + dor lombar (espondilodiscite)',
      'Dor que não melhora em decúbito (suspeitar neoplasia ou infecção)',
      'Trauma de alta energia',
      'Paciente > 50 anos com dor nova sem causa mecânica clara',
    ],
    excluir: ['Síndrome da cauda equina', 'Fratura vertebral', 'Neoplasia', 'Espondilodiscite', 'Aneurisma de aorta'],
  },
  {
    cid: 'B35',
    nome: 'Dermatofitose',
    sinonimos: ['tinha', 'micose', 'pé de atleta', 'tinea pedis', 'tinea corporis', 'tinea cruris', 'tinea unguium'],
    redFlags: [
      'Celulite associada (porta de entrada para infecção bacteriana)',
      'Tinea capitis com queda de cabelo extensa em criança',
    ],
    excluir: ['Psoríase', 'Eczema', 'Pitiríase rosada', 'Candidíase cutânea'],
  },
  {
    cid: 'B86',
    nome: 'Escabiose',
    sinonimos: ['sarna', 'sarnas', 'infestação por Sarcoptes scabiei'],
    redFlags: [
      'Sarna crostosa (norueguesa) em imunossuprimido — altamente contagiosa',
      'Lesões impetiginizadas extensas',
    ],
    excluir: ['Dermatite atópica', 'Prurigo', 'Urticária'],
  },
  {
    cid: 'B02',
    nome: 'Herpes-Zóster',
    sinonimos: ['zóster', 'cobreiro'],
    redFlags: [
      'Envolvimento do V1 (herpes oftálmico — encaminhar urgente)',
      'Envolvimento de pavilhão auricular + paralisia facial (Ramsay-Hunt)',
      'Disseminação em imunossuprimido',
    ],
    excluir: ['Dermatite de contato', 'Erisipela inicial', 'Neuralgia pós-herpética estabelecida'],
  },
  {
    cid: 'H10.9',
    nome: 'Conjuntivite',
    sinonimos: ['olho vermelho', 'conjuntivite bacteriana', 'conjuntivite viral', 'conjuntivite alérgica'],
    redFlags: [
      'Baixa acuidade visual',
      'Dor ocular intensa (não descrita como ardor)',
      'Fotofobia intensa (suspeitar ceratite ou uveíte)',
      'Hipópion (nível de pus na câmara anterior)',
    ],
    excluir: ['Glaucoma agudo', 'Ceratite', 'Uveíte anterior', 'Corpo estranho ocular'],
  },

  // ── PEDIATRIA ─────────────────────────────────────────────
  {
    cid: 'R50.9',
    nome: 'Febre sem Foco',
    sinonimos: ['febre em criança', 'febre sem foco definido'],
    redFlags: [
      'Criança < 3 meses com T > 38°C (urgência — risco de infecção bacteriana grave)',
      'Petéquias ou púrpura (meningococcemia)',
      'Prostração intensa, recusa alimentar em lactente',
      'Febre > 5 dias sem foco (Kawasaki, febre reumática)',
      'Rigidez de nuca',
    ],
    excluir: ['Meningite bacteriana', 'Sepse', 'Infecção urinária', 'Pneumonia', 'Doença de Kawasaki'],
  },
  {
    cid: 'J21',
    nome: 'Bronquiolite',
    sinonimos: ['bronquiolite viral aguda', 'BVA'],
    redFlags: [
      'SpO2 < 92% em ar ambiente',
      'Taquipneia grave para idade',
      'Tiragem subcostal, intercostal ou supraesternal',
      'Cianose',
      'Lactente < 2 meses ou prematuro',
      'Recusa alimentar total (< 50% do habitual)',
    ],
    excluir: ['Asma (primeira crise em lactente > 1 ano)', 'Cardiopatia congênita descompensada', 'Corpo estranho'],
  },
  {
    cid: 'J18',
    nome: 'Pneumonia Comunitária',
    sinonimos: ['PAC', 'pneumonia adquirida na comunidade'],
    redFlags: [
      'SpO2 < 92% ou cianose',
      'Taquipneia grave: > 60 irpm < 2m, > 50 irpm 2–12m, > 40 irpm 1–5a',
      'Tiragem subcostal em criança',
      'Rebaixamento de consciência',
      'PA sistólica < 90 mmHg',
    ],
    excluir: ['Derrame pleural complicado', 'Empiema', 'Abscesso pulmonar', 'TEP'],
  },
  {
    cid: 'K52.9',
    nome: 'Gastroenterite Aguda Pediátrica',
    sinonimos: ['GEA pediátrica', 'diarreia em criança', 'gastroenterite em criança'],
    redFlags: [
      'Desidratação grave: sem diurese > 8h, olhos fundos, fontanela deprimida, letargia',
      'Criança < 6 meses com qualquer grau de desidratação',
      'Sangue nas fezes em lactente (enterocolite)',
      'Vômitos biliosos (obstrução intestinal)',
    ],
    excluir: ['Intussuscepção intestinal', 'Apendicite', 'Enterocolite necrosante (RN)'],
  },
  {
    cid: 'L20',
    nome: 'Dermatite Atópica',
    sinonimos: ['eczema atópico', 'eczema', 'dermatite atópica'],
    redFlags: [
      'Eczema herpético (lesões vesiculares confluentes em placa de eczema — infecção por HSV)',
      'Infecção bacteriana secundária extensa (impetiginização)',
    ],
    excluir: ['Escabiose', 'Psoríase em placa', 'Dermatofitose', 'Ictiose'],
  },

  // ── SAÚDE DA MULHER ───────────────────────────────────────
  {
    cid: 'Z34',
    nome: 'Pré-natal de Baixo Risco',
    sinonimos: ['pré-natal', 'gestação', 'gravidez de baixo risco'],
    redFlags: [
      'PA ≥ 140/90 (suspeitar pré-eclâmpsia)',
      'Cefaleia + epigastralgia + edema de face (pré-eclâmpsia grave)',
      'Sangramento vaginal em qualquer trimestre',
      'Diminuição ou ausência de movimentos fetais',
      'Febre em gestante (sempre investigar ITU, TORCH)',
    ],
    excluir: ['Pré-eclâmpsia/eclâmpsia', 'Placenta prévia', 'DPP', 'RCIU', 'Gravidez ectópica (1T)'],
  },
  {
    cid: 'N76',
    nome: 'Vaginite',
    sinonimos: ['candidíase vaginal', 'vaginose bacteriana', 'vaginite', 'corrimento vaginal'],
    redFlags: [
      'Corrimento com odor fétido + febre (suspeitar DIP)',
      'Dor pélvica intensa (excluir DIP ou gravidez ectópica)',
    ],
    excluir: ['DIP (doença inflamatória pélvica)', 'IST (gonorreia, clamídia, tricomoníase)'],
  },
  {
    cid: 'A64',
    nome: 'Infecções Sexualmente Transmissíveis',
    sinonimos: ['IST', 'DST', 'sífilis', 'gonorreia', 'clamídia', 'herpes genital'],
    redFlags: [
      'Sífilis em gestante (notificação compulsória, tratar na consulta)',
      'Corrimento + febre + dor pélvica (DIP)',
      'Úlcera genital indolor que não cicatriza (sífilis primária)',
    ],
    excluir: ['DIP', 'Cancro mole vs. sífilis primária', 'Linfogranuloma venéreo'],
  },

  // ── URGÊNCIAS LEVES ───────────────────────────────────────
  {
    cid: 'I10',
    nome: 'Crise Hipertensiva',
    sinonimos: ['urgência hipertensiva', 'emergência hipertensiva', 'pico hipertensivo'],
    redFlags: [
      'PA > 180/120 com lesão de órgão-alvo (emergência hipertensiva — encaminhar UPA/hospital)',
      'Déficit neurológico focal (AVC)',
      'Dor torácica intensa (dissecção aórtica)',
      'Edema agudo de pulmão',
    ],
    excluir: ['AVC isquêmico/hemorrágico', 'SCA', 'Dissecção aórtica', 'Encefalopatia hipertensiva'],
  },
  {
    cid: 'J46',
    nome: 'Crise Asmática',
    sinonimos: ['crise de asma', 'broncoespasmo agudo', 'exacerbação de asma'],
    redFlags: [
      'SpO2 < 92%',
      'Sem resposta após 3 ciclos de broncodilatador',
      'Silêncio auscultatório (obstrução grave)',
      'Rebaixamento de consciência ou exaustão',
      'Pneumotórax (dor pleurítica súbita durante crise)',
    ],
    excluir: ['DPOC exacerbado', 'ICC (asma cardíaca)', 'Anafilaxia', 'Pneumotórax'],
  },
  {
    cid: 'A90',
    nome: 'Dengue',
    sinonimos: ['dengue clássico', 'dengue com sinais de alarme', 'febre da dengue'],
    redFlags: [
      'Sinais de alarme: dor abdominal intensa, vômitos persistentes, sangramento de mucosas, letargia',
      'Queda abrupta de febre com piora clínica (fase crítica)',
      'Hematócrito elevando > 20% do basal',
      'Plaquetas < 50.000',
    ],
    excluir: ['Leptospirose (icterícia + mialgia intensa)', 'Febre amarela', 'Hantavirose', 'Malária (regiões endêmicas)'],
  },
];

// ── MEDICAMENTOS ──────────────────────────────────────────────
const medicamentos = [
  // Anti-hipertensivos
  { nome: 'Losartana', classe: 'BRA', apresentacoes: ['25mg', '50mg', '100mg'], viaAdmin: 'oral' },
  { nome: 'Enalapril', classe: 'IECA', apresentacoes: ['5mg', '10mg', '20mg'], viaAdmin: 'oral' },
  { nome: 'Captopril', classe: 'IECA', apresentacoes: ['12,5mg', '25mg', '50mg'], viaAdmin: 'oral/sublingual' },
  { nome: 'Anlodipino', classe: 'BCC', apresentacoes: ['5mg', '10mg'], viaAdmin: 'oral' },
  { nome: 'Hidroclorotiazida', classe: 'Diurético tiazídico', apresentacoes: ['25mg'], viaAdmin: 'oral' },
  { nome: 'Atenolol', classe: 'Betabloqueador', apresentacoes: ['25mg', '50mg', '100mg'], viaAdmin: 'oral' },
  { nome: 'Propranolol', classe: 'Betabloqueador', apresentacoes: ['10mg', '40mg'], viaAdmin: 'oral' },
  { nome: 'Furosemida', classe: 'Diurético de alça', apresentacoes: ['40mg comp', '10mg/mL inj'], viaAdmin: 'oral/IV' },

  // Antidiabéticos
  { nome: 'Metformina', classe: 'Biguanida', apresentacoes: ['500mg', '850mg', '1000mg'], viaAdmin: 'oral' },
  { nome: 'Glibenclamida', classe: 'Sulfonilureia', apresentacoes: ['5mg'], viaAdmin: 'oral' },
  { nome: 'Gliclazida MR', classe: 'Sulfonilureia', apresentacoes: ['30mg', '60mg'], viaAdmin: 'oral' },
  { nome: 'Insulina NPH Humana', classe: 'Insulina', apresentacoes: ['100 UI/mL frasco', '100 UI/mL caneta'], viaAdmin: 'SC' },
  { nome: 'Insulina Regular Humana', classe: 'Insulina', apresentacoes: ['100 UI/mL frasco'], viaAdmin: 'SC/IV' },

  // Hormônio tireoidiano
  { nome: 'Levotiroxina', classe: 'Hormônio tireoidiano', apresentacoes: ['25mcg', '50mcg', '75mcg', '100mcg'], viaAdmin: 'oral' },

  // Broncodilatadores e asma
  { nome: 'Salbutamol', classe: 'Beta-2 agonista', apresentacoes: ['100mcg/dose aerossol', '2mg/5mL xarope', '5mg/mL nebulização'], viaAdmin: 'inalatório/oral' },
  { nome: 'Ipratrópio', classe: 'Anticolinérgico', apresentacoes: ['20mcg/dose aerossol', '0,25mg/mL nebulização'], viaAdmin: 'inalatório' },
  { nome: 'Beclometasona', classe: 'Corticoide inalatório', apresentacoes: ['50mcg/dose', '200mcg/dose'], viaAdmin: 'inalatório' },
  { nome: 'Budesonida', classe: 'Corticoide inalatório', apresentacoes: ['100mcg/dose', '200mcg/dose', '0,25mg/mL nebulização'], viaAdmin: 'inalatório' },
  { nome: 'Prednisona', classe: 'Corticoide sistêmico', apresentacoes: ['5mg', '20mg'], viaAdmin: 'oral' },
  { nome: 'Prednisolona', classe: 'Corticoide sistêmico', apresentacoes: ['3mg/mL solução', '20mg comp'], viaAdmin: 'oral' },

  // Psicotrópicos
  { nome: 'Fluoxetina', classe: 'ISRS', apresentacoes: ['20mg cápsulas'], viaAdmin: 'oral' },
  { nome: 'Sertralina', classe: 'ISRS', apresentacoes: ['25mg', '50mg', '100mg'], viaAdmin: 'oral' },
  { nome: 'Amitriptilina', classe: 'Antidepressivo tricíclico', apresentacoes: ['25mg', '75mg'], viaAdmin: 'oral' },
  { nome: 'Clonazepam', classe: 'Benzodiazepínico', apresentacoes: ['0,5mg', '1mg', '2mg', '2,5mg/mL gotas'], viaAdmin: 'oral' },
  { nome: 'Diazepam', classe: 'Benzodiazepínico', apresentacoes: ['5mg', '10mg'], viaAdmin: 'oral' },

  // Analgésicos e anti-inflamatórios
  { nome: 'Paracetamol', classe: 'Analgésico/Antipirético', apresentacoes: ['500mg comp', '200mg/mL gotas', '750mg comp'], viaAdmin: 'oral' },
  { nome: 'Dipirona', classe: 'Analgésico/Antipirético', apresentacoes: ['500mg comp', '500mg/mL gotas', '500mg/mL inj'], viaAdmin: 'oral/IV/IM' },
  { nome: 'Ibuprofeno', classe: 'AINE', apresentacoes: ['200mg', '400mg', '600mg', '50mg/mL suspensão'], viaAdmin: 'oral' },
  { nome: 'Naproxeno', classe: 'AINE', apresentacoes: ['250mg', '500mg'], viaAdmin: 'oral' },
  { nome: 'Ciclobenzaprina', classe: 'Relaxante muscular', apresentacoes: ['5mg', '10mg'], viaAdmin: 'oral' },
  { nome: 'Carisoprodol + Dipirona', classe: 'Relaxante muscular + analgésico', apresentacoes: ['125mg+300mg comp'], viaAdmin: 'oral' },
  { nome: 'Sumatriptano', classe: 'Triptano', apresentacoes: ['50mg', '100mg'], viaAdmin: 'oral' },

  // Antibióticos
  { nome: 'Amoxicilina', classe: 'Penicilina aminossemissintética', apresentacoes: ['250mg/5mL suspensão', '500mg caps', '875mg comp'], viaAdmin: 'oral' },
  { nome: 'Amoxicilina + Clavulanato', classe: 'Penicilina + inibidor de beta-lactamase', apresentacoes: ['400mg+57mg/5mL', '875mg+125mg'], viaAdmin: 'oral' },
  { nome: 'Penicilina Benzatina', classe: 'Penicilina', apresentacoes: ['600.000 UI', '1.200.000 UI', '2.400.000 UI'], viaAdmin: 'IM' },
  { nome: 'Azitromicina', classe: 'Macrolídeo', apresentacoes: ['500mg comp', '200mg/5mL suspensão'], viaAdmin: 'oral' },
  { nome: 'Cefalexina', classe: 'Cefalosporina 1ª geração', apresentacoes: ['250mg/5mL suspensão', '500mg caps'], viaAdmin: 'oral' },
  { nome: 'Ceftriaxona', classe: 'Cefalosporina 3ª geração', apresentacoes: ['500mg inj', '1g inj'], viaAdmin: 'IM/IV' },
  { nome: 'Ciprofloxacino', classe: 'Fluoroquinolona', apresentacoes: ['250mg', '500mg'], viaAdmin: 'oral' },
  { nome: 'Nitrofurantoína', classe: 'Nitrofurano', apresentacoes: ['100mg caps'], viaAdmin: 'oral' },
  { nome: 'Sulfametoxazol + Trimetoprima', classe: 'Sulfonamida', apresentacoes: ['400mg+80mg', '800mg+160mg', '200mg+40mg/5mL'], viaAdmin: 'oral' },
  { nome: 'Metronidazol', classe: 'Nitroimidazol', apresentacoes: ['250mg', '400mg', '500mg', '100mg/mL gel vaginal'], viaAdmin: 'oral/vaginal/IV' },
  { nome: 'Doxiciclina', classe: 'Tetraciclina', apresentacoes: ['100mg'], viaAdmin: 'oral' },

  // Antifúngicos
  { nome: 'Clotrimazol', classe: 'Azólico tópico', apresentacoes: ['1% creme', '100mg óvulo', '500mg óvulo'], viaAdmin: 'tópico/vaginal' },
  { nome: 'Miconazol', classe: 'Azólico tópico', apresentacoes: ['2% creme', '2% pó'], viaAdmin: 'tópico' },
  { nome: 'Fluconazol', classe: 'Azólico sistêmico', apresentacoes: ['150mg caps', '50mg caps'], viaAdmin: 'oral' },
  { nome: 'Terbinafina', classe: 'Alilamina', apresentacoes: ['1% creme', '250mg comp'], viaAdmin: 'tópico/oral' },

  // Antiparasitários
  { nome: 'Permetrina', classe: 'Piretroide tópico', apresentacoes: ['5% creme/loção'], viaAdmin: 'tópico' },
  { nome: 'Ivermectina', classe: 'Antiparasitário', apresentacoes: ['6mg comp', '0,6mg/mL gotas'], viaAdmin: 'oral' },
  { nome: 'Benzoato de Benzila', classe: 'Antiparasitário tópico', apresentacoes: ['25% loção'], viaAdmin: 'tópico' },

  // Antivirais
  { nome: 'Aciclovir', classe: 'Antiviral', apresentacoes: ['400mg comp', '200mg comp', '5% creme'], viaAdmin: 'oral/tópico' },
  { nome: 'Valaciclovir', classe: 'Antiviral', apresentacoes: ['500mg comp', '1g comp'], viaAdmin: 'oral' },

  // Colírios
  { nome: 'Tobramicina Colírio', classe: 'Antibiótico tópico ocular', apresentacoes: ['0,3% colírio'], viaAdmin: 'oftálmico' },
  { nome: 'Soro Fisiológico 0,9%', classe: 'Solução salina', apresentacoes: ['frasco 500mL', 'ampola 10mL', 'sachê lavagem ocular'], viaAdmin: 'tópico/IV/oral' },

  // Reidratação e suplementação
  { nome: 'Soro de Reidratação Oral', classe: 'Eletrólitos', apresentacoes: ['sachê 27,9g'], viaAdmin: 'oral' },
  { nome: 'Zinco', classe: 'Micronutriente', apresentacoes: ['10mg/5mL solução', '20mg comp'], viaAdmin: 'oral' },
  { nome: 'Sulfato Ferroso', classe: 'Suplementação de ferro', apresentacoes: ['40mg/mL gotas', '40mg Fe elemental comp'], viaAdmin: 'oral' },
  { nome: 'Ácido Fólico', classe: 'Vitamina B9', apresentacoes: ['0,4mg', '5mg comp'], viaAdmin: 'oral' },

  // Corticoides tópicos dermatologia
  { nome: 'Hidrocortisona', classe: 'Corticoide tópico baixa potência', apresentacoes: ['1% creme/pomada'], viaAdmin: 'tópico' },
  { nome: 'Betametasona', classe: 'Corticoide tópico alta potência', apresentacoes: ['0,05% creme/pomada'], viaAdmin: 'tópico' },

  // Outros
  { nome: 'Omeprazol', classe: 'IBP', apresentacoes: ['10mg', '20mg', '40mg'], viaAdmin: 'oral' },
  { nome: 'Sinvastatina', classe: 'Estatina', apresentacoes: ['10mg', '20mg', '40mg'], viaAdmin: 'oral' },
];

// ── RELAÇÕES DIAGNÓSTICO → MEDICAMENTO ───────────────────────
const relacoes = [
  // HAS
  { diagnostico: 'Hipertensão Arterial Sistêmica', medicamentos: ['Losartana', 'Enalapril', 'Anlodipino', 'Hidroclorotiazida', 'Atenolol'] },
  // Crise Hipertensiva
  { diagnostico: 'Crise Hipertensiva', medicamentos: ['Captopril', 'Anlodipino', 'Furosemida'] },
  // DM2
  { diagnostico: 'Diabetes Mellitus tipo 2', medicamentos: ['Metformina', 'Glibenclamida', 'Gliclazida MR', 'Insulina NPH Humana', 'Insulina Regular Humana'] },
  // Hipotireoidismo
  { diagnostico: 'Hipotireoidismo', medicamentos: ['Levotiroxina'] },
  // Dislipidemia
  { diagnostico: 'Dislipidemia', medicamentos: ['Sinvastatina'] },
  // Asma
  { diagnostico: 'Asma', medicamentos: ['Salbutamol', 'Beclometasona', 'Budesonida', 'Ipratrópio', 'Prednisona'] },
  // Crise Asmática
  { diagnostico: 'Crise Asmática', medicamentos: ['Salbutamol', 'Ipratrópio', 'Prednisona', 'Prednisolona'] },
  // DPOC
  { diagnostico: 'DPOC', medicamentos: ['Salbutamol', 'Ipratrópio', 'Prednisona'] },
  // Depressão
  { diagnostico: 'Depressão', medicamentos: ['Fluoxetina', 'Sertralina', 'Amitriptilina'] },
  // Ansiedade
  { diagnostico: 'Transtorno de Ansiedade Generalizada', medicamentos: ['Sertralina', 'Fluoxetina', 'Clonazepam'] },
  // ITU
  { diagnostico: 'Infecção do Trato Urinário Baixo', medicamentos: ['Nitrofurantoína', 'Sulfametoxazol + Trimetoprima', 'Cefalexina', 'Ciprofloxacino'] },
  // Faringoamigdalite
  { diagnostico: 'Faringoamigdalite Aguda', medicamentos: ['Amoxicilina', 'Penicilina Benzatina', 'Azitromicina'] },
  // IRA
  { diagnostico: 'Infecção Respiratória Aguda Alta', medicamentos: ['Paracetamol', 'Ibuprofeno', 'Dipirona'] },
  // Sinusite
  { diagnostico: 'Sinusite Aguda', medicamentos: ['Amoxicilina', 'Amoxicilina + Clavulanato'] },
  // Otite
  { diagnostico: 'Otite Média Aguda', medicamentos: ['Amoxicilina', 'Ibuprofeno', 'Paracetamol'] },
  // Diarreia aguda adulto
  { diagnostico: 'Diarreia Aguda', medicamentos: ['Soro de Reidratação Oral', 'Metronidazol'] },
  // Cefaleia
  { diagnostico: 'Cefaleia', medicamentos: ['Paracetamol', 'Ibuprofeno', 'Dipirona', 'Sumatriptano'] },
  // Lombalgia
  { diagnostico: 'Lombalgia', medicamentos: ['Ibuprofeno', 'Dipirona', 'Paracetamol', 'Ciclobenzaprina', 'Naproxeno'] },
  // Dermatofitose
  { diagnostico: 'Dermatofitose', medicamentos: ['Clotrimazol', 'Miconazol', 'Terbinafina', 'Fluconazol'] },
  // Escabiose
  { diagnostico: 'Escabiose', medicamentos: ['Permetrina', 'Ivermectina', 'Benzoato de Benzila'] },
  // Herpes-Zóster
  { diagnostico: 'Herpes-Zóster', medicamentos: ['Aciclovir', 'Valaciclovir', 'Prednisona', 'Amitriptilina'] },
  // Conjuntivite
  { diagnostico: 'Conjuntivite', medicamentos: ['Tobramicina Colírio', 'Soro Fisiológico 0,9%'] },
  // Febre sem foco pediátrica
  { diagnostico: 'Febre sem Foco', medicamentos: ['Paracetamol', 'Ibuprofeno', 'Dipirona'] },
  // Bronquiolite
  { diagnostico: 'Bronquiolite', medicamentos: ['Salbutamol', 'Soro Fisiológico 0,9%'] },
  // Pneumonia comunitária
  { diagnostico: 'Pneumonia Comunitária', medicamentos: ['Amoxicilina', 'Azitromicina', 'Amoxicilina + Clavulanato'] },
  // GEA pediátrica
  { diagnostico: 'Gastroenterite Aguda Pediátrica', medicamentos: ['Soro de Reidratação Oral', 'Zinco'] },
  // Dermatite atópica
  { diagnostico: 'Dermatite Atópica', medicamentos: ['Hidrocortisona', 'Betametasona'] },
  // Pré-natal
  { diagnostico: 'Pré-natal de Baixo Risco', medicamentos: ['Ácido Fólico', 'Sulfato Ferroso'] },
  // Vaginite
  { diagnostico: 'Vaginite', medicamentos: ['Metronidazol', 'Clotrimazol', 'Fluconazol'] },
  // IST
  { diagnostico: 'Infecções Sexualmente Transmissíveis', medicamentos: ['Penicilina Benzatina', 'Azitromicina', 'Ceftriaxona', 'Doxiciclina', 'Metronidazol'] },
  // Dengue
  { diagnostico: 'Dengue', medicamentos: ['Paracetamol', 'Soro de Reidratação Oral'] },
];

module.exports = { diagnosticos, medicamentos, relacoes };

/**
 * Base de conhecimento clínico — USF e Pronto Atendimento
 * Fontes: RENAME 2023, PCDT/CONITEC, Cadernos de Atenção Básica (MS),
 *         Diretrizes SBC / SBD / SBP / FEBRASGO / SBR, CID-10
 *
 * v3.0 — base expandida (~75 diagnósticos, ~129 medicamentos) + emergências UPA
 *         relações TRATA_COM com posologia (dose, linha, obs)
 */

// ── DIAGNÓSTICOS ──────────────────────────────────────────────
const diagnosticos = [

  // ── CRÔNICAS ──────────────────────────────────────────────
  {
    cid: 'I10',
    nome: 'Hipertensão Arterial Sistêmica',
    sinonimos: ['HAS', 'hipertensão', 'pressão alta', 'hipertensão arterial'],
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
    sinonimos: ['DM2', 'diabetes tipo 2', 'diabetes mellitus', 'glicose alta', 'hiperglicemia'],
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
    sinonimos: ['tireoidite de Hashimoto', 'hipotireoidismo primário', 'TSH elevado', 'tireoide lenta'],
    redFlags: [
      'Mixedema: edema endurecido, hipotermia, bradicardia grave',
      'Alteração de consciência (coma mixedematoso)',
      'Derrame pericárdico ou pleural volumoso',
    ],
    excluir: ['Hipotireoidismo central (TSH baixo)', 'Depressão primária'],
  },
  {
    cid: 'E05',
    nome: 'Hipertireoidismo',
    sinonimos: ['tireotoxicose', 'bócio tóxico', 'Doença de Graves', 'TSH baixo', 'hipertireoidismo'],
    redFlags: [
      'Tempestade tireoidiana: febre > 38,5°C + taquicardia + rebaixamento de consciência (emergência)',
      'FA de alta resposta + insuficiência cardíaca de alto débito',
      'Oftalmopatia com proptose grave ou perda visual (Graves)',
    ],
    excluir: ['Crise de ansiedade/pânico', 'Feocromocitoma', 'Insuficiência cardíaca de alto débito'],
  },
  {
    cid: 'E78.5',
    nome: 'Dislipidemia',
    sinonimos: ['hipercolesterolemia', 'hipertrigliceridemia', 'dislipidemia mista', 'colesterol alto', 'triglicerídeos altos'],
    redFlags: [
      'Triglicerídeos > 500 mg/dL (risco de pancreatite aguda)',
      'Xantomas tendíneos ou xantelasmas precoces (suspeitar dislipidemia familiar)',
    ],
    excluir: ['Hipotireoidismo (causa secundária)', 'Síndrome nefrótica', 'Diabetes descompensado'],
  },
  {
    cid: 'J45',
    nome: 'Asma',
    sinonimos: ['asma brônquica', 'broncoespasmo', 'chiado no peito', 'sibilo'],
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
    sinonimos: ['doença pulmonar obstrutiva crônica', 'enfisema', 'bronquite crônica', 'tosse crônica tabagista'],
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
    sinonimos: ['episódio depressivo', 'transtorno depressivo maior', 'depressão maior', 'tristeza persistente'],
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
    sinonimos: ['ansiedade', 'TAG', 'ansiedade generalizada', 'nervosismo excessivo', 'preocupação excessiva'],
    redFlags: [
      'Ideação suicida',
      'Sintomas autonômicos intensos (suspeitar causa orgânica: hipertireoidismo, feocromocitoma)',
    ],
    excluir: ['Hipertireoidismo', 'Arritmia cardíaca', 'Síndrome do pânico com causa orgânica'],
  },
  {
    cid: 'E66',
    nome: 'Obesidade',
    sinonimos: ['obesidade grau 1', 'obesidade grau 2', 'obesidade grau 3', 'sobrepeso', 'IMC elevado'],
    redFlags: [
      'IMC > 40 com comorbidades graves',
      'SAOS grave com hipersonolência diurna intensa',
    ],
    excluir: ['Hipotireoidismo', 'Síndrome de Cushing', 'Uso de medicamentos obesogênicos'],
  },
  {
    cid: 'I50',
    nome: 'Insuficiência Cardíaca Crônica',
    sinonimos: ['ICC', 'insuficiência cardíaca', 'insuficiência cardíaca congestiva', 'IC', 'coração fraco', 'fração de ejeção reduzida'],
    redFlags: [
      'Dispneia em repouso ou ortopneia grave',
      'SpO2 < 90% em ar ambiente',
      'Edema agudo de pulmão: crepitações basais + dispneia intensa',
      'PA sistólica < 90 mmHg (choque cardiogênico)',
      'B3 + JVD + edema periférico progressivo (descompensação)',
    ],
    excluir: ['TEP', 'Pneumonia', 'DPOC exacerbado', 'Pericardite com tamponamento'],
  },
  {
    cid: 'I48',
    nome: 'Fibrilação Atrial',
    sinonimos: ['FA', 'fibrilação atrial', 'flutter atrial', 'arritmia', 'coração irregular', 'pulso irregular'],
    redFlags: [
      'FA com FC > 150 bpm + instabilidade hemodinâmica (cardioversão elétrica emergência)',
      'Síncope ou pré-síncope',
      'Dor torácica (excluir SCA com FA)',
      'FA + déficit neurológico (FA com embolia cerebral)',
    ],
    excluir: ['TSV', 'Flutter atrial', 'Hipertireoidismo (causa secundária)', 'Bloqueio AV avançado'],
  },
  {
    cid: 'D50',
    nome: 'Anemia Ferropriva',
    sinonimos: ['anemia por falta de ferro', 'anemia carencial', 'anemia ferropênica', 'hemoglobina baixa', 'anemia por deficiência de ferro'],
    redFlags: [
      'Hb < 7 g/dL em adulto ou < 8 g/dL em criança < 5 anos (considerar transfusão)',
      'Anemia + sangue nas fezes ou melena (excluir neoplasia colorretal em > 45 anos)',
      'Anemia progressiva sem causa aparente em adulto (investigar sangramento oculto)',
    ],
    excluir: ['Anemia por doença crônica', 'Talassemia (VCM baixo desde infância)', 'Anemia megaloblástica (B12/folato)', 'Neoplasia hematológica'],
  },
  {
    cid: 'M10',
    nome: 'Gota',
    sinonimos: ['artrite gotosa', 'gota aguda', 'hiperuricemia sintomática', 'ataque de gota', 'ácido úrico alto', 'artrite por cristais'],
    redFlags: [
      'Febre alta + artrite monoarticular (excluir artrite séptica — artrocentese diagnóstica)',
      'Tofos extensos com úlceras cutâneas',
      'Nefropatia gotosa (urato sérico > 12 mg/dL + creatinina elevada)',
    ],
    excluir: ['Artrite séptica', 'Pseudogota (pirofosfato de cálcio)', 'Artrite reumatoide', 'Artrite psoriática'],
  },
  {
    cid: 'N40',
    nome: 'Hiperplasia Prostática Benigna',
    sinonimos: ['HPB', 'próstata aumentada', 'sintomas urinários masculinos', 'LUTS', 'jato urinário fraco', 'próstata'],
    redFlags: [
      'Retenção urinária aguda (globo vesical — sondagem imediata)',
      'Hematúria macroscópica persistente (excluir neoplasia)',
      'ITU recorrente por HPB',
      'Hidronefrose bilateral ao USG',
    ],
    excluir: ['Câncer de próstata', 'Prostatite aguda', 'Bexiga hiperativa', 'Estenose de uretra'],
  },
  {
    cid: 'G40',
    nome: 'Epilepsia',
    sinonimos: ['convulsão', 'crise epiléptica', 'crise convulsiva', 'epilepsia', 'status epilepticus', 'crise tônico-clônica'],
    redFlags: [
      'Crise prolongada > 5 min (estado de mal epiléptico — emergência)',
      'Primeira crise convulsiva em adulto (investigação mandatória)',
      'Pós-ictal prolongado > 30 min',
      'Febre + convulsão em criança > 5 anos (excluir meningite)',
      'Convulsão + déficit focal (suspeitar lesão estrutural)',
    ],
    excluir: ['Síncope convulsivante', 'Hipoglicemia', 'Abstinência alcoólica', 'Meningite/encefalite', 'AVC', 'Pseudocrise'],
  },

  // ── AGUDAS — ADULTO ───────────────────────────────────────
  {
    cid: 'N39.0',
    nome: 'Infecção do Trato Urinário Baixo',
    sinonimos: ['ITU', 'cistite', 'infecção urinária', 'disúria', 'ardência urinária', 'queimação ao urinar'],
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
    cid: 'N12',
    nome: 'Pielonefrite Aguda',
    sinonimos: ['pielonefrite', 'ITU alta', 'infecção renal', 'febre urinária', 'infecção urinária com febre'],
    redFlags: [
      'Sepse urinária: FC > 100, FR > 20, T > 38,3°C, confusão (internação)',
      'PA sistólica < 90 mmHg (choque séptico)',
      'Gestante com pielonefrite (internação)',
      'Rim único ou transplantado',
    ],
    excluir: ['Apendicite (dor FID + febre)', 'Cólica renal complicada', 'Abscesso renal (USG)', 'Abscesso perirrenal'],
  },
  {
    cid: 'N20',
    nome: 'Cólica Renal',
    sinonimos: ['pedra nos rins', 'nefrolitíase', 'cálculo renal', 'urolitíase', 'cólica nefrítica', 'cálculo urinário'],
    redFlags: [
      'Febre + cólica renal (obstrução infectada = urgência urológica)',
      'Rim único ou transplantado com cólica',
      'Anúria ou oligúria',
      'Dor em flancos em > 55 anos sem cálculo prévio (excluir aneurisma de aorta)',
    ],
    excluir: ['Apendicite', 'Pielonefrite', 'Aneurisma de aorta abdominal', 'Colecistite (dor HD)'],
  },
  {
    cid: 'J02.9',
    nome: 'Faringoamigdalite Aguda',
    sinonimos: ['faringite', 'amigdalite', 'dor de garganta', 'amigdalite bacteriana', 'angina', 'garganta inflamada'],
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
    sinonimos: ['IRA alta', 'resfriado comum', 'síndrome gripal', 'gripe', 'rinofaringite', 'resfriado', 'coriza'],
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
    sinonimos: ['rinossinusite', 'sinusite bacteriana', 'sinusite', 'dor na face', 'secreção nasal purulenta'],
    redFlags: [
      'Edema periorbitário ou proptose (complicação orbitária)',
      'Rigidez de nuca ou cefaleia intensa (complicação intracraniana)',
      'Febre alta persistente > 3-4 dias sem melhora com ATB',
    ],
    excluir: ['Sinusite fúngica invasiva (imunossuprimido)', 'Rinite alérgica', 'Corpo estranho nasal (criança)'],
  },
  {
    cid: 'H66.9',
    nome: 'Otite Média Aguda',
    sinonimos: ['OMA', 'otite aguda', 'infecção de ouvido', 'dor de ouvido', 'otalgia', 'otite'],
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
    sinonimos: ['gastroenterite aguda', 'GEA', 'diarreia infecciosa', 'diarreia', 'desinteria', 'intoxicação alimentar'],
    redFlags: [
      'Sinais de desidratação grave: olhos fundos, turgor diminuído, sem lágrimas',
      'Sangue nas fezes com febre alta (suspeitar Shigella, Salmonella)',
      'Diarreia > 7 dias (pensar em parasitose ou causa inflamatória)',
      'Idoso ou imunossuprimido com piora rápida',
    ],
    excluir: ['Apendicite (diarreia + dor FID)', 'DII (doença inflamatória intestinal)', 'Colite pseudomembranosa'],
  },
  {
    cid: 'K21',
    nome: 'Doença do Refluxo Gastroesofágico',
    sinonimos: ['DRGE', 'refluxo', 'azia', 'queimação estomacal', 'pirose', 'esofagite', 'refluxo ácido', 'queimação no peito'],
    redFlags: [
      'Disfagia ou odinofagia (suspeitar estenose ou neoplasia)',
      'Perda de peso não intencional',
      'Anemia ou sangramento digestivo',
      'Vômitos persistentes ou recorrentes',
      'Sintomas refratários a IBP após 8 semanas (investigar DRGE não erosiva, esôfago de Barrett)',
    ],
    excluir: ['Neoplasia de esôfago', 'Úlcera péptica', 'Acalasia', 'Angina/SCA (dor retroesternal)'],
  },
  {
    cid: 'K25',
    nome: 'Úlcera Péptica',
    sinonimos: ['úlcera gástrica', 'úlcera duodenal', 'gastrite', 'dor epigástrica', 'H. pylori', 'helicobacter pylori', 'gastrite por helicobacter'],
    redFlags: [
      'Melena ou hematêmese (sangramento digestivo alto — emergência)',
      'Dor epigástrica irradiando para dorso + febre (pancreatite)',
      'Defesa abdominal ou abdome em tábua (perfuração)',
      'Síncope após dor epigástrica',
    ],
    excluir: ['Pancreatite aguda', 'Neoplasia gástrica (perda de peso + saciedade precoce)', 'SCA (dor epigástrica irradiando para mandíbula)', 'Colecistite'],
  },
  {
    cid: 'K80',
    nome: 'Cólica Biliar',
    sinonimos: ['cálculo biliar', 'colelitíase', 'colecistite', 'dor no hipocôndrio direito', 'vesícula', 'pedra na vesícula', 'dor embaixo das costelas direita'],
    redFlags: [
      'Febre + dor HD + icterícia (colangite de Charcot — emergência)',
      'Sinal de Murphy positivo + febre > 38°C (colecistite aguda)',
      'Icterícia progressiva (coledocolitíase — CPRE urgente)',
      'PA instável + dor irradiando para dorso (pancreatite biliar)',
    ],
    excluir: ['Pancreatite aguda', 'Hepatite', 'Úlcera péptica', 'Apendicite variante', 'Pneumonia de base direita'],
  },
  {
    cid: 'R51',
    nome: 'Cefaleia',
    sinonimos: ['dor de cabeça', 'enxaqueca', 'migrânea', 'cefaleia tensional', 'cefaleia crônica', 'hemicrania'],
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
    sinonimos: ['dor lombar', 'dor nas costas', 'lombalgia mecânica', 'lombociatalgia', 'ciática', 'dor na coluna'],
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
    cid: 'K59',
    nome: 'Constipação Crônica',
    sinonimos: ['prisão de ventre', 'intestino preso', 'constipação', 'intestino lento', 'evacuar pouco'],
    redFlags: [
      'Sangue nas fezes ou melena (excluir neoplasia, hemorroida complicada)',
      'Perda de peso > 5% não intencional',
      'Constipação nova em paciente > 50 anos sem causa aparente (colonoscopia)',
      'Anemia ferropriva + constipação (rastreio de Ca colorretal)',
    ],
    excluir: ['Hipotireoidismo', 'Câncer colorretal', 'Efeito de medicamentos (ferro, opioides, anticolinérgicos)', 'Doença de Hirschsprung (criança)'],
  },
  {
    cid: 'H81.1',
    nome: 'Vertigem',
    sinonimos: ['VPPB', 'labirintite', 'vertigem posicional', 'tontura', 'vertigem paroxística', 'labirinto', 'desequilíbrio'],
    redFlags: [
      'Nistagmo vertical (suspeitar lesão central/cerebelar)',
      'Vertigem + cefaleia intensa súbita (hemorragia cerebelar)',
      'Déficit neurológico focal: diplopia, disfagia, disartria, ataxia (AVC de fossa posterior)',
      'Surdez súbita unilateral progressiva (schwannoma vestibular)',
    ],
    excluir: ['AVC cerebelar', 'Doença de Ménière (vertigem + hipoacusia + zumbido)', 'Neurite vestibular', 'Schwannoma vestibular'],
  },
  {
    cid: 'B35',
    nome: 'Dermatofitose',
    sinonimos: ['tinha', 'micose', 'pé de atleta', 'tinea pedis', 'tinea corporis', 'tinea cruris', 'tinea unguium', 'fungo na pele', 'micose de unha'],
    redFlags: [
      'Celulite associada (porta de entrada para infecção bacteriana)',
      'Tinea capitis com queda de cabelo extensa em criança',
    ],
    excluir: ['Psoríase', 'Eczema', 'Pitiríase rosada', 'Candidíase cutânea'],
  },
  {
    cid: 'B86',
    nome: 'Escabiose',
    sinonimos: ['sarna', 'sarnas', 'infestação por Sarcoptes scabiei', 'coceira noturna intensa', 'prurido noturno'],
    redFlags: [
      'Sarna crostosa (norueguesa) em imunossuprimido — altamente contagiosa',
      'Lesões impetiginizadas extensas',
    ],
    excluir: ['Dermatite atópica', 'Prurigo', 'Urticária'],
  },
  {
    cid: 'B02',
    nome: 'Herpes-Zóster',
    sinonimos: ['zóster', 'cobreiro', 'herpes zoster', 'neuralgia herpética', 'vesículas em faixa'],
    redFlags: [
      'Envolvimento do V1 (herpes oftálmico — encaminhar oftalmologia urgente)',
      'Envolvimento de pavilhão auricular + paralisia facial (Ramsay-Hunt)',
      'Disseminação em imunossuprimido',
    ],
    excluir: ['Dermatite de contato', 'Erisipela inicial', 'Neuralgia pós-herpética estabelecida'],
  },
  {
    cid: 'H10.9',
    nome: 'Conjuntivite',
    sinonimos: ['olho vermelho', 'conjuntivite bacteriana', 'conjuntivite viral', 'conjuntivite alérgica', 'olho inflamado'],
    redFlags: [
      'Baixa acuidade visual',
      'Dor ocular intensa (não descrita como ardor)',
      'Fotofobia intensa (suspeitar ceratite ou uveíte)',
      'Hipópion (nível de pus na câmara anterior)',
    ],
    excluir: ['Glaucoma agudo', 'Ceratite', 'Uveíte anterior', 'Corpo estranho ocular'],
  },
  {
    cid: 'L03',
    nome: 'Erisipela e Celulite',
    sinonimos: ['erisipela', 'celulite infecciosa', 'infecção de pele', 'pele vermelha inflamada', 'erisipela de perna'],
    redFlags: [
      'Crepitação à palpação (fasciíte necrosante — emergência cirúrgica)',
      'Linha de progressão rápida < 12h + toxemia',
      'Bolhas hemorrágicas ou necrose cutânea',
      'Hipotensão ou confusão (sepse)',
    ],
    excluir: ['Fasciíte necrosante', 'TVP (distinguir com Doppler)', 'Síndrome de Stevens-Johnson'],
  },
  {
    cid: 'L01',
    nome: 'Impetigo',
    sinonimos: ['impetigo crostoso', 'impetigo bolhoso', 'empigem', 'ferida infeccionada', 'crosta mel'],
    redFlags: [
      'Lesões extensas com febre em lactente < 3 meses',
      'Progressão rápida com bolhas confluentes (síndrome da pele escaldada estafilocócica)',
      'Glomerulonefrite pós-estreptocócica: hematúria + edema + HAS após impetigo',
    ],
    excluir: ['Herpes simples', 'Varicela (vesículas no tronco)', 'Escabiose impetiginizada'],
  },
  {
    cid: 'J30',
    nome: 'Rinite Alérgica',
    sinonimos: ['rinite', 'alergia respiratória', 'rinite perene', 'rinite sazonal', 'coriza alérgica', 'espirros constantes', 'nariz entupido alergia'],
    redFlags: [
      'Pólipos nasais extensos com obstrução total',
      'Sinusite bacteriana recorrente',
      'Asma de difícil controle associada',
    ],
    excluir: ['Rinite vasomotora', 'Rinossinusite bacteriana aguda', 'Corpo estranho nasal (criança unilateral)'],
  },
  {
    cid: 'L50',
    nome: 'Urticária e Angioedema',
    sinonimos: ['urticária', 'angioedema', 'alergia cutânea', 'coceira generalizada', 'placas urticariformes', 'inchaço de lábio', 'urticária aguda'],
    redFlags: [
      'Angioedema de lábios, língua ou glote (risco de asfixia)',
      'Comprometimento respiratório: estridor, disfonia, dispneia',
      'Hipotensão ou síncope (anafilaxia associada)',
    ],
    excluir: ['Anafilaxia', 'Angioedema hereditário (ACE inibidor → bradicinina)', 'Vasculite urticariforme'],
  },
  {
    cid: 'T78.2',
    nome: 'Anafilaxia',
    sinonimos: ['choque anafilático', 'reação anafilática', 'reação alérgica grave', 'anafilaxia', 'choque alérgico'],
    redFlags: [
      'É uma emergência por definição — toda anafilaxia é red flag',
      'Hipotensão + urticária/angioedema após exposição a alérgeno',
      'Broncoespasmo após picada de inseto ou ingestão de alimento',
    ],
    excluir: ['Síncope vasovagal', 'Crise de pânico', 'Angioedema hereditário', 'Choque séptico'],
  },
  {
    cid: 'U07.1',
    nome: 'Covid-19',
    sinonimos: ['COVID', 'SARS-CoV-2', 'coronavírus', 'covid-19', 'covid leve', 'COVID moderado'],
    redFlags: [
      'SpO2 < 94% em ar ambiente (internação)',
      'FR > 24 irpm ou sensação de falta de ar em repouso',
      'Confusão mental ou sonolência excessiva',
      'Fatores de risco para forma grave: > 60 anos, DM, obesidade IMC > 35, DPOC, imunossupressão',
      'Piora após melhora inicial (dia 7-10 = fase inflamatória)',
    ],
    excluir: ['Influenza', 'Pneumonia bacteriana', 'TEP (pós-COVID)', 'Síndrome de hiperinflamação'],
  },

  // ── PEDIATRIA ─────────────────────────────────────────────
  {
    cid: 'R50.9',
    nome: 'Febre sem Foco',
    sinonimos: ['febre em criança', 'febre sem foco definido', 'febre pediátrica', 'criança com febre'],
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
    sinonimos: ['bronquiolite viral aguda', 'BVA', 'chiado em lactente', 'sibilância em bebê'],
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
    sinonimos: ['PAC', 'pneumonia adquirida na comunidade', 'pneumonia', 'pneumonia bacteriana'],
    redFlags: [
      'SpO2 < 92% ou cianose',
      'Taquipneia grave: > 60 irpm < 2m, > 50 irpm 2-12m, > 40 irpm 1-5a',
      'Tiragem subcostal em criança',
      'Rebaixamento de consciência',
      'PA sistólica < 90 mmHg',
    ],
    excluir: ['Derrame pleural complicado', 'Empiema', 'Abscesso pulmonar', 'TEP'],
  },
  {
    cid: 'K52.9',
    nome: 'Gastroenterite Aguda Pediátrica',
    sinonimos: ['GEA pediátrica', 'diarreia em criança', 'gastroenterite em criança', 'vômito e diarreia criança'],
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
    sinonimos: ['eczema atópico', 'eczema', 'dermatite atópica', 'alergia de pele', 'coceira eczema'],
    redFlags: [
      'Eczema herpético (lesões vesiculares confluentes em placa de eczema — infecção por HSV)',
      'Infecção bacteriana secundária extensa (impetiginização)',
    ],
    excluir: ['Escabiose', 'Psoríase em placa', 'Dermatofitose', 'Ictiose'],
  },

  // ── EMERGÊNCIAS UPA ───────────────────────────────────────
  {
    cid: 'I21',
    nome: 'Síndrome Coronariana Aguda',
    sinonimos: ['SCA', 'infarto', 'IAM', 'STEMI', 'NSTEMI', 'angina instável', 'dor no peito isquêmica', 'infarto agudo do miocárdio'],
    redFlags: [
      'Dor torácica + sudorese fria + irradiação para braço/mandíbula (IAM até prova contrária)',
      'Supradesnivelamento de ST ≥ 1mm em ≥ 2 derivações contíguas (STEMI — reperfusão em < 90 min)',
      'Troponina elevada + ECG com alterações dinâmicas (NSTEMI)',
      'Dor em repouso > 20 min sem melhora com nitrato (angina instável de alto risco)',
      'Hipotensão + bradicardia + congestão (Killip IV — choque cardiogênico)',
    ],
    excluir: ['Dissecção aórtica (dor em rasgada, assimetria de pulsos)', 'TEP', 'Pericardite (melhora sentado)', 'DRGE', 'Espasmo esofágico'],
  },
  {
    cid: 'I50.1',
    nome: 'Edema Agudo de Pulmão',
    sinonimos: ['EAP', 'edema pulmonar', 'congestão pulmonar aguda', 'insuficiência cardíaca aguda', 'falta de ar grave'],
    redFlags: [
      'SpO2 < 90% em ar ambiente (emergência)',
      'FR > 30 irpm + uso intenso de musculatura acessória',
      'Ortopneia + crepitações bibasais + expectoração rósea espumosa (EAP franco)',
      'PA sistólica < 90 mmHg (choque cardiogênico — prognóstico grave)',
    ],
    excluir: ['TEP maciço', 'Pneumonia grave / SDRA', 'Crise asmática grave', 'Tamponamento cardíaco'],
  },
  {
    cid: 'I47.1',
    nome: 'Taquicardia Supraventricular',
    sinonimos: ['TSV', 'taquicardia paroxística supraventricular', 'taquicardia regular de QRS estreito', 'palpitação com FC alta'],
    redFlags: [
      'FC > 150 bpm + hipotensão/síncope (cardioversão elétrica sincronizada imediata)',
      'TSV + pré-excitação (WPW) + FA — não usar verapamil/adenosina',
      'Dor torácica + TSV (excluir SCA desencadeada por taquicardia)',
    ],
    excluir: ['FA/flutter com condução aberrante', 'TV (QRS alargado)', 'WPW'],
  },
  {
    cid: 'I71',
    nome: 'Dissecção Aórtica',
    sinonimos: ['dissecção de aorta', 'aneurisma dissecante', 'dor torácica em rasgada', 'dor nas costas súbita intensa'],
    redFlags: [
      'Dor torácica ou dorsal de início súbito em punhalada/rasgo (emergência cirúrgica)',
      'Assimetria de pulsos ou PA entre membros > 20 mmHg',
      'Déficit neurológico focal de início súbito com dor torácica',
      'Insuficiência aórtica aguda + dor (tipo A)',
    ],
    excluir: ['SCA', 'TEP', 'Úlcera péptica', 'Pancreatite (dor irradiando para dorso)'],
  },
  {
    cid: 'I63',
    nome: 'AVC Isquêmico',
    sinonimos: ['AVC', 'acidente vascular cerebral', 'derrame cerebral', 'AVC isquêmico', 'stroke', 'hemiplegia', 'afasia súbita', 'déficit neurológico focal súbito'],
    redFlags: [
      'FAST positivo (Face + Arms + Speech + Time): chamar neurologia e TC urgente',
      'Janela terapêutica < 4,5h desde o início dos sintomas (candidato a trombólise)',
      'Rebaixamento progressivo de consciência (possível transformação hemorrágica ou herniação)',
      'Glicemia < 50 ou > 400 (corrigir antes de confirmar AVC)',
    ],
    excluir: ['Hipoglicemia (imitar déficit focal)', 'AVC hemorrágico (TC diferencia)', 'Meningite/encefalite', 'Crise epiléptica + paralisia de Todd', 'Tumor cerebral com déficit agudo'],
  },
  {
    cid: 'I61',
    nome: 'AVC Hemorrágico',
    sinonimos: ['hemorragia intracerebral', 'AVC hemorrágico', 'sangramento cerebral', 'acidente vascular hemorrágico'],
    redFlags: [
      'Cefaleia súbita intensa + déficit neurológico + vômitos (TC urgente)',
      'Glasgow < 13 ou queda rápida de consciência (emergência neurocirúrgica)',
      'Hemorragia cerebelar com compressão de tronco (cirurgia de urgência)',
      'Paciente em anticoagulação com hemorragia (reverter imediatamente)',
    ],
    excluir: ['AVC isquêmico (TC diferencia)', 'HSA (TC + LCR)', 'Encefalite hemorrágica', 'Tumor com sangramento'],
  },
  {
    cid: 'I60',
    nome: 'Hemorragia Subaracnóidea',
    sinonimos: ['HSA', 'hemorragia subaracnoide', 'cefaleia em trovoada', 'pior cefaleia da vida', 'cefaleia súbita explosiva'],
    redFlags: [
      'Cefaleia de início súbito "em trovoada" — pior da vida (HSA até prova contrária)',
      'Cefaleia + rigidez de nuca + fotofobia (irritação meníngea)',
      'Aneurisma sentinela: cefaleia "de aviso" dias antes (alerta máximo)',
      'Nível de consciência flutuante pós-cefaleia',
    ],
    excluir: ['Enxaqueca (sem déficit, história prévia similar)', 'Meningite bacteriana (febre + evolução subaguda)', 'AVC hemorrágico', 'Hipertensão intracraniana'],
  },
  {
    cid: 'R55',
    nome: 'Síncope',
    sinonimos: ['desmaio', 'perda de consciência', 'lipotimia', 'síncope vasovagal', 'síncope cardíaca', 'síncope ortostática'],
    redFlags: [
      'Síncope durante esforço físico (suspeitar doença cardíaca estrutural ou arritmia)',
      'Síncope sem pródromo precedida por palpitações (arritmia)',
      'Síncope + dor torácica ou dispneia (SCA, TEP, dissecção aórtica)',
      'Síncope em decúbito (arritmia grave)',
      'ECG alterado: QTc longo, bloqueio AV, BCRD + BFA (Brugada)',
    ],
    excluir: ['Epilepsia (pós-ictal, movimentos tônico-clônicos)', 'Hipoglicemia', 'AVC/TIA', 'Intoxicação', 'Pseudossíncope (transtorno conversivo)'],
  },
  {
    cid: 'I26',
    nome: 'Tromboembolismo Pulmonar',
    sinonimos: ['TEP', 'embolia pulmonar', 'trombose pulmonar', 'dispneia súbita com taquicardia', 'TEP maciço'],
    redFlags: [
      'TEP maciço: choque/hipotensão + SpO2 < 90% (trombólise sistêmica urgente)',
      'Escore de Wells ≥ 5 + D-dímero elevado (probabilidade alta)',
      'SADI clínico: S1Q3T3 no ECG + taquicardia + SpO2 baixa + TVP',
      'Gravidez + taquicardia + dispneia (considerar TEP)',
    ],
    excluir: ['Pneumonia', 'Pneumotórax', 'SCA', 'Pericardite', 'ICC exacerbada', 'Crise asmática grave'],
  },
  {
    cid: 'J93',
    nome: 'Pneumotórax Espontâneo',
    sinonimos: ['pneumotórax', 'pulmão colapsado', 'pneumotórax primário', 'pneumotórax hipertensivo', 'dor pleurítica com dispneia'],
    redFlags: [
      'Desvio de traqueia + hipotensão + turgência jugular (pneumotórax hipertensivo — agulha imediata)',
      'SpO2 < 90% com dor pleurítica e murmúrio vesicular abolido unilateral',
      'Pneumotórax bilateral (raro, mas fatal)',
    ],
    excluir: ['TEP', 'Pleurite', 'SCA (dor pleurítica pode confundir)', 'Ruptura de bolha enfisematosa (DPOC)'],
  },
  {
    cid: 'A41.9',
    nome: 'Sepse e Choque Séptico',
    sinonimos: ['sepse', 'choque séptico', 'sepse grave', 'infecção com instabilidade hemodinâmica', 'SIRS infeccioso', 'sepse bacteriana'],
    redFlags: [
      'Critérios Sepse-3: disfunção orgânica (SOFA ≥ 2) por infecção suspeita',
      'Choque séptico: PAM < 65 mmHg ou lactato > 2 mmol/L refratário a fluidos',
      'Bundle 1h: hemocultura + ATB + lactato + acesso venoso + fluidos',
      'Hipotensão + febre + foco infeccioso aparente (UTI/observação)',
    ],
    excluir: ['SIRS não infeccioso (pancreatite, trauma, queimadura)', 'Choque cardiogênico', 'Insuficiência adrenal aguda (crise addisoniana)', 'Crise tireotóxica'],
  },
  {
    cid: 'R57.1',
    nome: 'Choque Hipovolêmico',
    sinonimos: ['choque hemorrágico', 'hipovolemia grave', 'sangramento ativo com instabilidade', 'choque por desidratação', 'perda volêmica grave'],
    redFlags: [
      'FC > 120 + PA sistólica < 90 + extremidades frias (classes III/IV)',
      'Shock index (FC/PAs) > 1,0 (significativa) ou > 1,4 (grave)',
      'Sangramento ativo não controlado (cirurgia/intervenção urgente)',
      'Rebaixamento de consciência por hipovolemia',
    ],
    excluir: ['Choque cardiogênico (JVD, galope B3)', 'Choque séptico (febre, foco infeccioso)', 'Choque obstrutivo (TEP, tamponamento)', 'Choque distributivo (anafilaxia)'],
  },
  {
    cid: 'E10.1',
    nome: 'Cetoacidose Diabética',
    sinonimos: ['CAD', 'cetoacidose diabética', 'DM descompensado com cetose', 'acidose diabética', 'cetose diabética'],
    redFlags: [
      'pH < 7,0 ou bicarbonato < 5 mEq/L (CAD grave)',
      'Glasgow < 13 (internação em UTI)',
      'K < 3,5 mEq/L — iniciar KCl antes da insulina (risco de hipocalemia fatal)',
      'K > 6,5 mEq/L — monitorização cardíaca contínua',
      'Glicemia > 600 com ausência de cetonemia (pensar EHH)',
    ],
    excluir: ['Estado Hiperosmolar Hiperglicêmico', 'Acidose láctica', 'Intoxicação por metanol/etilenoglicol', 'Cetoacidose alcoólica'],
  },
  {
    cid: 'E11.0',
    nome: 'Estado Hiperosmolar Hiperglicêmico',
    sinonimos: ['EHH', 'coma hiperosmolar', 'estado hiperosmolar', 'glicemia muito alta sem cetose', 'coma diabético'],
    redFlags: [
      'Glicemia > 600 mg/dL + osmolaridade sérica > 320 mOsm/kg + ausência de acidose significativa',
      'Rebaixamento progressivo de consciência',
      'Desidratação grave: mucosas ressecadas, turgor diminuído, taquicardia',
      'Convulsões (hiperosmolaridade causa irritação cortical)',
    ],
    excluir: ['Cetoacidose Diabética (pH < 7,3 + cetonemia)', 'AVC', 'Intoxicação', 'Meningite/encefalite'],
  },
  {
    cid: 'E16.0',
    nome: 'Hipoglicemia Grave',
    sinonimos: ['hipoglicemia', 'baixo açúcar no sangue', 'glicemia baixa', 'crise hipoglicêmica', 'hipoglicemia sintomática grave'],
    redFlags: [
      'Glicemia < 50 mg/dL com alteração de consciência, convulsão ou comportamento agressivo',
      'Hipoglicemia em paciente em uso de sulfonilureia (risco de recorrência prolongada — observação 24h)',
      'Hipoglicemia + hepatopatia grave ou insuficiência adrenal (causa secundária)',
      'Hipoglicemia refratária após glicose IV (insulinoma, intoxicação por sulfonilureia)',
    ],
    excluir: ['AVC (pode apresentar confusão)', 'Epilepsia', 'Intoxicação alcoólica', 'Sepse (hipoglicemia por consumo)'],
  },
  {
    cid: 'K37',
    nome: 'Apendicite Aguda',
    sinonimos: ['apendicite', 'dor no apêndice', 'dor na fossa ilíaca direita', 'dor FID', 'appendicite'],
    redFlags: [
      'Defesa abdominal generalizada ou abdome em tábua (peritonite — cirurgia urgente)',
      'Febre > 38,5°C + leucocitose > 15.000 + dor FID (apendicite complicada)',
      'Criança com vômitos + dor periumbilical migrando para FID + febre',
      'Escore de Alvarado ≥ 7 (alta probabilidade)',
    ],
    excluir: ['Cólica renal D (dor FID + hematúria)', 'Pielonefrite D', 'Torção de ovário D (mulher em idade fértil)', 'DIP', 'Cólica biliar (dor HD)'],
  },
  {
    cid: 'K85',
    nome: 'Pancreatite Aguda',
    sinonimos: ['pancreatite', 'inflamação do pâncreas', 'dor epigástrica irradiando para dorso', 'pancreatite aguda', 'lipase elevada'],
    redFlags: [
      'SIRS (FR > 20, FC > 90, T > 38,3°C ou < 36°C, leucocitose) + lipase > 3x o normal',
      'Pancreatite necro-hemorrágica: sinal de Grey-Turner (flancos) ou Cullen (umbilical)',
      'Ranson score ≥ 3 ou APACHE-II > 8 nas primeiras 48h (pancreatite grave)',
      'Hipotensão + PA sistólica < 90 ou SpO2 < 95% (complicações sistêmicas)',
    ],
    excluir: ['Úlcera péptica perfurada', 'Colecistite aguda', 'Isquemia mesentérica', 'SCA de parede inferior (elevação de enzimas)', 'Obstrução intestinal alta'],
  },
  {
    cid: 'K56',
    nome: 'Obstrução Intestinal',
    sinonimos: ['obstrução intestinal', 'oclusão intestinal', 'íleo obstrutivo', 'distensão abdominal', 'vômitos fecaloides', 'parada de eliminação de fezes e gases'],
    redFlags: [
      'Ausência de ruídos + dor contínua intensa + febre (estrangulamento/isquemia — emergência cirúrgica)',
      'Vômitos fecaloides + distensão abdominal intensa',
      'Sinal de Koenig (borborigmos + cólica cíclica) em laço fixo',
      'Hipotensão + taquicardia (obstrução complicada)',
    ],
    excluir: ['Íleo paralítico (pós-operatório, eletrólitos)', 'Vólvulo de sigmoide', 'Hérnia encarcerada (inspeção)', 'Isquemia mesentérica (dor desproporcional ao exame)', 'Gastroenterite grave'],
  },
  {
    cid: 'S09.9',
    nome: 'Traumatismo Cranioencefálico',
    sinonimos: ['TCE', 'trauma de crânio', 'traumatismo crânio-encefálico', 'pancada na cabeça', 'TCE leve', 'TCE moderado', 'concussão'],
    redFlags: [
      'Glasgow ≤ 13 (TCE moderado/grave — TC imediata)',
      'Vômitos em jatos repetidos (> 2 episódios) pós-trauma',
      'Amnésia anterógrada > 30 min ou retrógrada > 30 min',
      'Sinais de fratura de base: Battle sign, hematoma periorbital bilateral, hemotímpano, otorragia',
      'Convulsão pós-trauma imediata',
      'Anticoagulados com qualquer TCE (baixo limiar para TC)',
    ],
    excluir: ['Intoxicação alcoólica (pode mascarar TCE)', 'AVC hemorrágico sem trauma', 'Hipoglicemia'],
  },
  {
    cid: 'G41',
    nome: 'Estado de Mal Epiléptico',
    sinonimos: ['status epilepticus', 'estado epiléptico', 'crise epiléptica prolongada', 'convulsão não cede', 'crise tônico-clônica > 5 minutos'],
    redFlags: [
      'Convulsão tônico-clônica > 5 min (status epilepticus — protocolo de emergência)',
      '2 ou mais crises sem recuperação do nível de consciência entre elas',
      'Status epilepticus refratário (> 30 min) — intubação + UTI',
      'Status após TCE, AVC ou hipoglicemia (causa secundária grave)',
    ],
    excluir: ['Pseudocrise (transtorno dissociativo — não há alteração EEG)', 'Hipoglicemia (sempre checar glicemia)', 'Hiponatremia grave', 'Abstinência alcoólica', 'Encefalopatia urêmica'],
  },
  {
    cid: 'T39.1',
    nome: 'Intoxicação por Paracetamol',
    sinonimos: ['intoxicação paracetamol', 'overdose de paracetamol', 'intoxicação por acetaminofeno', 'envenenamento por paracetamol'],
    redFlags: [
      'Dose > 150mg/kg ou > 7,5g em adulto em dose única (potencialmente hepatotóxico)',
      'Nomograma de Rumack-Matthew: paracetamolemia acima da linha de tratamento',
      'Transaminases > 1000 UI/L (hepatotoxicidade instalada)',
      'INR > 2,0 ou coagulopatia (insuficiência hepática aguda)',
      'Náuseas/vômitos nas primeiras horas (intoxicação recente)',
    ],
    excluir: ['Hepatite viral aguda', 'Hepatotoxicidade por outros fármacos', 'Insuficiência hepática de outra etiologia'],
  },
  {
    cid: 'T42.4',
    nome: 'Intoxicação por Benzodiazepínico',
    sinonimos: ['intoxicação BZD', 'overdose de benzodiazepínico', 'intoxicação por diazepam', 'overdose de clonazepam', 'intoxicação por ansiolítico'],
    redFlags: [
      'Glasgow < 8 ou apneia (intubação orotraqueal)',
      'SpO2 < 90% sem resposta ao flumazenil',
      'Suspeita de intoxicação mista (BZD + opioides + álcool) — mais grave',
      'Bradicardia + hipotensão intensa',
    ],
    excluir: ['Intoxicação por opioides (miose + depressão respiratória — naloxona)', 'AVC', 'Hipoglicemia', 'TCE', 'Intoxicação por álcool isolada'],
  },
  {
    cid: 'T60.0',
    nome: 'Intoxicação por Organofosforado',
    sinonimos: ['intoxicação por agrotóxico', 'envenenamento por organofosforado', 'intoxicação por inseticida', 'crise colinérgica', 'SLUDGE'],
    redFlags: [
      'Síndrome muscarínica (SLUDGE): Salivação, Lacrimejamento, Urina, Defecação, GI (cólica), Emese + Bradicardia',
      'Broncoespasmo + hipersecreção bronquial (asfixia)',
      'Fasciculações + fraqueza muscular progressiva (síndrome nicotínica)',
      'Convulsão (emergência — atropina + diazepam + suporte ventilatório)',
      'Midríase + coma (dose maciça)',
    ],
    excluir: ['Asma grave (sem SLUDGE)', 'Choque séptico', 'Intoxicação por carbamato (similar mas reversível mais rápido)'],
  },

  // ── SAÚDE DA MULHER ───────────────────────────────────────
  {
    cid: 'Z34',
    nome: 'Pré-natal de Baixo Risco',
    sinonimos: ['pré-natal', 'gestação', 'gravidez de baixo risco', 'gravidez', 'gestante'],
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
    sinonimos: ['candidíase vaginal', 'vaginose bacteriana', 'vaginite', 'corrimento vaginal', 'candidíase', 'corrimento com coceira'],
    redFlags: [
      'Corrimento com odor fétido + febre (suspeitar DIP)',
      'Dor pélvica intensa (excluir DIP ou gravidez ectópica)',
    ],
    excluir: ['DIP (doença inflamatória pélvica)', 'IST (gonorreia, clamídia, tricomoníase)'],
  },
  {
    cid: 'A64',
    nome: 'Infecções Sexualmente Transmissíveis',
    sinonimos: ['IST', 'DST', 'sífilis', 'gonorreia', 'clamídia', 'herpes genital', 'HPV', 'corrimento purulento'],
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
    sinonimos: ['urgência hipertensiva', 'emergência hipertensiva', 'pico hipertensivo', 'pressão muito alta', 'hipertensão grave'],
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
    sinonimos: ['crise de asma', 'broncoespasmo agudo', 'exacerbação de asma', 'asma grave', 'ataque de asma'],
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
    sinonimos: ['dengue clássico', 'dengue com sinais de alarme', 'febre da dengue', 'dengue hemorrágico', 'febre dengue'],
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
  { nome: 'Atenolol', classe: 'Betabloqueador β1', apresentacoes: ['25mg', '50mg', '100mg'], viaAdmin: 'oral' },
  { nome: 'Propranolol', classe: 'Betabloqueador não seletivo', apresentacoes: ['10mg', '40mg'], viaAdmin: 'oral' },
  { nome: 'Carvedilol', classe: 'Betabloqueador α/β', apresentacoes: ['3,125mg', '6,25mg', '12,5mg', '25mg'], viaAdmin: 'oral' },
  { nome: 'Furosemida', classe: 'Diurético de alça', apresentacoes: ['40mg comp', '10mg/mL inj'], viaAdmin: 'oral/IV' },
  { nome: 'Espironolactona', classe: 'Diurético poupador de potássio', apresentacoes: ['25mg', '50mg', '100mg'], viaAdmin: 'oral' },

  // Antidiabéticos
  { nome: 'Metformina', classe: 'Biguanida', apresentacoes: ['500mg', '850mg', '1000mg'], viaAdmin: 'oral' },
  { nome: 'Glibenclamida', classe: 'Sulfonilureia', apresentacoes: ['5mg'], viaAdmin: 'oral' },
  { nome: 'Gliclazida MR', classe: 'Sulfonilureia', apresentacoes: ['30mg', '60mg'], viaAdmin: 'oral' },
  { nome: 'Insulina NPH Humana', classe: 'Insulina basal', apresentacoes: ['100 UI/mL frasco', '100 UI/mL caneta'], viaAdmin: 'SC' },
  { nome: 'Insulina Regular Humana', classe: 'Insulina prandial', apresentacoes: ['100 UI/mL frasco'], viaAdmin: 'SC/IV' },

  // Hormônios tireoidianos e antitireoidianos
  { nome: 'Levotiroxina', classe: 'Hormônio tireoidiano', apresentacoes: ['25mcg', '50mcg', '75mcg', '100mcg', '125mcg'], viaAdmin: 'oral' },
  { nome: 'Metimazol', classe: 'Antitireoideo', apresentacoes: ['5mg', '10mg', '20mg'], viaAdmin: 'oral' },
  { nome: 'Propiltiouracil', classe: 'Antitireoideo', apresentacoes: ['100mg'], viaAdmin: 'oral' },

  // Broncodilatadores e respiratório
  { nome: 'Salbutamol', classe: 'Beta-2 agonista', apresentacoes: ['100mcg/dose aerossol', '2mg/5mL xarope', '5mg/mL nebulização'], viaAdmin: 'inalatório/oral' },
  { nome: 'Ipratrópio', classe: 'Anticolinérgico inalatório', apresentacoes: ['20mcg/dose aerossol', '0,25mg/mL nebulização'], viaAdmin: 'inalatório' },
  { nome: 'Beclometasona', classe: 'Corticoide inalatório', apresentacoes: ['50mcg/dose', '200mcg/dose'], viaAdmin: 'inalatório' },
  { nome: 'Budesonida', classe: 'Corticoide inalatório', apresentacoes: ['100mcg/dose', '200mcg/dose', '0,25mg/mL nebulização'], viaAdmin: 'inalatório' },
  { nome: 'Montelucaste', classe: 'Antileucotrieno', apresentacoes: ['4mg granulado', '5mg mastigável', '10mg comp'], viaAdmin: 'oral' },

  // Corticoides sistêmicos
  { nome: 'Prednisona', classe: 'Corticoide sistêmico', apresentacoes: ['5mg', '20mg'], viaAdmin: 'oral' },
  { nome: 'Prednisolona', classe: 'Corticoide sistêmico', apresentacoes: ['3mg/mL solução', '20mg comp'], viaAdmin: 'oral' },
  { nome: 'Hidrocortisona IV', classe: 'Corticoide parenteral', apresentacoes: ['100mg/2mL inj', '500mg inj'], viaAdmin: 'IV' },

  // Psicotrópicos
  { nome: 'Fluoxetina', classe: 'ISRS', apresentacoes: ['20mg cápsulas'], viaAdmin: 'oral' },
  { nome: 'Sertralina', classe: 'ISRS', apresentacoes: ['25mg', '50mg', '100mg'], viaAdmin: 'oral' },
  { nome: 'Escitalopram', classe: 'ISRS', apresentacoes: ['10mg', '20mg'], viaAdmin: 'oral' },
  { nome: 'Venlafaxina', classe: 'IRSN', apresentacoes: ['37,5mg', '75mg', '150mg'], viaAdmin: 'oral' },
  { nome: 'Amitriptilina', classe: 'Antidepressivo tricíclico', apresentacoes: ['25mg', '75mg'], viaAdmin: 'oral' },
  { nome: 'Clonazepam', classe: 'Benzodiazepínico', apresentacoes: ['0,5mg', '1mg', '2mg', '2,5mg/mL gotas'], viaAdmin: 'oral' },
  { nome: 'Diazepam', classe: 'Benzodiazepínico', apresentacoes: ['5mg', '10mg', '5mg/mL inj'], viaAdmin: 'oral/IV/retal' },

  // Antiepilépticos
  { nome: 'Carbamazepina', classe: 'Antiepiléptico (bloqueador canal Na+)', apresentacoes: ['200mg comp', '400mg comp', '2% suspensão'], viaAdmin: 'oral' },
  { nome: 'Valproato de Sódio', classe: 'Antiepiléptico (múltiplos mecanismos)', apresentacoes: ['250mg', '500mg comp', '50mg/mL xarope'], viaAdmin: 'oral' },
  { nome: 'Levetiracetam', classe: 'Antiepiléptico (SV2A)', apresentacoes: ['250mg', '500mg', '1000mg', '100mg/mL solução oral'], viaAdmin: 'oral/IV' },
  { nome: 'Fenitoína', classe: 'Antiepiléptico (bloqueador canal Na+)', apresentacoes: ['100mg comp', '50mg/mL inj'], viaAdmin: 'oral/IV' },

  // Analgésicos e anti-inflamatórios
  { nome: 'Paracetamol', classe: 'Analgésico/Antipirético', apresentacoes: ['500mg comp', '200mg/mL gotas', '750mg comp'], viaAdmin: 'oral' },
  { nome: 'Dipirona', classe: 'Analgésico/Antipirético', apresentacoes: ['500mg comp', '500mg/mL gotas', '500mg/mL inj'], viaAdmin: 'oral/IV/IM' },
  { nome: 'Ibuprofeno', classe: 'AINE', apresentacoes: ['200mg', '400mg', '600mg', '50mg/mL suspensão'], viaAdmin: 'oral' },
  { nome: 'Naproxeno', classe: 'AINE', apresentacoes: ['250mg', '500mg'], viaAdmin: 'oral' },
  { nome: 'Indometacina', classe: 'AINE', apresentacoes: ['25mg', '50mg'], viaAdmin: 'oral' },
  { nome: 'Ciclobenzaprina', classe: 'Relaxante muscular central', apresentacoes: ['5mg', '10mg'], viaAdmin: 'oral' },
  { nome: 'Sumatriptano', classe: 'Triptano', apresentacoes: ['50mg', '100mg'], viaAdmin: 'oral' },
  { nome: 'Colchicina', classe: 'Antigotoso', apresentacoes: ['0,5mg', '1mg'], viaAdmin: 'oral' },
  { nome: 'Alopurinol', classe: 'Inibidor de xantina oxidase', apresentacoes: ['100mg', '300mg'], viaAdmin: 'oral' },

  // Cardiovascular / anticoagulação
  { nome: 'Ácido Acetilsalicílico', classe: 'Antiagregante plaquetário / AINE', apresentacoes: ['100mg comp', '500mg comp'], viaAdmin: 'oral' },
  { nome: 'Enoxaparina', classe: 'Heparina de baixo peso molecular', apresentacoes: ['20mg/0,2mL', '40mg/0,4mL', '60mg/0,6mL', '80mg/0,8mL SC'], viaAdmin: 'SC' },

  // Antibióticos
  { nome: 'Amoxicilina', classe: 'Penicilina aminossemissintética', apresentacoes: ['250mg/5mL suspensão', '500mg caps', '875mg comp'], viaAdmin: 'oral' },
  { nome: 'Amoxicilina + Clavulanato', classe: 'Penicilina + inibidor de beta-lactamase', apresentacoes: ['400mg+57mg/5mL', '875mg+125mg'], viaAdmin: 'oral' },
  { nome: 'Penicilina Benzatina', classe: 'Penicilina de depósito', apresentacoes: ['600.000 UI', '1.200.000 UI', '2.400.000 UI'], viaAdmin: 'IM' },
  { nome: 'Azitromicina', classe: 'Macrolídeo', apresentacoes: ['500mg comp', '200mg/5mL suspensão'], viaAdmin: 'oral' },
  { nome: 'Claritromicina', classe: 'Macrolídeo', apresentacoes: ['250mg', '500mg'], viaAdmin: 'oral' },
  { nome: 'Cefalexina', classe: 'Cefalosporina 1ª geração', apresentacoes: ['250mg/5mL suspensão', '500mg caps'], viaAdmin: 'oral' },
  { nome: 'Ceftriaxona', classe: 'Cefalosporina 3ª geração', apresentacoes: ['500mg inj', '1g inj'], viaAdmin: 'IM/IV' },
  { nome: 'Ciprofloxacino', classe: 'Fluoroquinolona', apresentacoes: ['250mg', '500mg'], viaAdmin: 'oral' },
  { nome: 'Nitrofurantoína', classe: 'Nitrofurano', apresentacoes: ['100mg caps'], viaAdmin: 'oral' },
  { nome: 'Sulfametoxazol + Trimetoprima', classe: 'Sulfonamida', apresentacoes: ['400mg+80mg', '800mg+160mg', '200mg+40mg/5mL'], viaAdmin: 'oral' },
  { nome: 'Metronidazol', classe: 'Nitroimidazol', apresentacoes: ['250mg', '400mg', '500mg', '100mg/mL gel vaginal'], viaAdmin: 'oral/vaginal/IV' },
  { nome: 'Doxiciclina', classe: 'Tetraciclina', apresentacoes: ['100mg'], viaAdmin: 'oral' },
  { nome: 'Clindamicina', classe: 'Lincosamida', apresentacoes: ['150mg', '300mg caps', '600mg/4mL inj'], viaAdmin: 'oral/IV' },

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

  // Antihistamínicos
  { nome: 'Cetirizina', classe: 'Anti-histamínico 2ª geração', apresentacoes: ['10mg comp', '1mg/mL xarope'], viaAdmin: 'oral' },
  { nome: 'Loratadina', classe: 'Anti-histamínico 2ª geração', apresentacoes: ['10mg comp', '1mg/mL xarope'], viaAdmin: 'oral' },
  { nome: 'Desloratadina', classe: 'Anti-histamínico 2ª geração', apresentacoes: ['5mg comp', '0,5mg/mL xarope'], viaAdmin: 'oral' },
  { nome: 'Dexclorfeniramina', classe: 'Anti-histamínico 1ª geração', apresentacoes: ['2mg comp', '0,4mg/mL xarope'], viaAdmin: 'oral' },

  // Corticoide nasal
  { nome: 'Mometasona Nasal', classe: 'Corticoide tópico nasal', apresentacoes: ['50mcg/dose spray nasal'], viaAdmin: 'nasal' },
  { nome: 'Budesonida Nasal', classe: 'Corticoide tópico nasal', apresentacoes: ['32mcg/dose spray nasal'], viaAdmin: 'nasal' },

  // Emergência — anafilaxia
  { nome: 'Adrenalina', classe: 'Catecolamina / vasopressor', apresentacoes: ['1mg/mL amp (1:1000)', '1mg/mL caneta autoinjetora'], viaAdmin: 'IM/IV/SC' },

  // Antiemético / procinético
  { nome: 'Metoclopramida', classe: 'Procinético / antiemético', apresentacoes: ['10mg comp', '4mg/mL gotas', '5mg/mL inj'], viaAdmin: 'oral/IV/IM' },
  { nome: 'Ondansetrona', classe: 'Antagonista 5-HT3 / antiemético', apresentacoes: ['4mg', '8mg comp', '2mg/mL inj'], viaAdmin: 'oral/IV' },
  { nome: 'Domperidona', classe: 'Procinético', apresentacoes: ['10mg comp', '1mg/mL suspensão'], viaAdmin: 'oral' },

  // Vestibular
  { nome: 'Betaistina', classe: 'Análogo histamina (vestibular)', apresentacoes: ['8mg', '16mg', '24mg comp'], viaAdmin: 'oral' },
  { nome: 'Dimenidrinato', classe: 'Anti-histamínico / antiemético vestibular', apresentacoes: ['50mg comp', '25mg/5mL xarope'], viaAdmin: 'oral' },

  // Colírios
  { nome: 'Tobramicina Colírio', classe: 'Antibiótico tópico ocular', apresentacoes: ['0,3% colírio'], viaAdmin: 'oftálmico' },
  { nome: 'Soro Fisiológico 0,9%', classe: 'Solução salina', apresentacoes: ['frasco 500mL', 'ampola 10mL', 'sachê lavagem ocular'], viaAdmin: 'tópico/IV/oral' },

  // Reidratação e suplementação
  { nome: 'Soro de Reidratação Oral', classe: 'Eletrólitos', apresentacoes: ['sachê 27,9g'], viaAdmin: 'oral' },
  { nome: 'Zinco', classe: 'Micronutriente', apresentacoes: ['10mg/5mL solução', '20mg comp'], viaAdmin: 'oral' },
  { nome: 'Sulfato Ferroso', classe: 'Reposição de ferro', apresentacoes: ['40mg/mL gotas', '40mg Fe elemental comp'], viaAdmin: 'oral' },
  { nome: 'Ácido Fólico', classe: 'Vitamina B9', apresentacoes: ['0,4mg', '5mg comp'], viaAdmin: 'oral' },

  // Laxantes
  { nome: 'Macrogol', classe: 'Laxante osmótico', apresentacoes: ['10g sachê', '13,8g sachê'], viaAdmin: 'oral' },
  { nome: 'Lactulose', classe: 'Laxante osmótico', apresentacoes: ['3,3g/5mL xarope'], viaAdmin: 'oral' },
  { nome: 'Bisacodil', classe: 'Laxante estimulante', apresentacoes: ['5mg comp', '10mg supositório'], viaAdmin: 'oral/retal' },

  // Espasmolítico
  { nome: 'Hioscina Butilbrometo', classe: 'Espasmolítico anticolinérgico', apresentacoes: ['10mg comp', '20mg/mL inj', '10mg supositório'], viaAdmin: 'oral/IV/IM' },

  // Urologico
  { nome: 'Tansulosina', classe: 'Alfa-1 bloqueador', apresentacoes: ['0,4mg comp liberação modificada'], viaAdmin: 'oral' },
  { nome: 'Finasterida', classe: 'Inibidor da 5-alfa-redutase', apresentacoes: ['5mg comp'], viaAdmin: 'oral' },

  // Corticoides tópicos dermatologia
  { nome: 'Hidrocortisona', classe: 'Corticoide tópico baixa potência', apresentacoes: ['1% creme/pomada'], viaAdmin: 'tópico' },
  { nome: 'Betametasona', classe: 'Corticoide tópico alta potência', apresentacoes: ['0,05% creme/pomada'], viaAdmin: 'tópico' },
  { nome: 'Mupirocina', classe: 'Antibiótico tópico', apresentacoes: ['2% pomada'], viaAdmin: 'tópico' },

  // Gastrointestinal
  { nome: 'Omeprazol', classe: 'IBP', apresentacoes: ['10mg', '20mg', '40mg'], viaAdmin: 'oral' },
  { nome: 'Pantoprazol', classe: 'IBP', apresentacoes: ['20mg', '40mg comp', '40mg inj'], viaAdmin: 'oral/IV' },
  { nome: 'Loperamida', classe: 'Antidiarreico opioide', apresentacoes: ['2mg comp', '1mg/5mL suspensão'], viaAdmin: 'oral' },

  // ── Emergência UPA ────────────────────────────────────────────
  { nome: 'Alteplase', classe: 'Trombolítico (ativador do plasminogênio tecidual)', apresentacoes: ['50mg inj', '100mg inj'], viaAdmin: 'IV' },
  { nome: 'Adenosina', classe: 'Antiarrítmico (bloqueio AV transitório)', apresentacoes: ['6mg/2mL inj'], viaAdmin: 'IV bolus' },
  { nome: 'Amiodarona', classe: 'Antiarrítmico classe III', apresentacoes: ['200mg comp', '150mg/3mL inj'], viaAdmin: 'oral/IV' },
  { nome: 'Atropina', classe: 'Anticolinérgico/vagolítico', apresentacoes: ['0,5mg/mL inj', '1mg/mL inj'], viaAdmin: 'IV/IM' },
  { nome: 'Bicarbonato de Sódio 8,4%', classe: 'Alcalinizante', apresentacoes: ['10mEq/10mL amp', '250mL frasco'], viaAdmin: 'IV' },
  { nome: 'Carvão Ativado', classe: 'Adsorvente gastrointestinal', apresentacoes: ['50g pó para suspensão'], viaAdmin: 'oral' },
  { nome: 'Clopidogrel', classe: 'Antiagregante plaquetário (inibidor P2Y12)', apresentacoes: ['75mg comp', '300mg comp'], viaAdmin: 'oral' },
  { nome: 'Dexametasona IV', classe: 'Corticoide parenteral alta potência', apresentacoes: ['4mg/mL inj', '10mg/mL inj'], viaAdmin: 'IV/IM' },
  { nome: 'Fenitoína IV', classe: 'Antiepiléptico (bloqueador canal Na+) parenteral', apresentacoes: ['50mg/mL inj 5mL'], viaAdmin: 'IV lento' },
  { nome: 'Fenobarbital IV', classe: 'Antiepiléptico/barbitúrico parenteral', apresentacoes: ['100mg/mL inj'], viaAdmin: 'IV lento' },
  { nome: 'Fentanil IV', classe: 'Opioide potente (analgesia/sedação)', apresentacoes: ['50mcg/mL inj 10mL'], viaAdmin: 'IV' },
  { nome: 'Flumazenil', classe: 'Antagonista benzodiazepínico', apresentacoes: ['0,1mg/mL inj 5mL'], viaAdmin: 'IV' },
  { nome: 'Glicose 50%', classe: 'Solução glicosada hipertônica', apresentacoes: ['10mL amp', '25mL amp'], viaAdmin: 'IV' },
  { nome: 'Glucagon', classe: 'Hormônio hiperglicemiante', apresentacoes: ['1mg inj (kit)'], viaAdmin: 'IM/SC/IV' },
  { nome: 'Heparina Não Fracionada', classe: 'Anticoagulante parenteral', apresentacoes: ['5000 UI/mL inj', '25000 UI/5mL inj'], viaAdmin: 'IV/SC' },
  { nome: 'Labetalol IV', classe: 'Betabloqueador α/β parenteral', apresentacoes: ['5mg/mL inj 20mL'], viaAdmin: 'IV' },
  { nome: 'Manitol IV', classe: 'Diurético osmótico', apresentacoes: ['20% solução 250mL'], viaAdmin: 'IV' },
  { nome: 'Midazolam IV', classe: 'Benzodiazepínico parenteral', apresentacoes: ['5mg/mL inj', '15mg/3mL inj'], viaAdmin: 'IV/IM/IN' },
  { nome: 'Morfina IV', classe: 'Opioide parenteral', apresentacoes: ['10mg/mL inj', '2mg/mL inj'], viaAdmin: 'IV/IM/SC' },
  { nome: 'N-acetilcisteína IV', classe: 'Antídoto paracetamol / mucolítico parenteral', apresentacoes: ['200mg/mL inj 10mL'], viaAdmin: 'IV' },
  { nome: 'Nimodipino', classe: 'Bloqueador de canal de cálcio (vasoespasmo cerebral)', apresentacoes: ['30mg comp', '0,2mg/mL solução IV'], viaAdmin: 'oral/IV' },
  { nome: 'Nitroglicerina', classe: 'Nitrato (vasodilatador coronariano/venoso)', apresentacoes: ['0,5mg comp sublingual', '5mg/mL inj'], viaAdmin: 'SL/IV' },
  { nome: 'Noradrenalina', classe: 'Vasopressor catecolaminérgico', apresentacoes: ['4mg/4mL inj'], viaAdmin: 'IV infusão contínua' },
  { nome: 'Pralidoxima', classe: 'Reativador de colinesterase (antídoto organofosforado)', apresentacoes: ['1g inj'], viaAdmin: 'IV lento' },
  { nome: 'Rivaroxabana', classe: 'Anticoagulante oral (inibidor Xa)', apresentacoes: ['10mg', '15mg', '20mg comp'], viaAdmin: 'oral' },
  { nome: 'Ticagrelor', classe: 'Antiagregante plaquetário (inibidor P2Y12 reversível)', apresentacoes: ['90mg', '180mg comp'], viaAdmin: 'oral' },
  { nome: 'Ácido Tranexâmico', classe: 'Antifibrinolítico', apresentacoes: ['500mg/5mL inj', '500mg comp'], viaAdmin: 'IV/oral' },

  // Lipídios
  { nome: 'Sinvastatina', classe: 'Estatina moderada intensidade', apresentacoes: ['10mg', '20mg', '40mg'], viaAdmin: 'oral' },
  { nome: 'Atorvastatina', classe: 'Estatina alta intensidade', apresentacoes: ['10mg', '20mg', '40mg', '80mg'], viaAdmin: 'oral' },
];

// ── RELAÇÕES DIAGNÓSTICO → MEDICAMENTO (com posologia) ────────
const relacoes = [
  // HAS
  {
    diagnostico: 'Hipertensão Arterial Sistêmica',
    medicamentos: [
      { nome: 'Losartana',          dose: '25-100mg VO 1x/dia',               linha: '1ª' },
      { nome: 'Enalapril',          dose: '5-40mg VO 1-2x/dia',               linha: '1ª' },
      { nome: 'Anlodipino',         dose: '5-10mg VO 1x/dia',                  linha: '1ª' },
      { nome: 'Hidroclorotiazida',  dose: '12,5-25mg VO 1x/dia (manhã)',       linha: '1ª' },
      { nome: 'Atenolol',           dose: '25-100mg VO 1x/dia',               linha: '2ª', obs: 'quando betabloqueador indicado (IC, pós-IAM, taquiarritmia)' },
      { nome: 'Carvedilol',         dose: '6,25-25mg VO 2x/dia',              linha: '2ª', obs: 'preferir em HAS + IC com FEVE reduzida' },
    ],
  },
  // Crise Hipertensiva (urgência)
  {
    diagnostico: 'Crise Hipertensiva',
    medicamentos: [
      { nome: 'Captopril',          dose: '25mg SL ou VO, repetir em 30-60 min se PA mantida', linha: '1ª', obs: 'urgência hipertensiva' },
      { nome: 'Anlodipino',         dose: '5-10mg VO — para manutenção após estabilização',    linha: 'adjuvante' },
      { nome: 'Furosemida',         dose: '40mg VO ou IV — se edema agudo de pulmão associado', linha: 'adjuvante' },
    ],
  },
  // DM2
  {
    diagnostico: 'Diabetes Mellitus tipo 2',
    medicamentos: [
      { nome: 'Metformina',          dose: 'Iniciar 500mg às refeições; titular até 850mg 8/8h ou 1000mg 12/12h (máx 2550mg/dia)', linha: '1ª' },
      { nome: 'Gliclazida MR',       dose: '30-120mg VO 1x/dia (café)', linha: '2ª', obs: 'menor risco hipoglicemia que glibenclamida' },
      { nome: 'Glibenclamida',       dose: '2,5-5mg AC refeição principal; máx 20mg/dia', linha: '2ª', obs: 'menor custo; maior risco hipoglicemia' },
      { nome: 'Insulina NPH Humana', dose: '0,1-0,2 UI/kg SC ao deitar; titular 2 UI a cada 3 dias pela glicemia jejum', linha: '3ª', obs: 'basal em DM2 descompensado' },
      { nome: 'Insulina Regular Humana', dose: 'Correção: 1 UI por 30-50 mg/dL acima de 180 mg/dL SC AC refeições', linha: '3ª' },
    ],
  },
  // Hipotireoidismo
  {
    diagnostico: 'Hipotireoidismo',
    medicamentos: [
      { nome: 'Levotiroxina', dose: 'Adulto hígido: 1,6-1,8 mcg/kg/dia VO em jejum. Iniciar 50-100mcg; idoso/cardiopata: iniciar 12,5-25mcg. Titular a cada 4-6 semanas pelo TSH', linha: '1ª' },
    ],
  },
  // Hipertireoidismo
  {
    diagnostico: 'Hipertireoidismo',
    medicamentos: [
      { nome: 'Metimazol',    dose: '10-40mg/dia VO em 1-2 tomadas (preferir Graves)', linha: '1ª' },
      { nome: 'Propiltiouracil', dose: '100-600mg/dia VO em 3 tomadas', linha: '1ª', obs: 'preferir em gestação 1T e tempestade tireoidiana' },
      { nome: 'Propranolol',  dose: '20-80mg VO 8/8h para controle de sintomas adrenérgicos', linha: 'adjuvante' },
    ],
  },
  // Dislipidemia
  {
    diagnostico: 'Dislipidemia',
    medicamentos: [
      { nome: 'Sinvastatina',   dose: '10-40mg VO 1x/dia (noite)', linha: '1ª', obs: 'risco CV baixo-moderado' },
      { nome: 'Atorvastatina',  dose: '10-80mg VO 1x/dia (qualquer hora)', linha: '1ª', obs: 'preferir em risco CV alto; 40-80mg = alta intensidade' },
    ],
  },
  // Asma (controle)
  {
    diagnostico: 'Asma',
    medicamentos: [
      { nome: 'Salbutamol',     dose: '2-4 jatos (200-400mcg) SOS para resgate', linha: 'resgate' },
      { nome: 'Beclometasona',  dose: '100-200mcg 2x/dia inalatório (leve persistente); 200-400mcg 2x/dia (moderada)', linha: '1ª' },
      { nome: 'Budesonida',     dose: '100-200mcg 2x/dia inalatório', linha: '1ª', obs: 'alternativa à beclometasona' },
      { nome: 'Ipratrópio',     dose: '2-4 jatos (40-80mcg) 6/6h — adicionar se asma moderada-grave', linha: '2ª' },
      { nome: 'Montelucaste',   dose: '10mg VO 1x/dia (noite)', linha: '2ª', obs: 'adjuvante ao CI ou rinite + asma' },
      { nome: 'Prednisona',     dose: '40-60mg VO 1x/dia por 5-7 dias nas exacerbações', linha: 'exacerbação' },
    ],
  },
  // Crise Asmática
  {
    diagnostico: 'Crise Asmática',
    medicamentos: [
      { nome: 'Salbutamol',     dose: '2,5mg nebulização ou 4-8 jatos com espaçador a cada 20min × 3 ciclos', linha: '1ª' },
      { nome: 'Ipratrópio',     dose: '0,5mg nebulização junto ao salbutamol (moderada-grave)', linha: '1ª', obs: 'somar ao broncodilatador' },
      { nome: 'Prednisona',     dose: '40-60mg VO 1x/dia por 5-7 dias', linha: '1ª' },
      { nome: 'Prednisolona',   dose: '1-2mg/kg/dia VO (criança; máx 40mg/dia) por 3-5 dias', linha: '1ª', obs: 'pediátrico' },
    ],
  },
  // DPOC
  {
    diagnostico: 'DPOC',
    medicamentos: [
      { nome: 'Salbutamol',   dose: '100mcg 2-4 jatos SOS (resgate)', linha: 'resgate' },
      { nome: 'Ipratrópio',   dose: '20-40mcg 4-6x/dia (manutenção)', linha: '1ª' },
      { nome: 'Prednisona',   dose: '40mg/dia × 5 dias (exacerbação aguda)', linha: 'exacerbação' },
      { nome: 'Amoxicilina',  dose: '500mg VO 8/8h × 5-7 dias (exacerbação com expectoração purulenta)', linha: 'exacerbação' },
    ],
  },
  // Depressão
  {
    diagnostico: 'Depressão',
    medicamentos: [
      { nome: 'Sertralina',     dose: 'Iniciar 50mg/dia; titular até 100-200mg/dia', linha: '1ª', obs: 'preferir em cardiopatia e idoso' },
      { nome: 'Fluoxetina',     dose: 'Iniciar 20mg/dia (manhã); titular até 60mg/dia', linha: '1ª' },
      { nome: 'Escitalopram',   dose: 'Iniciar 10mg/dia; máx 20mg/dia', linha: '1ª', obs: 'melhor tolerabilidade; útil em idosos' },
      { nome: 'Amitriptilina',  dose: 'Iniciar 25mg à noite; máx 150mg/dia', linha: '2ª', obs: 'dor crônica, insônia associada; cuidado em idosos e cardiopatas' },
    ],
  },
  // TAG
  {
    diagnostico: 'Transtorno de Ansiedade Generalizada',
    medicamentos: [
      { nome: 'Sertralina',   dose: 'Iniciar 25-50mg/dia; titular até 150-200mg/dia', linha: '1ª' },
      { nome: 'Escitalopram', dose: 'Iniciar 10mg/dia; máx 20mg/dia', linha: '1ª' },
      { nome: 'Clonazepam',   dose: '0,25-0,5mg VO à noite (curto prazo, máx 4 semanas)', linha: 'ponte', obs: 'apenas enquanto ISRS faz efeito; evitar uso crônico' },
    ],
  },
  // ICC
  {
    diagnostico: 'Insuficiência Cardíaca Crônica',
    medicamentos: [
      { nome: 'Enalapril',        dose: 'Iniciar 2,5mg 12/12h; titular até 10-20mg 12/12h', linha: '1ª' },
      { nome: 'Carvedilol',       dose: 'Iniciar 3,125mg 12/12h após estabilização; titular até 25mg 12/12h', linha: '1ª' },
      { nome: 'Furosemida',       dose: '40-80mg VO/IV 1x/dia (ajustar pelo edema e creatinina)', linha: '1ª', obs: 'alívio de sintomas congestivos' },
      { nome: 'Espironolactona',  dose: '25-50mg VO 1x/dia', linha: '1ª', obs: 'FEVE ≤ 35%; monitorar K+' },
      { nome: 'Ácido Acetilsalicílico', dose: '100mg VO 1x/dia', linha: 'adjuvante', obs: 'se etiologia isquêmica' },
    ],
  },
  // FA
  {
    diagnostico: 'Fibrilação Atrial',
    medicamentos: [
      { nome: 'Atenolol',    dose: '25-100mg VO 1x/dia (controle de frequência)', linha: '1ª' },
      { nome: 'Carvedilol',  dose: '6,25-25mg VO 2x/dia (controle de frequência + IC)', linha: '1ª' },
      { nome: 'Ácido Acetilsalicílico', dose: '100mg/dia (CHA₂DS₂-VASc = 1 masculino)', linha: 'antitrombótico', obs: 'avaliar risco-benefício' },
      { nome: 'Enoxaparina', dose: '1mg/kg SC 12/12h (anticoagulação inicial ou ponte)', linha: 'anticoagulação' },
      { nome: 'Rivaroxabana', dose: '20mg VO 1x/dia com a refeição (CHA₂DS₂-VASc ≥ 2 masculino / ≥ 3 feminino)', linha: 'anticoagulação oral', obs: 'NOAC de escolha em FA não valvular — dose ajustar para 15mg se ClCr 15-50 mL/min' },
    ],
  },
  // Anemia ferropriva
  {
    diagnostico: 'Anemia Ferropriva',
    medicamentos: [
      { nome: 'Sulfato Ferroso', dose: '3-5mg/kg/dia de ferro elementar VO longe das refeições — adulto: 40-60mg Fe elem 2-3x/dia; criança: 3-5mg Fe elem/kg/dia', linha: '1ª' },
      { nome: 'Ácido Fólico',    dose: '5mg/dia VO (se deficiência associada ou gestante)', linha: 'adjuvante' },
    ],
  },
  // Gota aguda
  {
    diagnostico: 'Gota',
    medicamentos: [
      { nome: 'Colchicina',   dose: '1mg VO assim que possível, depois 0,5mg em 1h (total 1,5mg). Depois 0,5mg 8/8h por 1-2 dias', linha: '1ª', obs: 'iniciar nas primeiras 24-36h do ataque' },
      { nome: 'Naproxeno',    dose: '500mg VO 12/12h × 5-7 dias', linha: '1ª', obs: 'alternativa à colchicina; evitar em DRC' },
      { nome: 'Indometacina', dose: '50mg VO 8/8h × 2-3 dias, depois 25mg 8/8h × 4-5 dias', linha: '1ª', obs: 'AINE tradicional para gota; evitar em idosos e DRC' },
      { nome: 'Prednisona',   dose: '30-40mg/dia VO × 3-5 dias (reduzir em 5-7 dias)', linha: '2ª', obs: 'quando AINE e colchicina contraindicados' },
      { nome: 'Alopurinol',   dose: 'Iniciar 100mg/dia 4 semanas após crise; titular até urato < 6mg/dL (máx 800mg/dia)', linha: '1ª', obs: 'profilaxia — não iniciar durante crise aguda' },
    ],
  },
  // HPB
  {
    diagnostico: 'Hiperplasia Prostática Benigna',
    medicamentos: [
      { nome: 'Tansulosina',  dose: '0,4mg VO 1x/dia após refeição (30 min)', linha: '1ª', obs: 'alívio de sintomas obstrutivos; cuidado em hipotensão postural' },
      { nome: 'Finasterida',  dose: '5mg VO 1x/dia (resultado após 3-6 meses)', linha: '2ª', obs: 'reduz volume prostático; útil em próstata > 40g' },
    ],
  },
  // Epilepsia
  {
    diagnostico: 'Epilepsia',
    medicamentos: [
      { nome: 'Carbamazepina',    dose: 'Iniciar 100-200mg/dia; titular até 400-800mg/dia em 2-3 tomadas', linha: '1ª', obs: 'crises focais e tônico-clônicas generalizadas' },
      { nome: 'Valproato de Sódio', dose: 'Iniciar 250mg 2x/dia; titular até 500-1500mg/dia', linha: '1ª', obs: 'crises generalizadas, ausência, mioclônica; evitar em mulheres em idade fértil' },
      { nome: 'Levetiracetam',    dose: 'Iniciar 250mg 12/12h; titular até 500-1500mg 12/12h', linha: '1ª', obs: 'perfil de interação favorável; útil em gestantes' },
      { nome: 'Diazepam',         dose: 'Status epilepticus: 0,1-0,3mg/kg IV (adulto: 5-10mg IV lento); pode repetir 1x', linha: 'emergência' },
      { nome: 'Clonazepam',       dose: '0,5-2mg VO à noite (adjuvante ou crises mioclônicas)', linha: 'adjuvante' },
    ],
  },
  // ITU baixa
  {
    diagnostico: 'Infecção do Trato Urinário Baixo',
    medicamentos: [
      { nome: 'Nitrofurantoína',            dose: '100mg VO 6/6h × 5-7 dias', linha: '1ª', obs: 'não usar se ClCr < 30 mL/min' },
      { nome: 'Sulfametoxazol + Trimetoprima', dose: '800/160mg VO 12/12h × 3 dias', linha: '1ª', obs: 'usar se resistência local < 20%' },
      { nome: 'Cefalexina',                 dose: '500mg VO 6/6h × 7 dias', linha: '1ª', obs: 'segura na gestação (todos os trimestres)' },
      { nome: 'Ciprofloxacino',             dose: '250mg VO 12/12h × 3 dias', linha: 'alternativa', obs: 'reservar — crescente resistência' },
    ],
  },
  // Pielonefrite
  {
    diagnostico: 'Pielonefrite Aguda',
    medicamentos: [
      { nome: 'Ciprofloxacino',  dose: '500mg VO 12/12h × 10-14 dias (ambulatorial)', linha: '1ª' },
      { nome: 'Cefalexina',      dose: '500mg VO 6/6h × 14 dias (gestante)', linha: '1ª', obs: 'gestante — internar se grave' },
      { nome: 'Ceftriaxona',     dose: '1-2g IV/IM 1x/dia (internação ou uso transitório)', linha: '1ª', obs: 'casos graves, vômitos, gestante grave' },
      { nome: 'Amoxicilina + Clavulanato', dose: '875/125mg VO 12/12h × 10-14 dias', linha: 'alternativa' },
    ],
  },
  // Cólica Renal
  {
    diagnostico: 'Cólica Renal',
    medicamentos: [
      { nome: 'Dipirona',           dose: '1g IV/IM ou 1g VO 6/6h', linha: '1ª', obs: 'analgesia de primeira linha' },
      { nome: 'Ibuprofeno',         dose: '600mg VO 8/8h × 3-5 dias', linha: '1ª', obs: 'AINE preferencial se função renal normal' },
      { nome: 'Hioscina Butilbrometo', dose: '20mg IV ou 10mg VO 8/8h', linha: 'adjuvante', obs: 'espasmos' },
      { nome: 'Tansulosina',        dose: '0,4mg VO 1x/dia por até 4 semanas', linha: 'adjuvante', obs: 'facilita expulsão de cálculos < 10mm' },
    ],
  },
  // Faringoamigdalite
  {
    diagnostico: 'Faringoamigdalite Aguda',
    medicamentos: [
      { nome: 'Penicilina Benzatina', dose: 'Adulto (> 27kg): 1.200.000UI IM dose única. Criança (< 27kg): 600.000UI IM dose única', linha: '1ª', obs: 'estreptocócica — Centor ≥ 3' },
      { nome: 'Amoxicilina',          dose: '500mg VO 8/8h × 10 dias', linha: '1ª', obs: 'alternativa oral à penicilina benzatina' },
      { nome: 'Azitromicina',         dose: '500mg VO 1x/dia × 5 dias', linha: '2ª', obs: 'alérgico a penicilina' },
      { nome: 'Paracetamol',          dose: '500-750mg VO 6/6h (analgesia sintomática)', linha: 'sintomático' },
    ],
  },
  // IRA alta
  {
    diagnostico: 'Infecção Respiratória Aguda Alta',
    medicamentos: [
      { nome: 'Paracetamol',   dose: '500-750mg VO 6/6h SOS', linha: 'sintomático' },
      { nome: 'Ibuprofeno',    dose: '400mg VO 8/8h SOS (adulto)', linha: 'sintomático' },
      { nome: 'Dipirona',      dose: '500mg-1g VO/IV 6/6h SOS', linha: 'sintomático' },
    ],
  },
  // Sinusite
  {
    diagnostico: 'Sinusite Aguda',
    medicamentos: [
      { nome: 'Amoxicilina',             dose: '500mg VO 8/8h ou 875mg 12/12h × 10-14 dias', linha: '1ª' },
      { nome: 'Amoxicilina + Clavulanato', dose: '875/125mg VO 12/12h × 10-14 dias', linha: '2ª', obs: 'falha à amoxicilina ou sinusite recorrente' },
    ],
  },
  // OMA
  {
    diagnostico: 'Otite Média Aguda',
    medicamentos: [
      { nome: 'Amoxicilina',   dose: 'Adulto: 500mg 8/8h × 7 dias. Criança: 40-90mg/kg/dia 8/8h × 10 dias', linha: '1ª' },
      { nome: 'Paracetamol',   dose: 'Adulto: 500-1000mg 6/6h. Criança: 10-15mg/kg 6/6h', linha: 'analgesia' },
      { nome: 'Ibuprofeno',    dose: 'Adulto: 400mg 8/8h. Criança: 5-10mg/kg 8/8h', linha: 'analgesia' },
    ],
  },
  // Diarreia aguda adulto
  {
    diagnostico: 'Diarreia Aguda',
    medicamentos: [
      { nome: 'Soro de Reidratação Oral', dose: '200-400mL após cada evacuação líquida', linha: '1ª' },
      { nome: 'Metronidazol',             dose: '400-500mg VO 8/8h × 7 dias', linha: '2ª', obs: 'parasitose (giardíase, amebíase) ou C. difficile leve' },
      { nome: 'Loperamida',               dose: '4mg VO após primeira evacuação; 2mg após cada evacuação (máx 16mg/dia)', linha: 'sintomático', obs: 'não usar em diarreia com sangue ou febre' },
    ],
  },
  // DRGE
  {
    diagnostico: 'Doença do Refluxo Gastroesofágico',
    medicamentos: [
      { nome: 'Omeprazol',     dose: '20mg VO 30 min AC café, 1x/dia × 4-8 semanas; esofagite grave: 40mg', linha: '1ª' },
      { nome: 'Pantoprazol',   dose: '20-40mg VO 30 min AC café, 1x/dia × 4-8 semanas', linha: '1ª', obs: 'alternativa ao omeprazol' },
      { nome: 'Domperidona',   dose: '10mg VO 15-30 min AC refeições 3x/dia', linha: 'adjuvante', obs: 'se dismotilidade associada' },
    ],
  },
  // Úlcera péptica / H. pylori
  {
    diagnostico: 'Úlcera Péptica',
    medicamentos: [
      { nome: 'Omeprazol',       dose: '20-40mg VO 2x/dia × 14 dias (terapia tripla) ou 20mg 1x/dia × 4-8 sem (manutenção)', linha: '1ª' },
      { nome: 'Amoxicilina',     dose: '1g VO 12/12h × 14 dias (erradicação H. pylori)', linha: '1ª', obs: 'associar a omeprazol + claritromicina' },
      { nome: 'Claritromicina',  dose: '500mg VO 12/12h × 14 dias (terapia tripla H. pylori)', linha: '1ª' },
      { nome: 'Metronidazol',    dose: '400-500mg VO 8/8h × 14 dias', linha: '2ª', obs: 'substitui claritromicina em quadrante terapia' },
      { nome: 'Pantoprazol',     dose: '40mg IV/VO (sangramento ativo — dose de ataque)', linha: 'urgência' },
    ],
  },
  // Cólica biliar
  {
    diagnostico: 'Cólica Biliar',
    medicamentos: [
      { nome: 'Dipirona',           dose: '1g VO ou IV 6/6h (analgesia)', linha: '1ª' },
      { nome: 'Ibuprofeno',         dose: '400-600mg VO 8/8h (anti-inflamatório)', linha: '1ª' },
      { nome: 'Hioscina Butilbrometo', dose: '10mg VO 8/8h ou 20mg IV (espasmos)', linha: 'adjuvante' },
    ],
  },
  // Cefaleia
  {
    diagnostico: 'Cefaleia',
    medicamentos: [
      { nome: 'Paracetamol',    dose: '1g VO SOS (cefaleia tensional leve)', linha: '1ª', obs: 'cefaleia tensional' },
      { nome: 'Ibuprofeno',     dose: '400-600mg VO SOS', linha: '1ª' },
      { nome: 'Sumatriptano',   dose: '50-100mg VO no início da crise; pode repetir em 2h (máx 200mg/dia)', linha: '1ª', obs: 'enxaqueca moderada-grave' },
      { nome: 'Metoclopramida', dose: '10mg VO/IV junto ao AINE (cefaleia com náusea)', linha: 'adjuvante' },
      { nome: 'Amitriptilina',  dose: '25-75mg à noite (profilaxia enxaqueca crônica)', linha: 'profilaxia' },
    ],
  },
  // Lombalgia
  {
    diagnostico: 'Lombalgia',
    medicamentos: [
      { nome: 'Ibuprofeno',      dose: '400-600mg VO 8/8h × 5-7 dias', linha: '1ª' },
      { nome: 'Naproxeno',       dose: '500mg VO 12/12h × 5-7 dias', linha: '1ª', obs: 'alternativa ao ibuprofeno' },
      { nome: 'Paracetamol',     dose: '500-1000mg VO 6/6h SOS', linha: 'adjuvante' },
      { nome: 'Dipirona',        dose: '500mg-1g VO/IV 6/6h', linha: 'adjuvante' },
      { nome: 'Ciclobenzaprina', dose: '5mg VO 8/8h × 5-7 dias (espasmo muscular)', linha: 'adjuvante', obs: 'máx 10mg 3x/dia; evitar em idosos' },
    ],
  },
  // Constipação crônica
  {
    diagnostico: 'Constipação Crônica',
    medicamentos: [
      { nome: 'Macrogol',    dose: '1-2 sachês VO 1x/dia diluídos em 250mL de água', linha: '1ª' },
      { nome: 'Lactulose',   dose: '15-30mL VO 1-2x/dia', linha: '1ª', obs: 'alternativa ao macrogol' },
      { nome: 'Bisacodil',   dose: '5-10mg VO à noite ou 10mg supositório SOS', linha: 'SOS', obs: 'uso pontual; não cronicizar' },
    ],
  },
  // Vertigem / VPPB
  {
    diagnostico: 'Vertigem',
    medicamentos: [
      { nome: 'Betaistina',   dose: '8-16mg VO 3x/dia (manutenção e Ménière)', linha: '1ª' },
      { nome: 'Dimenidrinato', dose: '50mg VO 6-8/8h SOS (crise aguda)', linha: 'crise', obs: 'sedativo; evitar uso crônico' },
      { nome: 'Ondansetrona', dose: '4-8mg VO/IV (náusea/vômito intratável associado)', linha: 'adjuvante' },
    ],
  },
  // Dermatofitose
  {
    diagnostico: 'Dermatofitose',
    medicamentos: [
      { nome: 'Clotrimazol', dose: '1% creme tópico 2x/dia × 2-4 semanas (pele glabra)', linha: '1ª' },
      { nome: 'Terbinafina', dose: '1% creme tópico 1x/dia × 1-2 semanas (pele). 250mg VO 1x/dia × 6 semanas (unhas dos pés)', linha: '1ª', obs: 'superior para tinha unguium' },
      { nome: 'Fluconazol',  dose: '150mg VO 1x/semana × 4-6 semanas (onicomicose grave)', linha: '2ª' },
      { nome: 'Miconazol',   dose: '2% creme 2x/dia (pé de atleta, tinea corporis)', linha: '1ª', obs: 'alternativa ao clotrimazol' },
    ],
  },
  // Escabiose
  {
    diagnostico: 'Escabiose',
    medicamentos: [
      { nome: 'Permetrina',         dose: '5% creme — aplicar do pescoço para baixo, lavar após 8-12h. Repetir em 7 dias', linha: '1ª' },
      { nome: 'Ivermectina',        dose: '200mcg/kg VO dose única (65-85kg: 12mg). Repetir em 7-14 dias', linha: '1ª', obs: 'preferir se sarna crostosa (3+ doses semanais)' },
      { nome: 'Benzoato de Benzila', dose: '25% loção — aplicar por 3 noites consecutivas', linha: 'alternativa', obs: 'irritante; evitar em crianças < 2 anos' },
    ],
  },
  // Herpes-Zóster
  {
    diagnostico: 'Herpes-Zóster',
    medicamentos: [
      { nome: 'Valaciclovir', dose: '1g VO 3x/dia × 7 dias (iniciar em 72h do rash)', linha: '1ª', obs: 'melhor biodisponibilidade' },
      { nome: 'Aciclovir',    dose: '800mg VO 5x/dia × 7 dias', linha: '1ª', obs: 'alternativa mais barata' },
      { nome: 'Prednisona',   dose: '40-60mg VO 1x/dia × 7 dias, reduzindo em 3 semanas', linha: 'adjuvante', obs: 'reduz dor aguda em > 50 anos sem contraindicação' },
      { nome: 'Amitriptilina', dose: '25-75mg à noite (profilaxia e tratamento neuralgia pós-herpética)', linha: 'neuralgia' },
    ],
  },
  // Conjuntivite
  {
    diagnostico: 'Conjuntivite',
    medicamentos: [
      { nome: 'Tobramicina Colírio', dose: '1 gota 6/6h × 5-7 dias (bacteriana)', linha: '1ª', obs: 'bacteriana' },
      { nome: 'Soro Fisiológico 0,9%', dose: 'Lavagem ocular 4-6x/dia (viral e alérgica)', linha: '1ª', obs: 'suporte; viral autolimitada' },
      { nome: 'Cetirizina',  dose: '10mg VO 1x/dia + colírio antihistamínico (alérgica)', linha: '1ª', obs: 'conjuntivite alérgica' },
    ],
  },
  // Erisipela / Celulite
  {
    diagnostico: 'Erisipela e Celulite',
    medicamentos: [
      { nome: 'Cefalexina',   dose: '500mg VO 6/6h × 10-14 dias (leve-moderada ambulatorial)', linha: '1ª' },
      { nome: 'Amoxicilina',  dose: '500mg VO 8/8h × 10-14 dias (alternativa)', linha: '1ª' },
      { nome: 'Clindamicina', dose: '300-450mg VO 8/8h × 10-14 dias (alérgico a penicilina)', linha: 'alternativa', obs: 'cobre MRSA comunitário' },
      { nome: 'Ceftriaxona',  dose: '1-2g IV 1x/dia (internação — grave ou sem resposta oral)', linha: '2ª' },
    ],
  },
  // Impetigo
  {
    diagnostico: 'Impetigo',
    medicamentos: [
      { nome: 'Mupirocina',             dose: '2% pomada tópica 3x/dia × 5-7 dias (localizado)', linha: '1ª' },
      { nome: 'Cefalexina',             dose: '500mg VO 6/6h × 7 dias (> 5 lesões ou disseminado)', linha: '1ª', obs: 'sistêmico' },
      { nome: 'Amoxicilina + Clavulanato', dose: '500/125mg VO 8/8h × 7 dias', linha: '2ª', obs: 'se suspeita de MRSA ou falha' },
    ],
  },
  // Rinite Alérgica
  {
    diagnostico: 'Rinite Alérgica',
    medicamentos: [
      { nome: 'Mometasona Nasal', dose: '2 jatos em cada narina 1x/dia', linha: '1ª', obs: 'corticoide nasal — 1ª linha para rinite persistente' },
      { nome: 'Budesonida Nasal', dose: '2 jatos em cada narina 1-2x/dia', linha: '1ª', obs: 'alternativa à mometasona' },
      { nome: 'Loratadina',       dose: '10mg VO 1x/dia', linha: '1ª', obs: 'anti-histamínico não sedante' },
      { nome: 'Cetirizina',       dose: '10mg VO 1x/dia (noite)', linha: '1ª', obs: 'leve sedação' },
      { nome: 'Desloratadina',    dose: '5mg VO 1x/dia', linha: '1ª' },
      { nome: 'Montelucaste',     dose: '10mg VO à noite (adulto)', linha: '2ª', obs: 'rinite + asma associadas' },
    ],
  },
  // Urticária / Angioedema
  {
    diagnostico: 'Urticária e Angioedema',
    medicamentos: [
      { nome: 'Loratadina',     dose: '10mg VO 1x/dia', linha: '1ª' },
      { nome: 'Cetirizina',     dose: '10mg VO 1x/dia', linha: '1ª' },
      { nome: 'Desloratadina',  dose: '5mg VO 1x/dia', linha: '1ª' },
      { nome: 'Dexclorfeniramina', dose: '2mg VO 6/6h (sedativo; útil à noite)', linha: '2ª' },
      { nome: 'Prednisona',     dose: '40-60mg VO/dia × 3-5 dias (grave ou refratária)', linha: '2ª' },
      { nome: 'Adrenalina',     dose: '0,3-0,5mg IM na face anterolateral da coxa (angioedema de glote / anafilaxia)', linha: 'emergência' },
    ],
  },
  // Anafilaxia
  {
    diagnostico: 'Anafilaxia',
    medicamentos: [
      { nome: 'Adrenalina',     dose: '0,3-0,5mg IM (adulto) / 0,01mg/kg IM (criança) face ant. da coxa. Repetir a cada 5-15min se necessário', linha: '1ª absoluta' },
      { nome: 'Hidrocortisona IV', dose: '200-500mg IV lento (adulto) / 4-8mg/kg (criança)', linha: '2ª', obs: 'não substituir adrenalina; previne resposta bifásica' },
      { nome: 'Dexclorfeniramina', dose: '5mg IV lento', linha: '2ª', obs: 'adjuvante ao antihistamínico' },
      { nome: 'Salbutamol',     dose: '2,5-5mg nebulização (broncoespasmo persistente)', linha: 'adjuvante' },
      { nome: 'Soro Fisiológico 0,9%', dose: '500-1000mL IV rápido (hipotensão)', linha: 'suporte hemodinâmico' },
    ],
  },
  // COVID-19 leve
  {
    diagnostico: 'Covid-19',
    medicamentos: [
      { nome: 'Paracetamol', dose: '500-1000mg VO 6/6h (febre e dor)', linha: '1ª', obs: 'sintomático — evitar AAS e AINE' },
      { nome: 'Dipirona',    dose: '500mg-1g VO 6/6h SOS', linha: '1ª', obs: 'sintomático' },
      { nome: 'Soro de Reidratação Oral', dose: '1-2L/dia (hidratação)', linha: 'suporte' },
    ],
  },
  // Febre sem foco pediátrica
  {
    diagnostico: 'Febre sem Foco',
    medicamentos: [
      { nome: 'Paracetamol', dose: '10-15mg/kg VO 6/6h SOS (máx 75mg/kg/dia)', linha: '1ª' },
      { nome: 'Ibuprofeno',  dose: '5-10mg/kg VO 6-8/8h SOS (usar > 3 meses)', linha: '1ª', obs: 'não usar em lactente < 3 meses' },
      { nome: 'Dipirona',    dose: '10-15mg/kg VO/IV 6/6h', linha: 'alternativa' },
    ],
  },
  // Bronquiolite
  {
    diagnostico: 'Bronquiolite',
    medicamentos: [
      { nome: 'Soro Fisiológico 0,9%', dose: 'Lavagem nasal 2-4mL por narina antes das mamadas; nebulização 3% (hipertônico) pode ser tentada', linha: '1ª', obs: 'único tratamento comprovado — suporte' },
      { nome: 'Salbutamol', dose: '0,15mg/kg nebulização (tentativa empírica; descontinuar se sem resposta)', linha: 'tentativa', obs: 'não recomendado rotineiramente — tentar 1x' },
    ],
  },
  // PAC
  {
    diagnostico: 'Pneumonia Comunitária',
    medicamentos: [
      { nome: 'Amoxicilina',             dose: 'Adulto: 500mg VO 8/8h × 7 dias. Criança: 40-50mg/kg/dia 8/8h × 7-10 dias', linha: '1ª', obs: 'PAC típica ambulatorial' },
      { nome: 'Amoxicilina + Clavulanato', dose: '875/125mg VO 12/12h × 7 dias (falha à amoxicilina ou aspiração)', linha: '2ª' },
      { nome: 'Azitromicina',            dose: '500mg VO 1x/dia × 5 dias', linha: '2ª', obs: 'atípicos, alérgico a penicilina; associar se atipico suspeito' },
      { nome: 'Ceftriaxona',             dose: '1-2g IV/IM 1x/dia (internação)', linha: '2ª', obs: 'hospitalização' },
    ],
  },
  // GEA pediátrica
  {
    diagnostico: 'Gastroenterite Aguda Pediátrica',
    medicamentos: [
      { nome: 'Soro de Reidratação Oral', dose: '50-100mL/kg em 4h (desidratação leve-mod). Manutenção: 10mL/kg por evacuação', linha: '1ª' },
      { nome: 'Zinco',       dose: '< 6 meses: 10mg/dia. ≥ 6 meses: 20mg/dia. VO × 10-14 dias', linha: '1ª', obs: 'OMS recomenda junto à reidratação' },
      { nome: 'Ondansetrona', dose: '0,15mg/kg VO/IV (máx 8mg) — vômitos intensos impedindo reidratação oral', linha: 'adjuvante' },
    ],
  },
  // Dermatite atópica
  {
    diagnostico: 'Dermatite Atópica',
    medicamentos: [
      { nome: 'Hidrocortisona',  dose: '1% creme 1-2x/dia nas lesões ativas (regiões delicadas: face, dobras)', linha: '1ª' },
      { nome: 'Betametasona',    dose: '0,05% creme 1-2x/dia nas lesões (regiões de pele espessa)', linha: '2ª', obs: 'evitar face e dobras; não usar > 2 semanas contínuas' },
      { nome: 'Loratadina',      dose: '10mg VO 1x/dia (adulto); xarope pediátrico para < 30kg', linha: 'adjuvante', obs: 'prurido' },
      { nome: 'Cetirizina',      dose: '10mg VO 1x/dia (adulto)', linha: 'adjuvante' },
    ],
  },
  // Pré-natal
  {
    diagnostico: 'Pré-natal de Baixo Risco',
    medicamentos: [
      { nome: 'Ácido Fólico',   dose: '0,4mg/dia VO pré-concepção e 1T; 5mg/dia se risco (gêmeos, histórico DTN, antiepiléptico)', linha: '1ª' },
      { nome: 'Sulfato Ferroso', dose: '40mg Fe elementar/dia VO a partir de 20 semanas', linha: '1ª' },
    ],
  },
  // Vaginite
  {
    diagnostico: 'Vaginite',
    medicamentos: [
      { nome: 'Metronidazol',  dose: '500mg VO 12/12h × 7 dias (vaginose bacteriana)', linha: '1ª', obs: 'vaginose' },
      { nome: 'Clotrimazol',   dose: '100mg óvulo vaginal 1x/dia × 6 dias ou 500mg dose única', linha: '1ª', obs: 'candidíase' },
      { nome: 'Fluconazol',    dose: '150mg VO dose única (candidíase não complicada)', linha: '1ª', obs: 'candidíase — não usar em gestante' },
    ],
  },
  // IST
  {
    diagnostico: 'Infecções Sexualmente Transmissíveis',
    medicamentos: [
      { nome: 'Penicilina Benzatina', dose: 'Sífilis primária/secundária: 2.400.000UI IM dose única. Latente tardia: 2.400.000UI IM semanal × 3', linha: '1ª', obs: 'sífilis' },
      { nome: 'Doxiciclina',         dose: '100mg VO 12/12h × 7 dias (clamídia; alternativa gonorreia)', linha: '1ª', obs: 'clamídia' },
      { nome: 'Azitromicina',        dose: '1g VO dose única (clamídia; alérgico à penicilina)', linha: '2ª' },
      { nome: 'Ceftriaxona',         dose: '500mg IM dose única (gonorreia)', linha: '1ª', obs: 'gonorreia' },
      { nome: 'Metronidazol',        dose: '2g VO dose única (tricomoníase)', linha: '1ª', obs: 'tricomoníase' },
    ],
  },
  // Dengue
  {
    diagnostico: 'Dengue',
    medicamentos: [
      { nome: 'Paracetamol', dose: '500-1000mg VO 6/6h (febre e dor)', linha: '1ª', obs: 'NUNCA usar AAS ou AINE — risco hemorrágico' },
      { nome: 'Soro de Reidratação Oral', dose: '1-2L/dia (hidratação oral vigorosa)', linha: '1ª' },
      { nome: 'Dipirona',    dose: '500mg VO 6/6h alternado com paracetamol se necessário', linha: 'alternativa' },
    ],
  },
  // SCA
  {
    diagnostico: 'Síndrome Coronariana Aguda',
    medicamentos: [
      { nome: 'Ácido Acetilsalicílico', dose: '300mg VO mastigado (dose de ataque); manutenção 100mg/dia', linha: '1ª', obs: 'antiagregação dupla — associar P2Y12' },
      { nome: 'Ticagrelor',             dose: '180mg VO ataque, depois 90mg 12/12h', linha: '1ª', obs: 'preferível ao clopidogrel em SCA de alto risco' },
      { nome: 'Clopidogrel',            dose: '300-600mg VO ataque, depois 75mg/dia', linha: '1ª', obs: 'alternativa ao ticagrelor ou se AVC prévio' },
      { nome: 'Heparina Não Fracionada', dose: '60-70 UI/kg IV bolus (máx 5000UI) + infusão 12-15 UI/kg/h (STEMI/NSTEMI)', linha: '1ª' },
      { nome: 'Morfina IV',             dose: '2-4mg IV lento, repetir 5-10 min se dor (usar com cautela — pode mascarar evolução)', linha: 'adjuvante', obs: 'dor intensa refratária a nitrato' },
      { nome: 'Nitroglicerina',         dose: '0,5mg SL a cada 5 min × 3 doses (se PA > 90 sistólica); IV se angina persistente', linha: 'adjuvante', obs: 'contraindicado se uso de sildenafil 24-48h' },
    ],
  },
  // EAP
  {
    diagnostico: 'Edema Agudo de Pulmão',
    medicamentos: [
      { nome: 'Furosemida',    dose: '40-80mg IV bolus; repetir em 2h se sem resposta (dobrar dose)', linha: '1ª' },
      { nome: 'Nitroglicerina', dose: 'Iniciar 10-20mcg/min IV; titular a cada 5min até alívio (se PAs > 100 mmHg)', linha: '1ª', obs: 'potente vasodilatador venoso — reduz pré-carga' },
      { nome: 'Morfina IV',    dose: '2-4mg IV lento (ansiolítico + vasodilatador); usar com cautela', linha: 'adjuvante', obs: 'controverso — monitorizar depressão respiratória' },
    ],
  },
  // TSV
  {
    diagnostico: 'Taquicardia Supraventricular',
    medicamentos: [
      { nome: 'Adenosina',   dose: '6mg IV bolus em acesso proximal + flush 20mL SF; se falhar: 12mg IV em 1-2 min', linha: '1ª', obs: 'dar em bolus rápido; avisar paciente sobre sensação de mal-estar breve' },
      { nome: 'Amiodarona',  dose: '150mg IV em 10 min se instabilidade hemodinâmica; manutenção 1mg/min × 6h', linha: '2ª', obs: 'preferir cardioversão elétrica se instável' },
    ],
  },
  // Dissecção Aórtica
  {
    diagnostico: 'Dissecção Aórtica',
    medicamentos: [
      { nome: 'Labetalol IV', dose: '20mg IV em 2 min; repetir 40-80mg a cada 10 min até FC < 60 e PAs < 120 mmHg', linha: '1ª', obs: 'meta: FC < 60 bpm + PA sistólica 100-120 mmHg' },
      { nome: 'Morfina IV',   dose: '4-8mg IV lento para analgesia; repetir 2-4mg a cada 5-15 min', linha: 'adjuvante' },
    ],
  },
  // AVC Isquêmico
  {
    diagnostico: 'AVC Isquêmico',
    medicamentos: [
      { nome: 'Alteplase', dose: '0,9mg/kg IV (máx 90mg): 10% em bolus em 1min + 90% em infusão 60min. Janela: < 4,5h do início', linha: '1ª', obs: 'contraindicado se: TC com hemorragia, cirurgia < 14d, AVC prévio + DM, PA > 185/110 não controlada' },
      { nome: 'Ácido Acetilsalicílico', dose: '300mg VO/SNG nas primeiras 24-48h (se não trombolisado); se trombolisado, aguardar 24h + TC controle', linha: '2ª' },
      { nome: 'Rivaroxabana', dose: '15-20mg VO 1x/dia (se FA como etiologia, iniciar após 7-14 dias do AVC)', linha: 'adjuvante', obs: 'para prevenção secundária em FA' },
    ],
  },
  // AVC Hemorrágico
  {
    diagnostico: 'AVC Hemorrágico',
    medicamentos: [
      { nome: 'Labetalol IV', dose: '10-20mg IV em 2 min; repetir a cada 10 min até PAs < 140 mmHg (meta Interact-2)', linha: '1ª', obs: 'meta: PAs < 140 mmHg em 1h' },
      { nome: 'Manitol IV',   dose: '0,25-1g/kg IV em 15-20 min (se sinais de herniação)', linha: 'adjuvante', obs: 'reduz PIC temporariamente' },
    ],
  },
  // HSA
  {
    diagnostico: 'Hemorragia Subaracnóidea',
    medicamentos: [
      { nome: 'Nimodipino', dose: '60mg VO/SNG a cada 4h × 21 dias (previne vasoespasmo)', linha: '1ª', obs: 'iniciar assim que confirmada a HSA; não é para controle de PA' },
      { nome: 'Morfina IV', dose: '2-4mg IV lento para analgesia da cefaleia; repetir conforme necessário', linha: 'adjuvante' },
    ],
  },
  // Síncope
  {
    diagnostico: 'Síncope',
    medicamentos: [
      { nome: 'Soro Fisiológico 0,9%', dose: '500-1000mL IV se síncope ortostática ou hipovolêmica', linha: '1ª', obs: 'síncope vasovagal não requer medicação — manobras físicas + decúbito' },
    ],
  },
  // TEP
  {
    diagnostico: 'Tromboembolismo Pulmonar',
    medicamentos: [
      { nome: 'Heparina Não Fracionada', dose: 'Bolus 80 UI/kg IV + infusão 18 UI/kg/h (TEP maciço ou intermediário-alto risco)', linha: '1ª', obs: 'monitorar TTPA alvo 60-100s' },
      { nome: 'Enoxaparina',             dose: '1mg/kg SC 12/12h ou 1,5mg/kg SC 1x/dia (TEP baixo risco — estável)', linha: '1ª', obs: 'evitar se ClCr < 30 mL/min' },
      { nome: 'Alteplase',               dose: '100mg IV em 2h (TEP maciço com choque); 0,6mg/kg em 15min se PCR', linha: 'emergência', obs: 'TEP maciço com hipotensão refratária' },
      { nome: 'Rivaroxabana',            dose: '15mg VO 12/12h × 21 dias; depois 20mg/dia (manutenção)', linha: '2ª', obs: 'anticoagulação oral após estabilização' },
    ],
  },
  // Pneumotórax Espontâneo
  {
    diagnostico: 'Pneumotórax Espontâneo',
    medicamentos: [
      { nome: 'Soro Fisiológico 0,9%', dose: 'Acesso venoso para suporte; O2 a 100% por máscara (acelera reabsorção do ar)', linha: 'suporte', obs: 'tratamento definitivo é exsuflaçao por agulha ou drenagem torácica' },
    ],
  },
  // Sepse
  {
    diagnostico: 'Sepse e Choque Séptico',
    medicamentos: [
      { nome: 'Soro Fisiológico 0,9%', dose: '30mL/kg IV em 30-60 min (bolus inicial); reavaliar após cada 500mL', linha: '1ª', obs: 'bundle 1h — iniciar antes de ATB se possível' },
      { nome: 'Noradrenalina',         dose: '0,01-3 mcg/kg/min IV infusão contínua (PAM-alvo ≥ 65 mmHg)', linha: '1ª', obs: 'vasopressor de escolha no choque séptico' },
      { nome: 'Ceftriaxona',           dose: '2g IV 1x/dia (foco pulmonar/urinário/abdominal sem imunossupressão)', linha: '1ª', obs: 'ATB em < 1h do reconhecimento (bundle)' },
      { nome: 'Metronidazol',          dose: '500mg IV 8/8h (se foco abdominal/pélvico suspeito de anaeróbios)', linha: '1ª', obs: 'associar à ceftriaxona em sepse abdominal' },
      { nome: 'Hidrocortisona IV',     dose: '200mg/dia IV (50mg 6/6h ou infusão contínua) se choque refratário a vasopressores', linha: 'adjuvante' },
    ],
  },
  // Choque Hipovolêmico
  {
    diagnostico: 'Choque Hipovolêmico',
    medicamentos: [
      { nome: 'Soro Fisiológico 0,9%', dose: '1-2L IV rápido (20-30min); reavaliar continuamente', linha: '1ª', obs: 'Ringer Lactato preferível em perdas volêmicas grandes (menor acidose hiperclorêmica)' },
      { nome: 'Ácido Tranexâmico', dose: '1g IV em 10 min; repetir 1g em 8h se necessário (trauma < 3h)', linha: '1ª', obs: 'hemorragia traumática — TXA reduz mortalidade se dado < 3h' },
    ],
  },
  // CAD
  {
    diagnostico: 'Cetoacidose Diabética',
    medicamentos: [
      { nome: 'Soro Fisiológico 0,9%', dose: '1L/h IV na 1ª hora; depois 250-500mL/h conforme status volêmico', linha: '1ª', obs: 'hidratação é a primeira medida — antes da insulina' },
      { nome: 'Insulina Regular Humana', dose: '0,1 UI/kg/h IV infusão contínua (iniciar somente após K > 3,5 mEq/L)', linha: '1ª', obs: 'bolus inicial de 0,1 UI/kg IV opcional em CAD grave' },
      { nome: 'Bicarbonato de Sódio 8,4%', dose: '100mL IV em 2h somente se pH < 6,9; NÃO usar rotineiramente', linha: 'adjuvante', obs: 'uso restrito — piora hipocalemia e paradoxalmente acidose intracelular' },
    ],
  },
  // EHH
  {
    diagnostico: 'Estado Hiperosmolar Hiperglicêmico',
    medicamentos: [
      { nome: 'Soro Fisiológico 0,9%', dose: '1L/h IV na 1ª hora; depois 500mL/h por 2-4h; ajustar pelo status volêmico e osmolaridade', linha: '1ª', obs: 'hidratação agressiva é o principal tratamento' },
      { nome: 'Insulina Regular Humana', dose: '0,05-0,1 UI/kg/h IV somente após hidratação inicial e glicemia < 300 mg/dL', linha: '2ª', obs: 'iniciar insulina tarde — hidratação primeiro reduz glicemia significativamente' },
    ],
  },
  // Hipoglicemia Grave
  {
    diagnostico: 'Hipoglicemia Grave',
    medicamentos: [
      { nome: 'Glicose 50%',  dose: '40-60mL IV bolus (20-30g de glicose); repetir em 15 min se glicemia < 70', linha: '1ª', obs: 'acesso venoso disponível — via de escolha' },
      { nome: 'Glucagon',     dose: '1mg IM coxa ou SC (se sem acesso venoso); efeito em 10-15 min', linha: '1ª', obs: 'alternativa ao acesso venoso — pode causar vômitos; não funciona em hepatopatia grave ou desnutrição' },
    ],
  },
  // Apendicite Aguda
  {
    diagnostico: 'Apendicite Aguda',
    medicamentos: [
      { nome: 'Ceftriaxona',   dose: '2g IV 1x/dia (profilaxia/tratamento pré-operatório)', linha: '1ª', obs: 'iniciar ao confirmar diagnóstico' },
      { nome: 'Metronidazol',  dose: '500mg IV 8/8h (cobertura de anaeróbios)', linha: '1ª', obs: 'associar à ceftriaxona — cobre enterobactérias + anaeróbios' },
      { nome: 'Dipirona',      dose: '1g IV 6/6h (analgesia)', linha: 'adjuvante', obs: 'analgesia não mascara o diagnóstico — não retardar' },
      { nome: 'Morfina IV',    dose: '2-4mg IV lento SOS (dor intensa)', linha: 'adjuvante' },
    ],
  },
  // Pancreatite Aguda
  {
    diagnostico: 'Pancreatite Aguda',
    medicamentos: [
      { nome: 'Soro Fisiológico 0,9%', dose: '250-500mL/h IV nas primeiras 12-24h (hidratação agressiva)', linha: '1ª', obs: 'Ringer Lactato pode ser preferível — evidências de menor mortalidade' },
      { nome: 'Dipirona',              dose: '1g IV 6/6h (analgesia de base)', linha: '1ª' },
      { nome: 'Morfina IV',            dose: '2-4mg IV SOS (dor intensa — contraindicação histórica ao morfínicos é mito)', linha: 'adjuvante' },
      { nome: 'Omeprazol',             dose: '40mg IV 12/12h (prevenção de úlcera de estresse)', linha: 'adjuvante' },
    ],
  },
  // Obstrução Intestinal
  {
    diagnostico: 'Obstrução Intestinal',
    medicamentos: [
      { nome: 'Soro Fisiológico 0,9%', dose: '1-2L IV para correção de desequilíbrio hidroeletrolítico', linha: '1ª', obs: 'descompressão por SNG é medida essencial' },
      { nome: 'Dipirona',              dose: '1g IV 6/6h para analgesia', linha: 'adjuvante' },
      { nome: 'Ceftriaxona',           dose: '2g IV (se sinais de isquemia ou peritonite)', linha: 'adjuvante', obs: 'antibiótico somente em complicações (febre, leucocitose, peritonite)' },
    ],
  },
  // TCE
  {
    diagnostico: 'Traumatismo Cranioencefálico',
    medicamentos: [
      { nome: 'Dipirona',   dose: '1g IV 6/6h (analgesia — evitar AINE por risco hemorrágico)', linha: '1ª' },
      { nome: 'Manitol IV', dose: '0,25-1g/kg IV em 15-20 min (sinais de herniação cerebral: pupila assimétrica, decerebração)', linha: 'emergência', obs: 'apenas como "ponte" antes de neurocirurgia — manter PAs > 90 mmHg' },
      { nome: 'Fenitoína IV', dose: '20mg/kg IV lento ≤ 50mg/min (profilaxia de convulsão precoce em TCE grave — Glasgow ≤ 8)', linha: 'adjuvante' },
    ],
  },
  // Status Epilepticus
  {
    diagnostico: 'Estado de Mal Epiléptico',
    medicamentos: [
      { nome: 'Diazepam',       dose: '10mg IV (0,2mg/kg) lento; se sem acesso: 10-20mg retal. Repetir 1x após 5 min se mantida', linha: '1ª', obs: '1ª linha até 5-10 min' },
      { nome: 'Midazolam IV',   dose: '0,1-0,2mg/kg IV ou 0,2mg/kg IM (se sem acesso venoso)', linha: '1ª', obs: 'alternativa ao diazepam — IM funciona bem' },
      { nome: 'Fenitoína IV',   dose: '20mg/kg IV lento ≤ 50mg/min (2ª linha, iniciar se crise > 10-20 min)', linha: '2ª', obs: 'monitorar ECG — risco de arritmia se infusão rápida' },
      { nome: 'Fenobarbital IV', dose: '20mg/kg IV lento ≤ 60mg/min (3ª linha se fenitoína falhou)', linha: '3ª', obs: 'risco de depressão respiratória — ter IOT disponível' },
    ],
  },
  // Intoxicação Paracetamol
  {
    diagnostico: 'Intoxicação por Paracetamol',
    medicamentos: [
      { nome: 'Carvão Ativado',    dose: '50g VO (1g/kg em criança, máx 50g) em suspensão — eficaz se < 4h da ingestão', linha: '1ª', obs: 'contraindicado se Glasgow < 12 sem via aérea protegida' },
      { nome: 'N-acetilcisteína IV', dose: 'Protocolo 21h: 150mg/kg IV em 200mL SG5% em 1h → 50mg/kg em 500mL em 4h → 100mg/kg em 1L em 16h', linha: '1ª', obs: 'iniciar mesmo com nomograma limítrofe — risco > benefício; máxima eficácia se < 8h da ingestão' },
    ],
  },
  // Intoxicação BZD
  {
    diagnostico: 'Intoxicação por Benzodiazepínico',
    medicamentos: [
      { nome: 'Flumazenil', dose: '0,2mg IV em 30s; repetir 0,1mg a cada 1 min até resposta (máx 1mg)', linha: '1ª', obs: 'CUIDADO: não usar se BZD para controle de epilepsia (precipita convulsão); meia-vida curta — pode haver ressedação' },
      { nome: 'Soro Fisiológico 0,9%', dose: 'Suporte volêmico IV se hipotensão', linha: 'suporte' },
    ],
  },
  // Intoxicação Organofosforado
  {
    diagnostico: 'Intoxicação por Organofosforado',
    medicamentos: [
      { nome: 'Atropina',    dose: '2-4mg IV bolus; dobrar a dose a cada 5-10 min até secar as secreções brônquicas (endpoint: secreções secas — NÃO é FC ou pupilas)', linha: '1ª', obs: 'doses massivas podem ser necessárias (> 50mg em casos graves); manter via aérea' },
      { nome: 'Pralidoxima', dose: '1-2g IV em 15-30 min; depois 200-400mg/h IV (iniciar em < 24-48h da exposição)', linha: '1ª', obs: 'reativa a colinesterase — ineficaz após envelhecimento (> 48h)' },
      { nome: 'Diazepam',   dose: '10mg IV lento (se convulsão associada)', linha: 'adjuvante' },
    ],
  },
];

module.exports = { diagnosticos, medicamentos, relacoes };

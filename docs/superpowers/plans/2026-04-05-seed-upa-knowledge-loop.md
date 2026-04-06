# Seed UPA + Knowledge Loop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Neo4j clinical seed with ~22 UPA diagnoses + ~25 emergency medications, and add an async knowledge-extraction loop that creates `pending` nodes from LLM responses for admin review.

**Architecture:** All existing Neo4j nodes gain a `status` property (`"verified"` | `"pending"`). The clinical context query filters to `verified` only. After each LLM response, a fire-and-forget extractor creates `pending` nodes; an admin page at `/admin/knowledge` lets a reviewer approve or reject them.

**Tech Stack:** Node.js + Express, Neo4j (neo4j-driver v5), OpenAI SDK (OpenRouter), React + SCSS Modules, Jest + Supertest.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `backend/src/db/seeds/clinical-data.js` |
| Modify | `backend/src/db/seed-neo4j.js` |
| Create | `backend/src/db/migrate-neo4j-status.js` |
| Modify | `backend/src/services/neo4j-search.js` |
| Create | `backend/src/services/knowledge-extractor.js` |
| Modify | `backend/src/routes/analyze.js` |
| Create | `backend/src/routes/admin-knowledge.js` |
| Create | `backend/src/__tests__/admin-knowledge.test.js` |
| Modify | `backend/src/app.js` |
| Modify | `frontend/src/services/api.js` |
| Create | `frontend/src/pages/AdminKnowledge.jsx` |
| Create | `frontend/src/pages/AdminKnowledge.module.scss` |
| Modify | `frontend/src/App.jsx` |

---

## Task 1: Expand clinical-data.js with UPA diagnósticos and medications

**Files:**
- Modify: `backend/src/db/seeds/clinical-data.js`

> No automated tests. After implementing, run the seed in Task 2 and verify counts.

- [ ] **Step 1: Add UPA diagnósticos to the `diagnosticos` array**

Open `backend/src/db/seeds/clinical-data.js`. Find the line `// ── SAÚDE DA MULHER` (around line 562) and insert the following block **before** it:

```js
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
      'Ortopneia + crepitações bibasais + esteatorreia rósea (EAP franco)',
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
```

- [ ] **Step 2: Add UPA medicamentos to the `medicamentos` array**

Find the line `// Lipídios` (near end of the medicamentos array, around line 790) and insert the following block **before** `// Lipídios`:

```js
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
  { nome: 'Nitroglicerina', classe: 'Nitrato (vasodilatador coronariano/venoso)', apresentacoes: ['0,5mg comp sublingual', '5mg/mL inj'], viaAdmin: 'SL/IV' },
  { nome: 'Noradrenalina', classe: 'Vasopressor catecolaminérgico', apresentacoes: ['4mg/4mL inj'], viaAdmin: 'IV infusão contínua' },
  { nome: 'Pralidoxima', classe: 'Reativador de colinesterase (antídoto organofosforado)', apresentacoes: ['1g inj'], viaAdmin: 'IV lento' },
  { nome: 'Rivaroxabana', classe: 'Anticoagulante oral (inibidor Xa)', apresentacoes: ['10mg', '15mg', '20mg comp'], viaAdmin: 'oral' },
  { nome: 'Ticagrelor', classe: 'Antiagregante plaquetário (inibidor P2Y12 reversível)', apresentacoes: ['90mg', '180mg comp'], viaAdmin: 'oral' },
```

- [ ] **Step 3: Add UPA relações to the `relacoes` array**

Find the closing `];` at the end of the `relacoes` array (last line before the `module.exports`) and insert the following **before** it:

```js
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
```

- [ ] **Step 4: Commit**

```bash
cd C:/freela/projects/.worktrees/conduta-build
git add conduta/backend/src/db/seeds/clinical-data.js
git commit -m "feat(seed): expand clinical-data with 22 UPA diagnoses and 25 emergency medications"
```

---

## Task 2: Add `status` property to Neo4j — migration + seed update

**Files:**
- Create: `backend/src/db/migrate-neo4j-status.js`
- Modify: `backend/src/db/seed-neo4j.js`

- [ ] **Step 1: Create the Neo4j migration script**

Create `backend/src/db/migrate-neo4j-status.js`:

```js
/**
 * migrate-neo4j-status.js
 * Adds status:"verified" to all existing nodes and relationships that lack it.
 * Idempotent — safe to run multiple times.
 *
 * Usage: node src/db/migrate-neo4j-status.js
 */
require('dotenv').config();
const driver = require('./neo4j');

async function migrate() {
  const session = driver.session();
  try {
    console.log('\n=== Neo4j Migration: add status property ===\n');

    const queries = [
      `MATCH (n:Diagnostico) WHERE n.status IS NULL SET n.status = 'verified'`,
      `MATCH (n:Medicamento)  WHERE n.status IS NULL SET n.status = 'verified'`,
      `MATCH (n:RedFlag)      WHERE n.status IS NULL SET n.status = 'verified'`,
      `MATCH ()-[r:TRATA_COM]->() WHERE r.status IS NULL SET r.status = 'verified'`,
    ];

    for (const q of queries) {
      const result = await session.run(q);
      console.log(`✓ ${q.split('MATCH')[1].split('WHERE')[0].trim()} — ${result.summary.counters.updates().propertiesSet} propriedades definidas`);
    }

    console.log('\n✓ Migração concluída.\n');
  } catch (err) {
    console.error('Erro na migração:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

migrate();
```

- [ ] **Step 2: Update `seed-neo4j.js` to set `status:"verified"` on all operations**

Open `backend/src/db/seed-neo4j.js`. In the section `// ── 2. Importar diagnósticos` (around line 40), update the MERGE for Diagnostico nodes:

Old:
```js
      await session.run(
        `MERGE (d:Diagnostico {nome: $nome})
         SET d.cid = $cid,
             d.sinonimos = $sinonimos`,
        { nome: d.nome, cid: d.cid || '', sinonimos: d.sinonimos || [] }
      );
```

New:
```js
      await session.run(
        `MERGE (d:Diagnostico {nome: $nome})
         SET d.cid = $cid,
             d.sinonimos = $sinonimos,
             d.status = 'verified'`,
        { nome: d.nome, cid: d.cid || '', sinonimos: d.sinonimos || [] }
      );
```

Then find the RedFlag MERGE (around line 51):

Old:
```js
          `MERGE (r:RedFlag {descricao: $descricao})
           WITH r
           MATCH (d:Diagnostico {nome: $nome})
           MERGE (d)-[:TEM_RED_FLAG]->(r)`,
```

New:
```js
          `MERGE (r:RedFlag {descricao: $descricao})
           SET r.status = 'verified'
           WITH r
           MATCH (d:Diagnostico {nome: $nome})
           MERGE (d)-[:TEM_RED_FLAG]->(r)`,
```

Then find the Medicamento MERGE (around line 77):

Old:
```js
      await session.run(
        `MERGE (m:Medicamento {nome: $nome})
         SET m.classe = $classe,
             m.apresentacoes = $apresentacoes,
             m.viaAdmin = $viaAdmin`,
```

New:
```js
      await session.run(
        `MERGE (m:Medicamento {nome: $nome})
         SET m.classe = $classe,
             m.apresentacoes = $apresentacoes,
             m.viaAdmin = $viaAdmin,
             m.status = 'verified'`,
```

Then find the TRATA_COM MERGE (around line 107):

Old:
```js
           `MATCH (d:Diagnostico {nome: $diagnostico})
            MATCH (m:Medicamento {nome: $medicamento})
            MERGE (d)-[r:TRATA_COM]->(m)
            SET r.dose = $dose, r.linha = $linha, r.obs = $obs
            RETURN d.nome, m.nome`,
```

New:
```js
           `MATCH (d:Diagnostico {nome: $diagnostico})
            MATCH (m:Medicamento {nome: $medicamento})
            MERGE (d)-[r:TRATA_COM]->(m)
            SET r.dose = $dose, r.linha = $linha, r.obs = $obs, r.status = 'verified'
            RETURN d.nome, m.nome`,
```

- [ ] **Step 3: Add `package.json` script for migration**

Open `backend/package.json`. In the `"scripts"` section, add:

```json
"migrate:neo4j": "node src/db/migrate-neo4j-status.js",
```

So the scripts block becomes:
```json
"scripts": {
  "dev": "node --watch src/index.js",
  "start": "node src/index.js",
  "test": "jest --runInBand",
  "migrate": "node src/db/migrate.js",
  "migrate:neo4j": "node src/db/migrate-neo4j-status.js",
  "seed:neo4j": "node src/db/seed-neo4j.js"
},
```

- [ ] **Step 4: Commit**

```bash
cd C:/freela/projects/.worktrees/conduta-build
git add conduta/backend/src/db/migrate-neo4j-status.js conduta/backend/src/db/seed-neo4j.js conduta/backend/package.json
git commit -m "feat(neo4j): add status:'verified' to all nodes/relations in seed and migration"
```

---

## Task 3: Update `neo4j-search.js` to filter `status = 'verified'`

**Files:**
- Modify: `backend/src/services/neo4j-search.js`

- [ ] **Step 1: Write the failing test**

In `backend/src/__tests__/health.test.js`, add a test to verify that the search query does NOT contain unfiltered node matches. Actually, this is a query-level change — verify by reading the test below.

Create test file `backend/src/__tests__/neo4j-search.test.js`:

```js
/**
 * Verifies that searchClinicalContext only queries verified nodes.
 * Mocks the Neo4j driver to inspect the Cypher query used.
 */

const mockRun = jest.fn().mockResolvedValue({ records: [] });
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockRun, close: mockClose })),
}));

const { searchClinicalContext } = require('../services/neo4j-search');

beforeEach(() => {
  mockRun.mockClear();
});

describe('searchClinicalContext', () => {
  it('includes status = verified filter in Cypher query', async () => {
    await searchClinicalContext('dor no peito paciente diabético');
    expect(mockRun).toHaveBeenCalledTimes(1);
    const [query] = mockRun.mock.calls[0];
    expect(query).toContain("status = 'verified'");
  });

  it('returns null when no records found', async () => {
    const result = await searchClinicalContext('xyzabc123');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd C:/freela/projects/.worktrees/conduta-build/conduta/backend
npx jest src/__tests__/neo4j-search.test.js --no-coverage
```

Expected: FAIL — `"status = 'verified'"` not found in query.

- [ ] **Step 3: Update the Cypher query in `neo4j-search.js`**

Open `backend/src/services/neo4j-search.js`. Replace the entire `session.run(...)` call (the MATCH block):

Old:
```js
    const result = await session.run(
      `MATCH (d:Diagnostico)
       WHERE any(t IN $terms WHERE
         toLower(d.nome) CONTAINS t OR
         any(s IN d.sinonimos WHERE toLower(s) CONTAINS t)
       )
       OPTIONAL MATCH (d)-[rel:TRATA_COM]->(m:Medicamento)
       OPTIONAL MATCH (d)-[:TEM_RED_FLAG]->(r:RedFlag)
       OPTIONAL MATCH (d)-[:EXIGE_EXCLUSAO]->(dd:Diagnostico)
       RETURN d.nome AS diagnostico,
              d.cid AS cid,
              collect(DISTINCT {nome: m.nome, dose: rel.dose, linha: rel.linha, obs: rel.obs}) AS medicamentos,
              collect(DISTINCT r.descricao) AS redFlags,
              collect(DISTINCT dd.nome) AS exclusoes
       LIMIT 5`,
      { terms }
    );
```

New:
```js
    const result = await session.run(
      `MATCH (d:Diagnostico)
       WHERE d.status = 'verified'
         AND any(t IN $terms WHERE
           toLower(d.nome) CONTAINS t OR
           any(s IN d.sinonimos WHERE toLower(s) CONTAINS t)
         )
       OPTIONAL MATCH (d)-[rel:TRATA_COM {status: 'verified'}]->(m:Medicamento {status: 'verified'})
       OPTIONAL MATCH (d)-[:TEM_RED_FLAG]->(r:RedFlag {status: 'verified'})
       OPTIONAL MATCH (d)-[:EXIGE_EXCLUSAO]->(dd:Diagnostico {status: 'verified'})
       RETURN d.nome AS diagnostico,
              d.cid AS cid,
              collect(DISTINCT {nome: m.nome, dose: rel.dose, linha: rel.linha, obs: rel.obs}) AS medicamentos,
              collect(DISTINCT r.descricao) AS redFlags,
              collect(DISTINCT dd.nome) AS exclusoes
       LIMIT 5`,
      { terms }
    );
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd C:/freela/projects/.worktrees/conduta-build/conduta/backend
npx jest src/__tests__/neo4j-search.test.js --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd C:/freela/projects/.worktrees/conduta-build
git add conduta/backend/src/services/neo4j-search.js conduta/backend/src/__tests__/neo4j-search.test.js
git commit -m "feat(neo4j): filter clinical context to verified nodes only"
```

---

## Task 4: Implement `knowledge-extractor.js`

**Files:**
- Create: `backend/src/services/knowledge-extractor.js`
- Create: `backend/src/__tests__/knowledge-extractor.test.js`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/__tests__/knowledge-extractor.test.js`:

```js
const mockCreate = jest.fn();
const mockNeo4jRun = jest.fn().mockResolvedValue({ records: [] });
const mockNeo4jClose = jest.fn().mockResolvedValue(undefined);

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }))
);

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockNeo4jRun, close: mockNeo4jClose })),
}));

const { extractAndPersist } = require('../services/knowledge-extractor');

beforeEach(() => {
  mockCreate.mockClear();
  mockNeo4jRun.mockClear();
});

describe('extractAndPersist', () => {
  it('calls OpenRouter with the response text and sessionId', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ diagnosticos: [], medicamentos: [], relacoes: [] }) } }],
    });

    await extractAndPersist('Paciente com SCA, usar AAS e heparina.', 'session-abc');

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[1].content).toContain('Paciente com SCA, usar AAS e heparina.');
  });

  it('creates pending Diagnostico nodes for new diagnoses', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            diagnosticos: [{ nome: 'Novo Diagnóstico Raro', cid: 'X99', sinonimos: ['raro'], redFlags: ['febre alta'], excluir: [] }],
            medicamentos: [],
            relacoes: [],
          }),
        },
      }],
    });
    // First call checks if node exists (returns empty), second creates it
    mockNeo4jRun.mockResolvedValueOnce({ records: [] });

    await extractAndPersist('Texto clínico.', 'session-xyz');

    const createCall = mockNeo4jRun.mock.calls.find(([q]) => q.includes('CREATE') && q.includes('Diagnostico'));
    expect(createCall).toBeDefined();
    expect(createCall[1]).toMatchObject({ nome: 'Novo Diagnóstico Raro', sourceSessionId: 'session-xyz' });
  });

  it('skips nodes that already exist as verified', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            diagnosticos: [{ nome: 'Hipertensão Arterial Sistêmica', sinonimos: [], redFlags: [], excluir: [] }],
            medicamentos: [],
            relacoes: [],
          }),
        },
      }],
    });
    // Simulate node already existing
    mockNeo4jRun.mockResolvedValueOnce({ records: [{ get: () => 'verified' }] });

    await extractAndPersist('Texto clínico.', 'session-exists');

    const createCall = mockNeo4jRun.mock.calls.find(([q]) => q.includes('CREATE') && q.includes('Diagnostico'));
    expect(createCall).toBeUndefined();
  });

  it('does not throw if OpenRouter returns malformed JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'texto livre sem json' } }],
    });
    await expect(extractAndPersist('Caso clínico.', 'session-bad')).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd C:/freela/projects/.worktrees/conduta-build/conduta/backend
npx jest src/__tests__/knowledge-extractor.test.js --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `backend/src/services/knowledge-extractor.js`**

```js
/**
 * knowledge-extractor.js
 *
 * Async service that extracts clinical entities from an LLM response text
 * and persists them as status:"pending" nodes in Neo4j for admin review.
 *
 * Called fire-and-forget from analyze.js — never throws to the caller.
 */
const OpenAI = require('openai');
const driver = require('../db/neo4j');

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'Conduta',
  },
});

const EXTRACTION_SYSTEM = `Você é um extrator de entidades clínicas. 
Dado um texto clínico em português, extraia APENAS entidades que sejam realmente novas informações clínicas — diagnósticos, medicamentos e relações de tratamento.
Retorne SOMENTE JSON válido com o seguinte schema, sem nenhum texto extra:
{
  "diagnosticos": [{ "nome": string, "cid": string|null, "sinonimos": string[], "redFlags": string[], "excluir": string[] }],
  "medicamentos": [{ "nome": string, "classe": string|null, "viaAdmin": string|null }],
  "relacoes": [{ "diagnostico": string, "medicamento": string, "dose": string, "linha": string, "obs": string|null }]
}
Se não houver entidades novas, retorne {"diagnosticos":[],"medicamentos":[],"relacoes":[]}.`;

/**
 * Extracts clinical entities from responseText and persists new ones
 * as pending nodes in Neo4j.
 *
 * @param {string} responseText - Full LLM response content
 * @param {string} sessionId    - PostgreSQL session ID (for traceability)
 */
async function extractAndPersist(responseText, sessionId) {
  const session = driver.session();
  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-5',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        { role: 'user', content: responseText },
      ],
      stream: false,
    });

    const raw = completion.choices[0]?.message?.content || '';
    let extracted;
    try {
      extracted = JSON.parse(raw);
    } catch {
      console.warn('[extractor] Resposta do LLM não é JSON válido — ignorando.');
      return;
    }

    const { diagnosticos = [], medicamentos = [], relacoes = [] } = extracted;
    const now = new Date().toISOString();

    // Persist pending Diagnostico nodes
    for (const d of diagnosticos) {
      if (!d.nome) continue;
      const exists = await session.run(
        `MATCH (n:Diagnostico {nome: $nome}) RETURN n.status AS status LIMIT 1`,
        { nome: d.nome }
      );
      if (exists.records.length > 0) continue; // already exists (verified or pending)

      await session.run(
        `CREATE (n:Diagnostico {
           nome: $nome, cid: $cid, sinonimos: $sinonimos,
           status: 'pending', sourceSessionId: $sourceSessionId, createdAt: $createdAt
         })`,
        {
          nome: d.nome,
          cid: d.cid || '',
          sinonimos: d.sinonimos || [],
          sourceSessionId: sessionId,
          createdAt: now,
        }
      );
    }

    // Persist pending Medicamento nodes
    for (const m of medicamentos) {
      if (!m.nome) continue;
      const exists = await session.run(
        `MATCH (n:Medicamento {nome: $nome}) RETURN n.status AS status LIMIT 1`,
        { nome: m.nome }
      );
      if (exists.records.length > 0) continue;

      await session.run(
        `CREATE (n:Medicamento {
           nome: $nome, classe: $classe, viaAdmin: $viaAdmin,
           status: 'pending', sourceSessionId: $sourceSessionId, createdAt: $createdAt
         })`,
        {
          nome: m.nome,
          classe: m.classe || '',
          viaAdmin: m.viaAdmin || '',
          sourceSessionId: sessionId,
          createdAt: now,
        }
      );
    }

    // Persist pending TRATA_COM relationships (only if both nodes exist)
    for (const rel of relacoes) {
      if (!rel.diagnostico || !rel.medicamento) continue;
      await session.run(
        `MATCH (d:Diagnostico {nome: $diagnostico})
         MATCH (m:Medicamento {nome: $medicamento})
         MERGE (d)-[r:TRATA_COM]->(m)
         ON CREATE SET r.dose = $dose, r.linha = $linha, r.obs = $obs,
                       r.status = 'pending', r.sourceSessionId = $sourceSessionId, r.createdAt = $createdAt
         ON MATCH SET r.status = CASE WHEN r.status IS NULL THEN 'pending' ELSE r.status END`,
        {
          diagnostico: rel.diagnostico,
          medicamento: rel.medicamento,
          dose: rel.dose || '',
          linha: rel.linha || '',
          obs: rel.obs || '',
          sourceSessionId: sessionId,
          createdAt: now,
        }
      );
    }

    const total = diagnosticos.length + medicamentos.length + relacoes.length;
    if (total > 0) {
      console.log(`[extractor] session ${sessionId}: ${diagnosticos.length} diagnósticos, ${medicamentos.length} medicamentos, ${relacoes.length} relações pendentes criados.`);
    }
  } catch (err) {
    console.error('[extractor] Erro (non-fatal):', err.message);
  } finally {
    await session.close();
  }
}

module.exports = { extractAndPersist };
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd C:/freela/projects/.worktrees/conduta-build/conduta/backend
npx jest src/__tests__/knowledge-extractor.test.js --no-coverage
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd C:/freela/projects/.worktrees/conduta-build
git add conduta/backend/src/services/knowledge-extractor.js conduta/backend/src/__tests__/knowledge-extractor.test.js
git commit -m "feat(extractor): async knowledge extraction service with pending node creation"
```

---

## Task 5: Trigger extractor in `analyze.js`

**Files:**
- Modify: `backend/src/routes/analyze.js`

- [ ] **Step 1: Add extractor import and fire-and-forget call**

Open `backend/src/routes/analyze.js`. Add the import at the top:

Old first lines:
```js
const express = require('express');
const pool = require('../db/pg');
const authMiddleware = require('../middleware/auth');
const { streamAnalysis } = require('../services/openrouter');
const { searchClinicalContext } = require('../services/neo4j-search');
const { searchSimilarCases } = require('../services/case-search');
```

New:
```js
const express = require('express');
const pool = require('../db/pg');
const authMiddleware = require('../middleware/auth');
const { streamAnalysis } = require('../services/openrouter');
const { searchClinicalContext } = require('../services/neo4j-search');
const { searchSimilarCases } = require('../services/case-search');
const { extractAndPersist } = require('../services/knowledge-extractor');
```

Then find the block that persists the assistant response (around line 65):

Old:
```js
    // Persiste resposta do assistente após stream terminar
    if (fullResponse) {
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [session_id, 'assistant', fullResponse]
      );
    }
```

New:
```js
    // Persiste resposta do assistente após stream terminar
    if (fullResponse) {
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [session_id, 'assistant', fullResponse]
      );

      // Extração assíncrona de entidades clínicas — fire-and-forget (não bloqueia resposta)
      extractAndPersist(fullResponse, session_id).catch((err) =>
        console.error('[analyze] extractor fire-and-forget error:', err.message)
      );
    }
```

- [ ] **Step 2: Run existing tests to confirm nothing broke**

```bash
cd C:/freela/projects/.worktrees/conduta-build/conduta/backend
npx jest --no-coverage --runInBand
```

Expected: all existing tests PASS (health, auth, sessions).

- [ ] **Step 3: Commit**

```bash
cd C:/freela/projects/.worktrees/conduta-build
git add conduta/backend/src/routes/analyze.js
git commit -m "feat(analyze): trigger knowledge extractor fire-and-forget after each response"
```

---

## Task 6: Admin knowledge API routes

**Files:**
- Create: `backend/src/routes/admin-knowledge.js`
- Create: `backend/src/__tests__/admin-knowledge.test.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Write failing tests**

Create `backend/src/__tests__/admin-knowledge.test.js`:

```js
const request = require('supertest');

const mockRun = jest.fn();
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.mock('../db/neo4j', () => ({
  session: jest.fn(() => ({ run: mockRun, close: mockClose })),
}));

const app = require('../app');

const ADMIN_SECRET = 'test-admin-secret';
process.env.ADMIN_SECRET = ADMIN_SECRET;

beforeEach(() => {
  mockRun.mockReset();
});

describe('GET /admin/knowledge/pending', () => {
  it('retorna 403 sem header de admin', async () => {
    const res = await request(app).get('/admin/knowledge/pending');
    expect(res.status).toBe(403);
  });

  it('retorna lista de itens pendentes', async () => {
    mockRun.mockResolvedValueOnce({
      records: [
        {
          get: (k) => ({
            tipo: 'Diagnostico',
            elementId: 'elem-1',
            nome: 'Diagnóstico Novo',
            cid: 'X01',
            sourceSessionId: 'sess-1',
            createdAt: '2026-04-05T10:00:00.000Z',
          }[k]),
        },
      ],
    });

    const res = await request(app)
      .get('/admin/knowledge/pending')
      .set('x-admin-secret', ADMIN_SECRET);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ tipo: 'Diagnostico', nome: 'Diagnóstico Novo' });
  });
});

describe('POST /admin/knowledge/:elementId/approve', () => {
  it('retorna 403 sem header de admin', async () => {
    const res = await request(app).post('/admin/knowledge/elem-1/approve');
    expect(res.status).toBe(403);
  });

  it('aprova o item e retorna 200', async () => {
    mockRun.mockResolvedValueOnce({ records: [{ get: () => 'Diagnostico' }] });
    mockRun.mockResolvedValueOnce({ summary: { counters: { updates: () => ({ propertiesSet: 3 }) } } });

    const res = await request(app)
      .post('/admin/knowledge/elem-abc/approve')
      .set('x-admin-secret', ADMIN_SECRET)
      .send({ approvedBy: 'user-1' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ approved: true });
  });
});

describe('DELETE /admin/knowledge/:elementId', () => {
  it('retorna 403 sem header de admin', async () => {
    const res = await request(app).delete('/admin/knowledge/elem-1');
    expect(res.status).toBe(403);
  });

  it('rejeita (remove) o item e retorna 200', async () => {
    mockRun.mockResolvedValueOnce({ summary: {} });

    const res = await request(app)
      .delete('/admin/knowledge/elem-abc')
      .set('x-admin-secret', ADMIN_SECRET);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ rejected: true });
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd C:/freela/projects/.worktrees/conduta-build/conduta/backend
npx jest src/__tests__/admin-knowledge.test.js --no-coverage
```

Expected: FAIL — routes not found (404).

- [ ] **Step 3: Create `backend/src/routes/admin-knowledge.js`**

```js
const express = require('express');
const driver = require('../db/neo4j');

const router = express.Router();

function adminAuth(req, res, next) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  next();
}

/**
 * GET /admin/knowledge/pending
 * Returns all pending Diagnostico and Medicamento nodes.
 */
router.get('/pending', adminAuth, async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      CALL {
        MATCH (n:Diagnostico {status: 'pending'})
        RETURN 'Diagnostico' AS tipo, elementId(n) AS elementId,
               n.nome AS nome, n.cid AS cid,
               n.sourceSessionId AS sourceSessionId, n.createdAt AS createdAt
        UNION ALL
        MATCH (n:Medicamento {status: 'pending'})
        RETURN 'Medicamento' AS tipo, elementId(n) AS elementId,
               n.nome AS nome, '' AS cid,
               n.sourceSessionId AS sourceSessionId, n.createdAt AS createdAt
      }
      RETURN tipo, elementId, nome, cid, sourceSessionId, createdAt
      ORDER BY createdAt DESC
    `);

    const items = result.records.map((r) => ({
      tipo: r.get('tipo'),
      elementId: r.get('elementId'),
      nome: r.get('nome'),
      cid: r.get('cid') || null,
      sourceSessionId: r.get('sourceSessionId'),
      createdAt: r.get('createdAt'),
    }));

    res.json(items);
  } catch (err) {
    console.error('Erro ao listar pendentes:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

/**
 * POST /admin/knowledge/:elementId/approve
 * Approves a pending node (sets status to 'verified').
 * Body: { approvedBy: string }
 */
router.post('/:elementId/approve', adminAuth, async (req, res) => {
  const { elementId } = req.params;
  const { approvedBy } = req.body;
  const session = driver.session();

  try {
    // Find the node by elementId (works for both Diagnostico and Medicamento)
    const find = await session.run(
      `MATCH (n) WHERE elementId(n) = $elementId AND n.status = 'pending'
       RETURN labels(n)[0] AS label LIMIT 1`,
      { elementId }
    );

    if (find.records.length === 0) {
      return res.status(404).json({ error: 'Item pendente não encontrado.' });
    }

    await session.run(
      `MATCH (n) WHERE elementId(n) = $elementId
       SET n.status = 'verified', n.approvedBy = $approvedBy, n.approvedAt = $approvedAt`,
      { elementId, approvedBy: approvedBy || 'admin', approvedAt: new Date().toISOString() }
    );

    res.json({ approved: true, elementId });
  } catch (err) {
    console.error('Erro ao aprovar:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

/**
 * DELETE /admin/knowledge/:elementId
 * Rejects (deletes) a pending node.
 */
router.delete('/:elementId', adminAuth, async (req, res) => {
  const { elementId } = req.params;
  const session = driver.session();

  try {
    await session.run(
      `MATCH (n) WHERE elementId(n) = $elementId AND n.status = 'pending'
       DETACH DELETE n`,
      { elementId }
    );

    res.json({ rejected: true, elementId });
  } catch (err) {
    console.error('Erro ao rejeitar:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    await session.close();
  }
});

module.exports = router;
```

- [ ] **Step 4: Register the router in `app.js`**

Open `backend/src/app.js`. Add the import and mount:

Old:
```js
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const sessionsRoutes = require('./routes/sessions');
const analyzeRoutes = require('./routes/analyze');
const feedbackRoutes = require('./routes/feedback');
```

New:
```js
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const adminKnowledgeRoutes = require('./routes/admin-knowledge');
const sessionsRoutes = require('./routes/sessions');
const analyzeRoutes = require('./routes/analyze');
const feedbackRoutes = require('./routes/feedback');
```

Old mount:
```js
app.use('/admin', adminRoutes);
```

New:
```js
app.use('/admin', adminRoutes);
app.use('/admin/knowledge', adminKnowledgeRoutes);
```

- [ ] **Step 5: Run all tests**

```bash
cd C:/freela/projects/.worktrees/conduta-build/conduta/backend
npx jest --no-coverage --runInBand
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
cd C:/freela/projects/.worktrees/conduta-build
git add conduta/backend/src/routes/admin-knowledge.js conduta/backend/src/__tests__/admin-knowledge.test.js conduta/backend/src/app.js
git commit -m "feat(admin): knowledge review API — list pending, approve, reject nodes"
```

---

## Task 7: Frontend `/admin/knowledge` page

**Files:**
- Modify: `frontend/src/services/api.js`
- Create: `frontend/src/pages/AdminKnowledge.jsx`
- Create: `frontend/src/pages/AdminKnowledge.module.scss`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add admin knowledge API functions to `api.js`**

Open `frontend/src/services/api.js`. Append at the end:

```js
// ── Admin Knowledge ────────────────────────────────────────────

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || '';

function adminHeaders() {
  return { 'x-admin-secret': ADMIN_SECRET };
}

export async function getPendingKnowledge() {
  const res = await fetch(`${BASE_URL}/admin/knowledge/pending`, {
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao buscar pendentes.');
  return res.json();
}

export async function approveKnowledge(elementId) {
  const res = await fetch(`${BASE_URL}/admin/knowledge/${elementId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ approvedBy: 'admin' }),
  });
  if (!res.ok) throw new Error('Erro ao aprovar.');
  return res.json();
}

export async function rejectKnowledge(elementId) {
  const res = await fetch(`${BASE_URL}/admin/knowledge/${elementId}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao rejeitar.');
  return res.json();
}
```

- [ ] **Step 2: Create `frontend/src/pages/AdminKnowledge.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { getPendingKnowledge, approveKnowledge, rejectKnowledge } from '../services/api';
import styles from './AdminKnowledge.module.scss';

export default function AdminKnowledge() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(new Set());

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingKnowledge();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(elementId) {
    setProcessing((prev) => new Set(prev).add(elementId));
    try {
      await approveKnowledge(elementId);
      setItems((prev) => prev.filter((i) => i.elementId !== elementId));
    } catch (err) {
      alert('Erro ao aprovar: ' + err.message);
    } finally {
      setProcessing((prev) => { const s = new Set(prev); s.delete(elementId); return s; });
    }
  }

  async function handleReject(elementId) {
    if (!confirm('Rejeitar e remover este item?')) return;
    setProcessing((prev) => new Set(prev).add(elementId));
    try {
      await rejectKnowledge(elementId);
      setItems((prev) => prev.filter((i) => i.elementId !== elementId));
    } catch (err) {
      alert('Erro ao rejeitar: ' + err.message);
    } finally {
      setProcessing((prev) => { const s = new Set(prev); s.delete(elementId); return s; });
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Base de Conhecimento</h1>
        <span className={styles.badge}>{items.length} pendentes</span>
        <button className={styles.refreshBtn} onClick={load} disabled={loading}>
          Atualizar
        </button>
      </header>

      {loading && <p className={styles.info}>Carregando...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && items.length === 0 && (
        <p className={styles.info}>Nenhum item pendente de revisão.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Nome</th>
              <th>CID</th>
              <th>Origem</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.elementId} className={processing.has(item.elementId) ? styles.dimmed : ''}>
                <td>
                  <span className={`${styles.tag} ${styles[item.tipo.toLowerCase()]}`}>
                    {item.tipo}
                  </span>
                </td>
                <td className={styles.nome}>{item.nome}</td>
                <td className={styles.cid}>{item.cid || '—'}</td>
                <td className={styles.session}>{item.sourceSessionId || '—'}</td>
                <td className={styles.date}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className={styles.actions}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleApprove(item.elementId)}
                    disabled={processing.has(item.elementId)}
                  >
                    Aprovar
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handleReject(item.elementId)}
                    disabled={processing.has(item.elementId)}
                  >
                    Rejeitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/pages/AdminKnowledge.module.scss`**

```scss
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Inter', 'IBM Plex Sans', sans-serif;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  h1 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a2332;
    margin: 0;
  }
}

.badge {
  background: #e8f0fe;
  color: #1a56db;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.refreshBtn {
  margin-left: auto;
  padding: 0.4rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover:not(:disabled) {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;

  th {
    text-align: left;
    padding: 0.5rem 0.75rem;
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
    font-weight: 600;
    color: #374151;
  }

  td {
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid #f0f0f0;
    color: #1f2937;
  }

  tr:hover td {
    background: #fafafa;
  }
}

.dimmed td {
  opacity: 0.4;
}

.tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;

  &.diagnostico {
    background: #fef3c7;
    color: #92400e;
  }

  &.medicamento {
    background: #d1fae5;
    color: #065f46;
  }
}

.nome {
  font-weight: 500;
}

.cid, .session {
  font-size: 0.8rem;
  color: #6b7280;
}

.date {
  white-space: nowrap;
  color: #9ca3af;
  font-size: 0.8rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.approveBtn, .rejectBtn {
  padding: 0.3rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.approveBtn {
  background: #065f46;
  color: white;

  &:hover:not(:disabled) {
    background: #047857;
  }
}

.rejectBtn {
  background: #fee2e2;
  color: #991b1b;

  &:hover:not(:disabled) {
    background: #fecaca;
  }
}

.info {
  color: #6b7280;
  font-size: 0.9rem;
}

.error {
  color: #991b1b;
  background: #fee2e2;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
}
```

- [ ] **Step 4: Register route in `App.jsx`**

Open `frontend/src/App.jsx`. Import the page and add the route:

Old:
```jsx
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
```

New:
```jsx
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminKnowledge from './pages/AdminKnowledge';
```

Old routes:
```jsx
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
```

New routes:
```jsx
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/admin/knowledge" element={<AdminKnowledge />} />
          <Route path="*" element={<Navigate to="/" replace />} />
```

- [ ] **Step 5: Add `VITE_ADMIN_SECRET` to `.env.example` (if one exists) or document in README**

Check if `frontend/.env` or `frontend/.env.example` exists. If yes, add:
```
VITE_ADMIN_SECRET=your-admin-secret-here
```
If neither exists, skip — the page will simply send an empty secret in development.

- [ ] **Step 6: Run backend tests one final time to confirm clean state**

```bash
cd C:/freela/projects/.worktrees/conduta-build/conduta/backend
npx jest --no-coverage --runInBand
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
cd C:/freela/projects/.worktrees/conduta-build
git add conduta/frontend/src/services/api.js conduta/frontend/src/pages/AdminKnowledge.jsx conduta/frontend/src/pages/AdminKnowledge.module.scss conduta/frontend/src/App.jsx
git commit -m "feat(frontend): admin knowledge review page at /admin/knowledge"
```

---

## Post-implementation: Run migrations and seed

After all tasks are complete, with the Docker services running:

```bash
# 1. Run seed (applies expanded UPA data with status:verified)
cd conduta/backend && npm run seed:neo4j

# 2. Run Neo4j status migration (patches any pre-existing nodes without status)
npm run migrate:neo4j
```

Verify in Neo4j Browser:
```cypher
MATCH (n) WHERE n.status IS NULL RETURN count(n)
// Expected: 0
MATCH (n:Diagnostico {status:'verified'}) RETURN count(n)
// Expected: ~75
```

const OpenAI = require('openai');

// Campos do rascunho, espelhando os blocos I, III, V, VI e VII da DO (modelo SIM/MS).
const CAMPOS_TEXTO = [
  'tipo_obito', 'data_obito', 'hora_obito', 'nome', 'sexo', 'idade', 'data_nascimento', 'raca_cor',
  'local_ocorrencia', 'estabelecimento',
  'gestacao_puerperio', 'assistencia_medica', 'necropsia',
  'medico_nome', 'medico_crm', 'atestante',
  'causa_externa_tipo', 'causa_externa_descricao',
];
const LINHAS_PARTE1 = 4; // a, b, c, d
const LINHAS_PARTE2 = 2;

const DO_PROMPT = `Você auxilia um médico a preencher o RASCUNHO da Declaração de Óbito (DO) brasileira (modelo do SIM/Ministério da Saúde), a partir da conversa clínica fornecida.

Responda SOMENTE com um objeto JSON válido, sem markdown, com exatamente estas chaves:
{
  "tipo_obito": "nao_fetal" | "fetal" | "",
  "data_obito": "DD/MM/AAAA ou vazio",
  "hora_obito": "HH:MM ou vazio",
  "nome": "", "sexo": "masculino" | "feminino" | "ignorado" | "",
  "idade": "ex.: 67 anos", "data_nascimento": "", "raca_cor": "",
  "local_ocorrencia": "hospital" | "outro_estabelecimento" | "domicilio" | "via_publica" | "outros" | "",
  "estabelecimento": "",
  "gestacao_puerperio": "somente se mulher 10-49 anos: 'gestação', 'parto', 'aborto', 'até 42 dias após', '43 dias a 1 ano após', 'não' ou vazio",
  "assistencia_medica": "sim" | "nao" | "ignorado" | "",
  "necropsia": "sim" | "nao" | "ignorado" | "",
  "parte1": [{"causa": "", "intervalo": "", "cid": ""}, ... exatamente 4 itens, linhas a, b, c, d],
  "parte2": [{"causa": "", "intervalo": "", "cid": ""}, ... até 2 itens],
  "medico_nome": "", "medico_crm": "",
  "atestante": "assistente" | "substituto" | "iml" | "svo" | "outro" | "",
  "causa_externa_tipo": "acidente" | "suicidio" | "homicidio" | "outros" | "ignorado" | "",
  "causa_externa_descricao": "",
  "alertas": ["..."]
}

Regras de preenchimento da Parte I (Bloco V):
- Linha (a) = causa terminal/imediata. A ÚLTIMA linha preenchida = CAUSA BÁSICA (a doença ou lesão que iniciou a cadeia).
- Cada linha deve ser consequência da linha abaixo. Uma única causa por linha. Linhas não usadas ficam vazias.
- "intervalo" = tempo aproximado entre o início daquela condição e o óbito (ex.: "2 dias", "10 anos").
- "cid" = sugestão de código CID-10 mais específico possível.
- Parte II = outras condições significativas que contribuíram para o óbito mas não entram na cadeia da Parte I.

Regras obrigatórias:
- Use SOMENTE informações presentes na conversa. Nunca invente nome, datas, horários, CRM ou dados pessoais — deixe vazio.
- Campo não informado = string vazia. Não use "ignorado" por falta de dado — o médico decide isso no formulário.
- Se a conversa não indicar óbito, preencha só o que for possível e inclua alerta "A sessão não registra o óbito — confirme antes de usar."
- NUNCA use modos de morrer como causa isolada (parada cardiorrespiratória, falência de múltiplos órgãos, insuficiência respiratória sem etiologia). Se só houver isso, deixe a linha vazia e gere alerta.
- Suspeita de causa externa (trauma, acidente, violência, intoxicação, suicídio, afogamento, queda) → preencha Bloco VII e inclua alerta: "Suspeita de causa externa: a DO deve ser emitida pelo IML, não pelo médico assistente."
- Óbito sem assistência médica e sem causa definida → alerta sobre encaminhamento ao SVO, quando disponível.
- Em "alertas", liste também os dados essenciais faltantes para completar a DO. Frases curtas, em português do Brasil.`;

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('[declaracao-obito] OPENROUTER_API_KEY não definido');
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Conduta',
    },
  });
}

function texto(v, max = 300) {
  return typeof v === 'string' || typeof v === 'number' ? String(v).trim().slice(0, max) : '';
}

function linhas(arr, n) {
  const src = Array.isArray(arr) ? arr : [];
  return Array.from({ length: n }, (_, i) => ({
    causa: texto(src[i]?.causa),
    intervalo: texto(src[i]?.intervalo, 60),
    cid: texto(src[i]?.cid, 10),
  }));
}

// Garante o formato completo mesmo se o modelo omitir ou deformar chaves.
function normalizarDO(raw = {}) {
  const out = {};
  for (const campo of CAMPOS_TEXTO) out[campo] = texto(raw[campo]);
  out.parte1 = linhas(raw.parte1, LINHAS_PARTE1);
  out.parte2 = linhas(raw.parte2, LINHAS_PARTE2);
  out.alertas = (Array.isArray(raw.alertas) ? raw.alertas : []).map((a) => texto(a, 400)).filter(Boolean).slice(0, 12);
  return out;
}

function extrairJSON(conteudo) {
  const inicio = conteudo.indexOf('{');
  const fim = conteudo.lastIndexOf('}');
  if (inicio === -1 || fim <= inicio) throw new Error('[declaracao-obito] resposta sem JSON');
  return JSON.parse(conteudo.slice(inicio, fim + 1));
}

async function gerarDeclaracaoObito(messages) {
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'MÉDICO' : 'ANÁLISE'}:\n${m.content}`)
    .join('\n\n---\n\n')
    .slice(-12000); // o desfecho costuma estar no fim da sessão

  const completion = await getClient().chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
    messages: [
      { role: 'system', content: DO_PROMPT },
      { role: 'user', content: transcript },
    ],
    stream: false,
    temperature: 0,
  });

  return normalizarDO(extrairJSON(completion.choices[0]?.message?.content || ''));
}

module.exports = { gerarDeclaracaoObito, normalizarDO, extrairJSON, DO_PROMPT };

const OpenAI = require('openai');

const TOOL_NAMES = {
  clarifying_questions: 'Perguntas que podem mudar a análise',
  evolution_comparison: 'Comparar evolução',
  handoff: 'Passagem de caso',
  medication_review: 'Revisão medicamentosa',
};

const TOOL_INSTRUCTIONS = {
  clarifying_questions: `Gere até cinco perguntas de alto impacto que o médico poderia responder para mudar a prioridade, o diferencial, a investigação ou o encaminhamento. Para cada pergunta, explique em uma frase por que ela importa. Não transforme a pergunta em diagnóstico ou prescrição.`,
  evolution_comparison: `Compare o primeiro relato com as informações mais recentes da sessão. Organize em: o que mudou, como isso pode alterar a revisão, quais alertas ganharam ou perderam prioridade e o que ainda precisa ser conferido. Não declare diagnóstico definitivo.`,
  handoff: `Gere um resumo de passagem de caso para discussão com outro profissional. Inclua motivo da discussão, dados clínicos relevantes, hipóteses em revisão, alertas, medidas já consideradas, pendências e a pergunta principal para o profissional que receberá o caso. Não invente dados ausentes.`,
  medication_review: `Faça uma revisão estruturada de segurança medicamentosa. Organize os medicamentos e fatores informados, pontos para conferir, possíveis contraindicações ou interações que dependam de confirmação, dados ausentes antes de decidir e fontes/protocolos que devem ser consultados. Não prescreva, não escolha tratamento e não invente dose.`,
};

const MAX_CONTENT = 7000;
const MAX_MESSAGES = 12;

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('[clinical-tools] OPENROUTER_API_KEY não definido');
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

function invalidToolError() {
  const error = new Error('Ferramenta clínica inválida.');
  error.code = 'INVALID_CLINICAL_TOOL';
  return error;
}

function normalizeDetails(details = {}) {
  return {
    medications: String(details.medications || '').trim().slice(0, 1200),
    allergies: String(details.allergies || '').trim().slice(0, 800),
    pregnancy: String(details.pregnancy || '').trim().slice(0, 500),
    renalHepatic: String(details.renalHepatic || '').trim().slice(0, 800),
    otherFactors: String(details.otherFactors || '').trim().slice(0, 1000),
  };
}

function formatMessages(messages = []) {
  return messages
    .slice(-MAX_MESSAGES)
    .map((message) => `${message.role === 'assistant' ? 'ASSISTENTE' : 'MÉDICO'}:\n${String(message.content || '').slice(0, 2500)}`)
    .join('\n\n---\n\n')
    .slice(0, MAX_CONTENT);
}

function buildClinicalToolPrompt(tool, details = {}, messages = []) {
  if (!TOOL_NAMES[tool]) throw invalidToolError();

  const normalized = normalizeDetails(details);
  const history = formatMessages(messages) || 'Nenhuma mensagem de sessão disponível.';
  let specificContext = '';

  if (tool === 'medication_review') {
    specificContext = `\n\nFatores informados pelo profissional:\n- Medicamentos em uso: ${normalized.medications || 'não informado'}\n- Alergias: ${normalized.allergies || 'não informado'}\n- Gestação/lactação: ${normalized.pregnancy || 'não informado'}\n- Função renal/hepática: ${normalized.renalHepatic || 'não informado'}\n- Outros fatores relevantes: ${normalized.otherFactors || 'não informado'}`;
  }

  return `Ferramenta solicitada: ${TOOL_NAMES[tool]}.

${TOOL_INSTRUCTIONS[tool]}

Regras obrigatórias:
- Você está apoiando um médico, não atendendo um paciente diretamente.
- Use apenas os dados presentes no caso e identifique o que não foi informado.
- não substitua julgamento médico, exame físico, protocolo local ou fonte oficial.
- não substitua a decisão clínica e não use linguagem de certeza absoluta.
- Não apresente uma recomendação como ordem ou prescrição definitiva.
- Responda em português do Brasil, em Markdown claro e conciso.

Histórico da sessão:
${history}${specificContext}`;
}

async function generateClinicalTool(tool, messages = [], details = {}) {
  if (!TOOL_NAMES[tool]) throw invalidToolError();

  const client = getClient();
  const completion = await client.chat.completions.create({
    model: process.env.OPENROUTER_REVIEW_MODEL || process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Você é um assistente de apoio ao raciocínio clínico para médicos. Seja seguro, explícito sobre incertezas e não substitua a decisão clínica.',
      },
      { role: 'user', content: buildClinicalToolPrompt(tool, details, messages) },
    ],
    stream: false,
    temperature: 0.2,
  });

  return completion.choices[0]?.message?.content || 'Não foi possível gerar a ferramenta solicitada.';
}

module.exports = {
  TOOL_NAMES,
  buildClinicalToolPrompt,
  generateClinicalTool,
};

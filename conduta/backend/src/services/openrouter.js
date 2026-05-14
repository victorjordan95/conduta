const OpenAI = require('openai');
const SYSTEM_PROMPT = require('../config/system-prompt');

const REVIEW_PROMPT = `Você é um médico revisor clínico sênior.

Receberá um caso clínico e uma análise inicial gerada por IA. Produza uma análise clínica revisada e mais sólida.

Regras:
- Mantenha a formatação Markdown (##, ###, listas, negrito)
- Corrija imprecisões clínicas e preencha lacunas importantes
- Se a análise original estiver correta em algum ponto, pode confirmar ou resumir
- Adicione o que ficou faltando: sepse, encaminhamento, contraindicações, complicações vs. diferenciais
- Seja objetivo e direto — médico para médico
- Priorize sempre a segurança do paciente

Comece sua resposta com: ## Análise Revisada`;

const MAX_HISTORY_MESSAGES = 6;

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('[openrouter] OPENROUTER_API_KEY não definido');
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

function buildMessages(history, newMessage, neo4jContext, sessionSummary) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (neo4jContext) {
    messages.push({
      role: 'system',
      content: `Contexto da base de conhecimento clínica:\n${neo4jContext}`,
    });
  }

  if (sessionSummary) {
    const alertas = (sessionSummary.alertas || []).join('; ') || 'Nenhum';
    messages.push({
      role: 'system',
      content: `Contexto clínico desta sessão:\n• Hipótese principal: ${sessionSummary.hipotese}\n• Conduta definida: ${sessionSummary.conduta}\n• Alertas ativos: ${alertas}\n\nResponda DIRETAMENTE a pergunta do médico com base neste contexto.`,
    });
  }

  // Trunca apenas quando há summary para ancorar o contexto clínico.
  // Sessões novas (summary null) têm poucos tokens — envio completo é seguro.
  const recentHistory = sessionSummary
    ? history.slice(-MAX_HISTORY_MESSAGES)
    : history;

  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: 'user', content: newMessage });

  return messages;
}

async function streamAnalysis(history, newMessage, neo4jContext, sessionSummary, res) {
  const messages = buildMessages(history, newMessage, neo4jContext, sessionSummary);

  const client = getClient();
  const MAX_RETRIES = 3;
  let stream;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      stream = await client.chat.completions.create({
        model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
        messages,
        stream: true,
      });
      break;
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 429 && attempt < MAX_RETRIES) {
        const delay = attempt * 2000;
        console.warn(`[openrouter] 429 rate limit, tentativa ${attempt}/${MAX_RETRIES}, aguardando ${delay}ms…`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }

  if (!res.headersSent) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  }

  let fullContent = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullContent += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  return fullContent;
}

async function streamReview(userCase, firstAnalysis, res) {
  const client = getClient();

  const stream = await client.chat.completions.create({
    model: process.env.OPENROUTER_REVIEW_MODEL || 'openai/gpt-4o',
    messages: [
      { role: 'system', content: REVIEW_PROMPT },
      {
        role: 'user',
        content: `## Caso Clínico\n${userCase}\n\n## Análise Inicial\n${firstAnalysis}`,
      },
    ],
    stream: true,
  });

  let fullReview = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullReview += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  return fullReview;
}

module.exports = { streamAnalysis, streamReview, buildMessages };

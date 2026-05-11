const OpenAI = require('openai');
const SYSTEM_PROMPT = require('../config/system-prompt');

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

  res.write('data: [DONE]\n\n');
  res.end();

  return fullContent;
}

module.exports = { streamAnalysis, buildMessages };

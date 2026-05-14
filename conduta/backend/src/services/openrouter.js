const OpenAI = require('openai');
const SYSTEM_PROMPT = require('../config/system-prompt');

const REVIEW_PROMPT = `Você é um médico clínico experiente que produz análises clínicas completas para outros médicos.

Você receberá um caso clínico e um raciocínio clínico interno (rascunho preliminar). Use-o como base para produzir uma análise final polida e completa — como se fosse a ÚNICA análise que o médico solicitante verá.

Regras absolutas:
- NUNCA mencione "análise inicial", "análise revisada", "revisão", "rascunho" ou qualquer referência ao processo interno
- Escreva diretamente como médico apresentando sua análise — sem meta-comentários sobre o processo
- Mantenha a formatação Markdown (##, ###, listas, negrito)
- Corrija imprecisões clínicas e preencha lacunas do raciocínio interno
- Inclua: hipótese principal, diferenciais, conduta, medicamentos com doses, alertas de segurança
- Adicione o que ficou faltando: critérios de sepse, encaminhamento, contraindicações, complicações vs. diferenciais
- Seja objetivo e direto — médico para médico
- Priorize sempre a segurança do paciente`;

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

const COLLECT_SUFFIX = '\n\nResponda de forma direta e sem formatação — apenas o raciocínio clínico bruto. Será usado como contexto interno para uma segunda análise.';

async function collectAnalysis(history, newMessage, neo4jContext, sessionSummary) {
  const messages = buildMessages(history, newMessage, neo4jContext, sessionSummary);
  // Instrui o modelo a não formatar — a resposta é contexto interno, não visível ao usuário
  const last = messages[messages.length - 1];
  messages[messages.length - 1] = { ...last, content: last.content + COLLECT_SUFFIX };
  const client = getClient();

  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
        messages,
        stream: false,
      });
      return completion.choices[0]?.message?.content || '';
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
}

async function streamReview(userCase, firstAnalysis, res) {
  const client = getClient();

  const stream = await client.chat.completions.create({
    model: process.env.OPENROUTER_REVIEW_MODEL || 'openai/gpt-4o',
    messages: [
      { role: 'system', content: REVIEW_PROMPT },
      {
        role: 'user',
        content: `## Caso Clínico\n${userCase}\n\n## Raciocínio Interno (use como base, não cite)\n${firstAnalysis}`,
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

module.exports = { collectAnalysis, streamReview, buildMessages };

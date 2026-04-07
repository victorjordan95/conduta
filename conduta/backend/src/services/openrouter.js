const OpenAI = require('openai');
const SYSTEM_PROMPT = require('../config/system-prompt');

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'Conduta',
  },
});

/**
 * Faz streaming de análise clínica via SSE.
 * @param {Array<{role: string, content: string}>} history
 * @param {string} newMessage
 * @param {string|null} neo4jContext
 * @param {import('express').Response} res
 * @returns {Promise<string>} fullContent acumulado
 */
async function streamAnalysis(history, newMessage, neo4jContext, res) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (neo4jContext) {
    messages.push({
      role: 'system',
      content: `Contexto da base de conhecimento clínica:\n${neo4jContext}`,
    });
  }

  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: 'user', content: newMessage });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const stream = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-5',
    messages,
    stream: true,
  });

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

module.exports = { streamAnalysis };

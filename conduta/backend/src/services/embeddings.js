const OpenAI = require('openai');

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('[embeddings] OPENROUTER_API_KEY não definido');
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

async function embed(text) {
  const client = getClient();
  const response = await client.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

module.exports = { embed };

const OpenAI = require('openai');

function getClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('[prontuario] OPENROUTER_API_KEY não definido');
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

const PRONTUARIO_PROMPT = `Você é um médico redigindo evolução para prontuário eletrônico.
A partir da conversa clínica abaixo, produza um resumo objetivo de evolução médica com os blocos:

QUEIXA PRINCIPAL:
DADOS RELEVANTES:
HIPÓTESE DIAGNÓSTICA:
CONDUTA:
ORIENTAÇÕES:

Regras:
- Texto pronto para colar em prontuário eletrônico: SEM markdown, sem #, sem negrito, sem tabelas
- Linguagem técnica padrão de registro médico, frases curtas e objetivas
- Inclua apenas informações presentes na conversa — não invente dados
- Se um bloco não tiver informação, escreva "Não registrado."
- Máximo ~200 palavras`;

async function gerarResumoProntuario(messages) {
  const client = getClient();

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'MÉDICO (caso/pergunta)' : 'ANÁLISE'}:\n${m.content}`)
    .join('\n\n---\n\n')
    .slice(0, 12000);

  const completion = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
    messages: [
      { role: 'system', content: PRONTUARIO_PROMPT },
      { role: 'user', content: transcript },
    ],
    stream: false,
    temperature: 0.2,
  });

  const texto = completion.choices[0]?.message?.content?.trim();
  if (!texto) {
    throw new Error('[prontuario] resposta vazia do modelo');
  }
  return texto;
}

module.exports = { gerarResumoProntuario, PRONTUARIO_PROMPT };

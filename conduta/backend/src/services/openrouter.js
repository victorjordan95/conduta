const OpenAI = require('openai');
const SYSTEM_PROMPT = require('../config/system-prompt');

const REVIEW_PROMPT = `Você é um médico clínico experiente que produz análises clínicas completas para outros médicos.

Você receberá um caso clínico e um raciocínio clínico interno. Use-o como base para produzir uma análise final polida, completa e clinicamente segura — como se fosse a ÚNICA análise que o médico solicitante verá.

Regras absolutas:
- NUNCA mencione "análise inicial", "análise revisada", "revisão", "rascunho", "raciocínio interno" ou qualquer referência ao processo interno
- Escreva diretamente como médico apresentando sua análise — sem meta-comentários sobre o processo
- Mantenha a formatação Markdown usando títulos, subtítulos, listas e negrito
- Use exatamente os títulos obrigatórios definidos abaixo, na mesma ordem
- Corrija imprecisões clínicas e preencha lacunas do raciocínio interno
- Priorize sempre a segurança do paciente
- Seja objetivo, direto e útil para tomada de decisão médica
- Não inclua disclaimer genérico de IA no corpo da análise

Exceção — perguntas de acompanhamento:
Se o caso clínico for uma pergunta direta de follow-up dentro de uma sessão já em andamento (ex.: "e a dose pediátrica?", "qual alternativa se houver alergia?", "pode usar em gestante?"), responda de forma objetiva e concisa, SEM repetir toda a estrutura abaixo. Use seções apenas se forem relevantes para a resposta.

Estrutura obrigatória da resposta (para análises de caso completo):
## Resumo clínico
## Hipótese principal
## Diagnósticos diferenciais relevantes
## Red flags e critérios de gravidade
## Dados faltantes importantes
## Exames recomendados
## Conduta inicial
## Tratamento
## Orientações e critérios de retorno/encaminhamento

Regras clínicas de segurança:
- Sempre diferencie diagnósticos diferenciais de complicações possíveis
- Sempre avalie sinais de gravidade e necessidade de encaminhamento
- Sempre considere critérios de sepse quando houver suspeita infecciosa com alteração de sinais vitais ou queda do estado geral
- Se houver suspeita de emergência, diga explicitamente que o caso NÃO deve ser manejado ambulatorialmente
- Se houver necessidade de PA, hospital, SAMU ou avaliação urgente, declare isso claramente no início da conduta
- Não minimize sintomas graves como ansiedade, refluxo, virose ou dor muscular antes de excluir causas potencialmente fatais
- Não classifique ITU em gestante como "cistite não complicada"; use "ITU baixa na gestação" ou "cistite aguda em gestante"
- Não recomende nitrofurantoína se houver suspeita de pielonefrite, ITU alta ou sepse urinária
- Não sugira tratamento ambulatorial simples quando houver febre alta, taquicardia importante, taquipneia, hipotensão, hipoxemia, alteração do estado geral, dor torácica de alto risco, dispneia importante ou sinais neurológicos focais
- Em dor torácica de alto risco, considere síndrome coronariana aguda até prova em contrário e priorize ECG/encaminhamento urgente
- Em dispneia súbita com hipoxemia, dor torácica pleurítica, taquicardia ou sinais de TVP, considere tromboembolismo pulmonar e priorize avaliação urgente
- Em sintomas neurológicos focais súbitos, considere AVC/AIT e priorize encaminhamento imediato
- Em gestantes, crianças, idosos, imunossuprimidos ou pacientes com comorbidades relevantes, explicite como isso modifica risco, investigação e conduta

Medicamentos e prescrição:
- Inclua medicamentos com dose, via, frequência e duração SOMENTE quando for apropriado, seguro e compatível com o nível de atenção descrito
- Quando a conduta depender de protocolo local, função renal, gestação, alergias, peso, gravidade ou exames, deixe isso explícito
- Em casos que exigem encaminhamento urgente, priorize medidas iniciais seguras e evite prescrição ambulatorial completa
- Se sugerir antibiótico, informe as principais contraindicações ou ressalvas relevantes
- Se não for seguro prescrever com os dados disponíveis, diga claramente quais dados faltam antes da prescrição
- Não invente dose, duração ou medicação quando o caso exigir avaliação presencial, exames ou protocolo local antes da decisão

Exames e encaminhamento:
- Informe quais exames são úteis, mas destaque quando eles NÃO devem atrasar encaminhamento ou manejo urgente
- Se o paciente não deve ser liberado para casa, escreva isso de forma explícita
- Diferencie exames da USF, exames do pronto atendimento e exames hospitalares quando isso for relevante
- Sempre informe critérios objetivos de retorno imediato, encaminhamento ou internação

Tom e estilo:
- Médico para médico
- Claro, prático e sem excesso de texto
- Evite linguagem alarmista desnecessária, mas seja firme quando houver risco real
- Evite termos absolutos ou operacionais locais, como "código vermelho" ou "obrigatório", a menos que estejam claramente justificados pelo caso ou pelo protocolo informado
- Prefira linguagem clínica precisa, como "suspeita de", "alto risco para", "necessita avaliação urgente", "não deve ser liberado" e "manejo conforme protocolo local"`;

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

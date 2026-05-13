const MAPA_LABELS = {
  MEL: 'Melanoma',
  NV: 'Nevo melanocítico',
  BCC: 'Carcinoma basocelular',
  AK: 'Queratose actínica',
  BKL: 'Queratose benigna',
  DF: 'Dermatofibroma',
  VASC: 'Lesão vascular',
};

async function classificar(buffer, mimetype) {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    console.error('[skin-classifier] HF_API_TOKEN não definido');
    const err = new Error('[skin-classifier] HF_API_TOKEN não definido');
    err.status = 502;
    throw err;
  }
  const modelo = process.env.HF_SKIN_MODEL || 'bsenst/skin-cancer-HAM10k';

  console.log(`[skin-classifier] chamando HF API modelo=${modelo} bufferSize=${buffer.length}B`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  let response;
  try {
    response = await fetch(
      `https://api-inference.huggingface.co/models/${modelo}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': mimetype,
        },
        body: buffer,
        signal: controller.signal,
      }
    );
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[skin-classifier] timeout (25s) ao chamar HF API');
      const timeoutErr = new Error('Timeout ao chamar HF API');
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    console.error(`[skin-classifier] erro de rede ao chamar HF API: ${err.message}`);
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  console.log(`[skin-classifier] HF API respondeu status=${response.status}`);

  if (!response.ok) {
    let bodyText = '';
    try { bodyText = await response.text(); } catch (_) {}
    console.error(`[skin-classifier] HF API erro status=${response.status} body=${bodyText}`);
    const err = new Error('Erro ao chamar HF API');
    err.status = response.status === 503 ? 503 : 502;
    throw err;
  }

  const resultados = await response.json();
  console.log(`[skin-classifier] resultados recebidos count=${resultados.length}`);

  const top3 = resultados
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => {
      const nome = MAPA_LABELS[r.label] || r.label;
      const pct = Math.round(r.score * 100);
      return `${nome} (${pct}%)`;
    })
    .join(', ');

  return `Classificação de lesão cutânea (IA): ${top3}\n⚠️ Esta classificação é suporte à decisão clínica e não substitui avaliação dermatológica presencial.`;
}

module.exports = { classificar };

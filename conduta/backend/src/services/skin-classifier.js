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
  const modelo = process.env.HF_SKIN_MODEL || 'bsenst/skin-cancer-HAM10k';
  const token = process.env.HF_API_TOKEN;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${modelo}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': mimetype,
      },
      body: buffer,
    }
  );

  if (!response.ok) {
    const err = new Error('Erro ao chamar HF API');
    err.status = response.status === 503 ? 503 : 502;
    throw err;
  }

  const resultados = await response.json();

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

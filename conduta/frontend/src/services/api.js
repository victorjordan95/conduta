const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('conduta_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email, senha) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });

  if (!res.ok) throw new Error('Credenciais inválidas.');
  return res.json();
}

export async function getSessions() {
  const res = await fetch(`${BASE_URL}/sessions`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao buscar sessões.');
  return res.json();
}

export async function createSession(titulo) {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ titulo }),
  });
  if (!res.ok) throw new Error('Erro ao criar sessão.');
  return res.json();
}

export async function getSession(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao buscar sessão.');
  return res.json();
}

/**
 * Envia caso para análise com streaming SSE.
 * Chama onChunk(string) a cada fragmento recebido.
 */
export async function analyzeCase(sessionId, content, onChunk) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ session_id: sessionId, content }),
  });

  if (!res.ok) throw new Error('Erro ao processar análise.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n').filter((l) => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const { content: chunk } = JSON.parse(data);
        if (chunk) onChunk(chunk);
      } catch {
        // ignora linha malformada
      }
    }
  }
}

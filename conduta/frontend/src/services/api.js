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

export async function deleteSession(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao deletar sessão.');
  return res.json();
}

export async function submitFeedback(messageId, feedback) {
  const res = await fetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message_id: messageId, feedback }),
  });
  if (!res.ok) throw new Error('Erro ao enviar feedback.');
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

// ── Admin Knowledge ────────────────────────────────────────────

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || '';

function adminHeaders() {
  return { 'x-admin-secret': ADMIN_SECRET };
}

export async function getPendingKnowledge() {
  const res = await fetch(`${BASE_URL}/admin/knowledge/pending`, {
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao buscar pendentes.');
  return res.json();
}

export async function approveKnowledge(elementId) {
  const res = await fetch(`${BASE_URL}/admin/knowledge/${elementId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ approvedBy: 'admin' }),
  });
  if (!res.ok) throw new Error('Erro ao aprovar.');
  return res.json();
}

export async function rejectKnowledge(elementId) {
  const res = await fetch(`${BASE_URL}/admin/knowledge/${elementId}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao rejeitar.');
  return res.json();
}

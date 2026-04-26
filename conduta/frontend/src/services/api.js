const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('conduta_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function checkUnauthorized(res) {
  if (res.status === 401) {
    let message = 'Sessão expirada. Faça login novamente.';
    try {
      const data = await res.json();
      if (data.code === 'SESSION_KICKED') message = data.error;
    } catch {}
    window.dispatchEvent(new CustomEvent('conduta:unauthorized', { detail: { message } }));
    throw new Error(message);
  }
  return res;
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
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar sessões.');
  return res.json();
}

export async function createSession(titulo) {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ titulo }),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao criar sessão.');
  return res.json();
}

export async function getSession(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar sessão.');
  return res.json();
}

export async function deleteSession(id) {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao deletar sessão.');
  return res.json();
}

export async function submitFeedback(messageId, feedback, note) {
  const res = await fetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message_id: messageId, feedback, note: note || undefined }),
  });
  await checkUnauthorized(res);
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

  await checkUnauthorized(res);
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
// Rotas admin exigem JWT com role = 'admin' (Bearer token normal).

export async function getPendingKnowledge() {
  const res = await fetch(`${BASE_URL}/admin/knowledge/pending`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao buscar pendentes.');
  return res.json();
}

export async function approveKnowledge(elementId) {
  const res = await fetch(`${BASE_URL}/admin/knowledge/${elementId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ approvedBy: 'admin' }),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao aprovar.');
  return res.json();
}

export async function rejectKnowledge(elementId) {
  const res = await fetch(`${BASE_URL}/admin/knowledge/${elementId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao rejeitar.');
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${BASE_URL}/admin/knowledge/documents`, {
    headers: authHeaders(),
  });
  await checkUnauthorized(res);
  if (!res.ok) throw new Error('Erro ao listar documentos.');
  return res.json();
}

export async function uploadDocument(file, fonte) {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('fonte', fonte);
  const res = await fetch(`${BASE_URL}/admin/knowledge/documents`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  await checkUnauthorized(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao importar PDF.');
  }
  return res.json();
}
